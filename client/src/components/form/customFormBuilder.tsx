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
import { Textarea } from "@/components/ui/textarea";
import { type FieldType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().max(500).optional(),
    targetEntity: z.enum(["client", "user", "appointment"]),
    isActive: z.boolean(),
    fields: z.array(
        z.object({
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
                        value: z.string(),
                    })
                )
                .optional(),
            validationRules: z
                .object({
                    min: z.number().optional(),
                    max: z.number().optional(),
                    minLength: z.number().optional(),
                    maxLength: z.number().optional(),
                    pattern: z.string().optional(),
                })
                .optional(),
        })
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
            name: defaultValues?.name ?? "",
            description: defaultValues?.description ?? "",
            targetEntity: defaultValues?.targetEntity ?? "client",
            isActive: defaultValues?.isActive ?? true,
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

    // Preprocess form data to convert null to undefined for optional fields
    const handleFormSubmit = (values: CustomFormBuilderValues) => {
        const processedValues = {
            ...values,
            fields: values.fields.map(field => ({
                ...field,
                placeholder: field.placeholder || undefined,
                defaultValue: field.defaultValue || undefined,
            })),
        };
        return onSubmit(processedValues);
    };

    return (
        <Form {...form}>
            <form
                id="custom-form-builder"
                onSubmit={form.handleSubmit(
                    handleFormSubmit,
                    (errors) => {
                        console.error("Form validation errors:", errors);
                    }
                )}
                className="space-y-6"
            >
                {/* Basic Information */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Form Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Client Additional Information"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this form is for..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="targetEntity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Applies To</FormLabel>
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
                                            <SelectItem value="client">Clients</SelectItem>
                                            <SelectItem value="user">Users</SelectItem>
                                            <SelectItem value="appointment">
                                                Rides/Appointments
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Active</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Form is active and will appear in the interface
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Custom Fields */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Custom Fields</h3>
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
                                                {/* Field Key */}
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.fieldKey`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Field Key (Unique ID)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <p className="text-xs text-muted-foreground">
                                                                Used for data storage. Only
                                                                alphanumeric and underscores.
                                                            </p>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

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
                                                                        Dropdown (Select)
                                                                    </SelectItem>
                                                                    <SelectItem value="radio">
                                                                        Radio Buttons
                                                                    </SelectItem>
                                                                    <SelectItem value="checkbox">
                                                                        Checkbox (Boolean)
                                                                    </SelectItem>
                                                                    <SelectItem value="checkboxGroup">
                                                                        Checkbox Group
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Placeholder */}
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.placeholder`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Placeholder Text (Optional)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Default Value */}
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.defaultValue`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Default Value (Optional)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ""} />
                                                            </FormControl>
                                                            <p className="text-xs text-muted-foreground">
                                                                Pre-fill this field with a default
                                                                value
                                                            </p>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
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

                                                {/* Validation Rules */}
                                                <ValidationRulesEditor
                                                    form={form}
                                                    fieldIndex={index}
                                                    fieldType={fields[index].fieldType}
                                                />

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
        const newOption = { label: "", value: "" };
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
                                            <Input placeholder="Display label" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`fields.${fieldIndex}.options.${optionIndex}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Value" {...field} />
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

// Validation Rules Editor Component
function ValidationRulesEditor({
    form,
    fieldIndex,
    fieldType,
}: {
    form: any;
    fieldIndex: number;
    fieldType: FieldType;
}) {
    const showMinMax = ["number"].includes(fieldType);
    const showLength = ["text", "textarea"].includes(fieldType);

    if (!showMinMax && !showLength) return null;

    return (
        <div className="space-y-3 p-4 border rounded-lg">
            <FormLabel>Validation Rules (Optional)</FormLabel>

            <div className="grid grid-cols-2 gap-4">
                {showMinMax && (
                    <>
                        <FormField
                            control={form.control}
                            name={`fields.${fieldIndex}.validationRules.min`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">Minimum Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`fields.${fieldIndex}.validationRules.max`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">Maximum Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </>
                )}

                {showLength && (
                    <>
                        <FormField
                            control={form.control}
                            name={`fields.${fieldIndex}.validationRules.minLength`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">Minimum Length</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`fields.${fieldIndex}.validationRules.maxLength`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm">Maximum Length</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
