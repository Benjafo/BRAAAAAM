import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/datePickerField";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

/* --------------------------------- Schema --------------------------------- */
const volunteerRecordSchema = z.object({
    date: z.date("Date is required"),
    hours: z
        .number({
            message: "Hours is required and must be a number",
        })
        .min(0.25, "Hours must be at least 0.25"),
    miles: z
        .number({
            message: "Miles must be a number",
        })
        .min(0, "Miles must be non-negative")
        .nullable()
        .optional(),
    description: z
        .string()
        .max(500, "Description must be at most 500 characters")
        .optional(),
});

export type VolunteerRecordFormValues = z.infer<typeof volunteerRecordSchema>;

/* ---------------------------------- Form ---------------------------------- */
interface VolunteerRecordFormProps {
    onSubmit: (data: VolunteerRecordFormValues) => void;
    onCancel?: () => void;
    defaultValues?: Partial<VolunteerRecordFormValues>;
    isLoading?: boolean;
}

export function VolunteerRecordForm({
    onSubmit,
    onCancel,
    defaultValues,
    isLoading = false,
}: VolunteerRecordFormProps) {
    const form = useForm<VolunteerRecordFormValues>({
        resolver: zodResolver(volunteerRecordSchema),
        defaultValues: {
            date: defaultValues?.date || new Date(),
            hours: defaultValues?.hours || 0,
            miles: defaultValues?.miles === undefined ? null : defaultValues.miles,
            description: defaultValues?.description || "",
        },
    });

    const handleSubmit = (data: VolunteerRecordFormValues) => {
        onSubmit(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Date */}
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date *</FormLabel>
                            <FormControl>
                                <DatePickerInput
                                    value={field.value}
                                    onChange={(date) => field.onChange(date)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Hours */}
                <FormField
                    control={form.control}
                    name="hours"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Hours *</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    placeholder="Enter hours worked"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === "" ? 0 : parseFloat(value));
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Miles */}
                <FormField
                    control={form.control}
                    name="miles"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Miles (Optional)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="Enter miles driven"
                                    {...field}
                                    value={field.value === null ? "" : field.value || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === "" ? null : parseFloat(value));
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe the volunteer work performed..."
                                    className="resize-none"
                                    rows={4}
                                    maxLength={500}
                                    {...field}
                                />
                            </FormControl>
                            <div className="text-xs text-muted-foreground text-right">
                                {field.value?.length || 0}/500 characters
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Record"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
