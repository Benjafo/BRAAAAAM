import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type CustomForm, type CustomFormField } from "@/lib/types";
import { http } from "@/services/auth/serviceResolver";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { type Control, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";

type Props<T extends FieldValues> = {
    control: Control<T>;
    entityType: "client" | "user" | "appointment";
    disabled?: boolean;
    setError: UseFormSetError<T>;
};

// ai helped with this... not sure if this is great but seems like the simplest way to required fields
export type DynamicFormFieldsRef = {
    validateCustomFields: (customFields: Record<string, any>) => boolean;
};

function DynamicFormFieldsInner<T extends FieldValues>(
    { control, entityType, disabled = false, setError }: Props<T>,
    ref: React.Ref<DynamicFormFieldsRef>
) {
    const [customForm, setCustomForm] = useState<CustomForm | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomForm = async () => {
            try {
                const forms = await http
                    .get(`o/custom-forms?entity=${entityType}`)
                    .json<CustomForm[]>();

                if (forms.length > 0) {
                    setCustomForm(forms[0]);
                }
            } catch (error) {
                console.error("Failed to fetch custom form:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomForm();
    }, [entityType]);

    // Expose validation function to parent
    // again, ai helped with this
    useImperativeHandle(ref, () => ({
        validateCustomFields: (customFields: Record<string, any>) => {
            if (!customForm?.fields) return true;

            let isValid = true;

            for (const field of customForm.fields) {
                if (field.isRequired) {
                    const value = customFields?.[field.fieldKey];
                    // Check if value is empty, null, undefined, or empty string
                    if (value === null || value === undefined || value === "") {
                        setError(`customFields.${field.fieldKey}` as Path<T>, {
                            type: "required",
                            message: `${field.label} is required`,
                        });
                        isValid = false;
                    }
                }
            }

            return isValid;
        },
    }));

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading custom fields...</div>;
    }

    if (!customForm || !customForm.fields || customForm.fields.length === 0) {
        return null;
    }

    // Sort fields by display order
    const sortedFields = [...customForm.fields].sort((a, b) => a.displayOrder - b.displayOrder);

    return (
        <div className="space-y-4">
            {sortedFields.map((field) => (
                <DynamicField key={field.id} field={field} control={control} disabled={disabled} />
            ))}
        </div>
    );
}

const DynamicFormFields = forwardRef(DynamicFormFieldsInner) as <T extends FieldValues>(
    props: Props<T> & { ref?: React.Ref<DynamicFormFieldsRef> }
) => ReturnType<typeof DynamicFormFieldsInner>;

export default DynamicFormFields;

type DynamicFieldProps<T extends FieldValues> = {
    field: CustomFormField;
    control: Control<T>;
    disabled: boolean;
};

function DynamicField<T extends FieldValues>({ field, control, disabled }: DynamicFieldProps<T>) {
    // Use field key as the form field name, prefixed to avoid conflicts
    const fieldName = `customFields.${field.fieldKey}` as Path<T>;

    const renderFieldInput = (onChange: (value: any) => void, value: any) => {
        switch (field.fieldType) {
            case "text":
                return (
                    <Input
                        placeholder={field.placeholder}
                        disabled={disabled}
                        value={value || field.defaultValue || ""}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );

            case "textarea":
                return (
                    <Textarea
                        placeholder={field.placeholder}
                        disabled={disabled}
                        value={value || field.defaultValue || ""}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );

            case "number":
                return (
                    <Input
                        type="number"
                        placeholder={field.placeholder}
                        disabled={disabled}
                        value={value || field.defaultValue || ""}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
                    />
                );

            case "date":
                return (
                    <Input
                        type="date"
                        placeholder={field.placeholder}
                        disabled={disabled}
                        value={value || field.defaultValue || ""}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );

            case "select":
                return (
                    <Select
                        disabled={disabled}
                        value={value || field.defaultValue || ""}
                        onValueChange={onChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case "radio":
                return (
                    <RadioGroup
                        disabled={disabled}
                        value={value || field.defaultValue || ""}
                        onValueChange={onChange}
                    >
                        {field.options?.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={option.value} />
                                <Label htmlFor={option.value}>{option.label}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case "checkbox":
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            disabled={disabled}
                            checked={value || field.defaultValue === "true"}
                            onCheckedChange={onChange}
                        />
                        <Label>{field.label}</Label>
                    </div>
                );

            case "checkboxGroup":
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                    disabled={disabled}
                                    checked={selectedValues.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            onChange([...selectedValues, option.value]);
                                        } else {
                                            onChange(
                                                selectedValues.filter((v) => v !== option.value)
                                            );
                                        }
                                    }}
                                />
                                <Label>{option.label}</Label>
                            </div>
                        ))}
                    </div>
                );

            default:
                return <div>Unsupported field type</div>;
        }
    };

    return (
        <FormField
            control={control}
            name={fieldName}
            rules={{
                required: field.isRequired ? `${field.label} is required` : false,
            }}
            render={({ field: formField }) => (
                <FormItem>
                    {field.fieldType !== "checkbox" && (
                        <FormLabel>
                            {field.label}
                            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </FormLabel>
                    )}
                    <FormControl>
                        {renderFieldInput(formField.onChange, formField.value)}
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
