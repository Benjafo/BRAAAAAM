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
import { useEffect, useState } from "react";
import { type Control, type FieldValues, type Path } from "react-hook-form";

type Props<T extends FieldValues> = {
    control: Control<T>;
    entityType: "client" | "user" | "appointment";
    disabled?: boolean;
};

export default function DynamicFormFields<T extends FieldValues>({
    control,
    entityType,
    disabled = false,
}: Props<T>) {
    const [customForm, setCustomForm] = useState<CustomForm | null>(null);
    const [loading, setLoading] = useState(true);
    const orgID = "braaaaam"; // TODO: Get from context

    useEffect(() => {
        const fetchCustomForm = async () => {
            try {
                const forms = await http
                    .get(`o/${orgID}/custom-forms?entity=${entityType}`)
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
    }, [entityType, orgID]);

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
                        min={field.validationRules?.min}
                        max={field.validationRules?.max}
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
                ...(field.validationRules?.minLength && {
                    minLength: {
                        value: field.validationRules.minLength,
                        message: `Minimum length is ${field.validationRules.minLength}`,
                    },
                }),
                ...(field.validationRules?.maxLength && {
                    maxLength: {
                        value: field.validationRules.maxLength,
                        message: `Maximum length is ${field.validationRules.maxLength}`,
                    },
                }),
                ...(field.validationRules?.pattern && {
                    pattern: {
                        value: new RegExp(field.validationRules.pattern),
                        message: "Invalid format",
                    },
                }),
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
                    {field.helpText && (
                        <p className="text-sm text-muted-foreground">{field.helpText}</p>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
