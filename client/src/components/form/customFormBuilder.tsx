import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type FieldType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Utility function to convert string to snake_case
function toSnakeCase(str: string): string {
    return str
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
}

// Utility to validate and format date strings, AI helped on this
function isValidDate(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

function formatDateForInput(dateString: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
}

const formSchema = z.object({
    fields: z.array(
        z
            .object({
                fieldKey: z
                    .string()
                    .min(1)
                    .max(100)
                    .regex(/^[a-zA-Z0-9_]+$/, "Only alphanumeric and underscores"),
                label: z.string().min(1).max(255),
                fieldType: z.enum([
                    "text",
                    "textarea",
                    "number",
                    "date",
                    "select",
                    "radio",
                    "checkbox",
                    "checkboxGroup",
                ]),
                placeholder: z.string().max(255).nullable().optional(),
                defaultValue: z.string().nullable().optional(),
                isRequired: z.boolean(),
                options: z
                    .array(
                        z.object({
                            label: z.string(),
                            value: z.string().optional(),
                        })
                    )
                    .optional(),
            })
            .refine(
                (field) => {
                    // Only validate mutual exclusivity for fields that support placeholders
                    const supportsPlaceholder = !["checkbox", "radio", "checkboxGroup"].includes(
                        field.fieldType
                    );
                    if (!supportsPlaceholder) return true;

                    const hasPlaceholder = field.placeholder && field.placeholder.trim() !== "";
                    const hasDefaultValue = field.defaultValue && field.defaultValue.trim() !== "";
                    return !(hasPlaceholder && hasDefaultValue);
                },
                {
                    message: "Cannot have both placeholder and default value",
                    path: ["placeholder"],
                }
            )
            .refine(
                (field) => {
                    // Validate date format for date fields with default values
                    if (field.fieldType === "date" && field.defaultValue) {
                        return isValidDate(field.defaultValue);
                    }
                    return true;
                },
                {
                    message: "Invalid date format. Use YYYY-MM-DD",
                    path: ["defaultValue"],
                }
            )
            .refine(
                (field) => {
                    // Validate number format for number fields with default values
                    if (field.fieldType === "number" && field.defaultValue) {
                        return !isNaN(Number(field.defaultValue));
                    }
                    return true;
                },
                {
                    message: "Default value must be a valid number",
                    path: ["defaultValue"],
                }
            )
    ),
});

export type CustomFormBuilderValues = z.infer<typeof formSchema>;

type Props = {
    defaultValues?: Partial<CustomFormBuilderValues>;
    onSubmit: (values: CustomFormBuilderValues) => void | Promise<void>;
};

export default function CustomFormBuilder({ defaultValues, onSubmit }: Props) {
    const [expandedField, setExpandedField] = useState<string | null>(null);

    const form = useForm<CustomFormBuilderValues>({
        resolver: zodResolver(formSchema),
        mode: "onBlur",
        defaultValues: {
            fields: defaultValues?.fields ?? [],
        },
    });

    const fields = form.watch("fields");

    const addField = () => {
        const newField = {
            fieldKey: `field_${Date.now()}`,
            label: "New Field",
            fieldType: "text" as FieldType,
            placeholder: undefined,
            defaultValue: undefined,
            isRequired: false,
            options: [],
        };
        form.setValue("fields", [...fields, newField]);
        setExpandedField(newField.fieldKey);
    };

    const removeField = (index: number) => {
        const updated = fields.filter((_, i) => i !== index);
        form.setValue("fields", updated);
    };

    const moveField = (index: number, direction: "up" | "down") => {
        const newFields = [...fields];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newFields.length) return;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        form.setValue("fields", newFields);
    };

    const fieldTypeRequiresOptions = (type: FieldType) => {
        return ["select", "radio", "checkboxGroup"].includes(type);
    };

    const fieldTypeSupportsPlaceholder = (type: FieldType) => {
        return !["checkbox", "radio", "checkboxGroup", "date"].includes(type);
    };

    // Preprocess form data to convert null to undefined for optional fields
    // and auto-generate option values from labels
    const handleFormSubmit = (values: CustomFormBuilderValues) => {
        const processedValues = {
            ...values,
            fields: values.fields.map((field) => ({
                ...field,
                placeholder: field.placeholder || undefined,
                defaultValue: field.defaultValue || undefined,
                options: field.options?.map((option) => ({
                    label: option.label,
                    value: toSnakeCase(option.label),
                })),
            })),
        };
        return onSubmit(processedValues);
    };

    return (
        <Form {...form}>
            <form
                id="custom-form-builder"
                onSubmit={form.handleSubmit(handleFormSubmit, (errors) => {
                    console.error("Form validation errors:", errors);
                })}
                className="space-y-6"
            >
                {/* Custom Fields */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Define custom fields for this form.
                        </p>
                        <Button type="button" onClick={addField} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Field
                        </Button>
                    </div>

                    {fields.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No custom fields yet. Click "Add Field" to create one.
                            </CardContent>
                        </Card>
                    ) : (
                        <Accordion
                            type="single"
                            collapsible
                            value={expandedField || undefined}
                            onValueChange={setExpandedField}
                        >
                            {fields.map((field, index) => (
                                <AccordionItem key={index} value={field.fieldKey}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3 flex-1">
                                            <GripVertical className="w-5 h-5 text-muted-foreground" />
                                            <div className="flex-1 text-left">
                                                <span className="font-medium">{field.label}</span>
                                                <span className="ml-2 text-sm text-muted-foreground">
                                                    ({field.fieldType})
                                                </span>
                                                {field.isRequired && (
                                                    <span className="ml-2 text-xs text-red-500">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Card>
                                            <CardContent className="pt-6 space-y-4">
                                                {/* Label */}
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.label`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Display Label</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Field Type */}
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.fieldType`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Field Type</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="text">
                                                                        Text (Single Line)
                                                                    </SelectItem>
                                                                    <SelectItem value="textarea">
                                                                        Text Area (Multi-line)
                                                                    </SelectItem>
                                                                    <SelectItem value="number">
                                                                        Number
                                                                    </SelectItem>
                                                                    <SelectItem value="date">
                                                                        Date
                                                                    </SelectItem>
                                                                    <SelectItem value="select">
                                                                        Dropdown
                                                                    </SelectItem>
                                                                    <SelectItem value="radio">
                                                                        Radio Buttons
                                                                    </SelectItem>
                                                                    <SelectItem value="checkbox">
                                                                        Checkbox (Single)
                                                                    </SelectItem>
                                                                    <SelectItem value="checkboxGroup">
                                                                        Checkbox (Group)
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Placeholder */}
                                                {fieldTypeSupportsPlaceholder(
                                                    fields[index].fieldType
                                                ) && (
                                                    <FormField
                                                        control={form.control}
                                                        name={`fields.${index}.placeholder`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Placeholder Text (Optional)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        value={field.value ?? ""}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}

                                                {/* Default Value */}
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.defaultValue`}
                                                    render={({ field }) => {
                                                        const currentField = fields[index];
                                                        const isCheckbox =
                                                            currentField.fieldType === "checkbox";
                                                        const isDate =
                                                            currentField.fieldType === "date";
                                                        const isNumber =
                                                            currentField.fieldType === "number";
                                                        const hasOptions = fieldTypeRequiresOptions(
                                                            currentField.fieldType
                                                        );
                                                        const fieldOptions =
                                                            currentField.options || [];

                                                        return (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Default Value (Optional)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    {isCheckbox ? (
                                                                        <Select
                                                                            onValueChange={
                                                                                field.onChange
                                                                            }
                                                                            value={
                                                                                field.value ?? ""
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select default state" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="true">
                                                                                    Checked
                                                                                </SelectItem>
                                                                                <SelectItem value="false">
                                                                                    Unchecked
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    ) : isDate ? (
                                                                        <Input
                                                                            type="date"
                                                                            {...field}
                                                                            value={formatDateForInput(
                                                                                field.value ?? ""
                                                                            )}
                                                                        />
                                                                    ) : isNumber ? (
                                                                        <Input
                                                                            type="number"
                                                                            {...field}
                                                                            value={
                                                                                field.value ?? ""
                                                                            }
                                                                        />
                                                                    ) : hasOptions ? (
                                                                        <Select
                                                                            onValueChange={
                                                                                field.onChange
                                                                            }
                                                                            value={
                                                                                field.value ?? ""
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select default option" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {fieldOptions
                                                                                    .filter(
                                                                                        (
                                                                                            option: any
                                                                                        ) =>
                                                                                            option.label &&
                                                                                            option.label.trim() !==
                                                                                                ""
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            option: any,
                                                                                            optIdx: number
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    optIdx
                                                                                                }
                                                                                                value={toSnakeCase(
                                                                                                    option.label
                                                                                                )}
                                                                                            >
                                                                                                {
                                                                                                    option.label
                                                                                                }
                                                                                            </SelectItem>
                                                                                        )
                                                                                    )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    ) : (
                                                                        <Input
                                                                            {...field}
                                                                            value={
                                                                                field.value ?? ""
                                                                            }
                                                                        />
                                                                    )}
                                                                </FormControl>
                                                                {/* AI help here */}
                                                                <p className="text-xs text-muted-foreground">
                                                                    {isDate
                                                                        ? "Pre-fill with a date (YYYY-MM-DD format)"
                                                                        : isNumber
                                                                          ? "Pre-fill with a numeric value"
                                                                          : "Pre-fill this field with a default value"}
                                                                </p>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />

                                                {/* Is Required */}
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.isRequired`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                            <FormLabel>Required Field</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Options (for select, radio, checkboxGroup) */}
                                                {fieldTypeRequiresOptions(
                                                    fields[index].fieldType
                                                ) && (
                                                    <FieldOptionsEditor
                                                        form={form}
                                                        fieldIndex={index}
                                                    />
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-4 border-t">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => moveField(index, "up")}
                                                        disabled={index === 0}
                                                    >
                                                        Move Up
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => moveField(index, "down")}
                                                        disabled={index === fields.length - 1}
                                                    >
                                                        Move Down
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => removeField(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete Field
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            </form>
        </Form>
    );
}

// Field Options Editor Component
function FieldOptionsEditor({ form, fieldIndex }: { form: any; fieldIndex: number }) {
    const options = form.watch(`fields.${fieldIndex}.options`) || [];

    const addOption = () => {
        const newOption = { label: "" };
        form.setValue(`fields.${fieldIndex}.options`, [...options, newOption]);
    };

    const removeOption = (optionIndex: number) => {
        const updated = options.filter((_: unknown, i: number) => i !== optionIndex);
        form.setValue(`fields.${fieldIndex}.options`, updated);
    };

    return (
        <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
                <FormLabel>Options</FormLabel>
                <Button type="button" onClick={addOption} size="sm" variant="outline">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Option
                </Button>
            </div>

            {options.length === 0 ? (
                <p className="text-sm text-muted-foreground">No options defined yet.</p>
            ) : (
                <div className="space-y-2">
                    {options.map((_: unknown, optionIndex: number) => (
                        <div key={optionIndex} className="flex gap-2">
                            <FormField
                                control={form.control}
                                name={`fields.${fieldIndex}.options.${optionIndex}.label`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Option label" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(optionIndex)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
