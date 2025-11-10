"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

const recurringUnavailabilitySchema = z
    .object({
        day: z.enum(
            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            {
                message: "Please select a valid day.",
            }
        ),
        allDay: z.boolean(),
        startTime: z.string().min(1, "Please select a time.").optional(),
        endTime: z.string().min(1, "Please select a time.").optional(),
        reason: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        // Validate times when not allDay
        if (!data.allDay) {
            // Check startTime is not empty
            if (!data.startTime) {
                ctx.addIssue({
                    code: "custom",
                    path: ["startTime"],
                    message: "Please select a start time",
                });
            }

            // Check endTime is not empty
            if (!data.endTime) {
                ctx.addIssue({
                    code: "custom",
                    path: ["endTime"],
                    message: "Please select an end time",
                });
            }

            // Check endTime is after startTime
            if (data.startTime && data.endTime && data.startTime >= data.endTime) {
                ctx.addIssue({
                    code: "custom",
                    path: ["endTime"],
                    message: "End time must be after start time",
                });
            }
        }
    });

export type RecurringUnavailabilityFormValues = z.infer<typeof recurringUnavailabilitySchema>;

type Props = {
    defaultValues?: Partial<RecurringUnavailabilityFormValues>;
    onSubmit: (values: RecurringUnavailabilityFormValues) => void | Promise<void>;
};

export default function RecurringUnavailabilityForm({ defaultValues, onSubmit }: Props) {
    const form = useForm({
        resolver: zodResolver(recurringUnavailabilitySchema),
        mode: "onBlur",
        defaultValues: {
            day: defaultValues?.day,
            allDay: defaultValues?.allDay ?? false,
            startTime: defaultValues?.startTime ?? "08:00",
            endTime: defaultValues?.endTime ?? "10:00",
            reason: defaultValues?.reason ?? "",
        },
    });

    const allDay = form.watch("allDay");

    return (
        <Form {...form}>
            <form
                id="recurring-unavailability-form"
                className="space-y-5"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* Day of week */}
                <FormField
                    control={form.control}
                    name="day"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Day of Week</FormLabel>
                            <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select a day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Monday">Monday</SelectItem>
                                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                                        <SelectItem value="Thursday">Thursday</SelectItem>
                                        <SelectItem value="Friday">Friday</SelectItem>
                                        <SelectItem value="Saturday">Saturday</SelectItem>
                                        <SelectItem value="Sunday">Sunday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* All-day toggle */}
                <FormField
                    control={form.control}
                    name="allDay"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                                />
                            </FormControl>
                            <FormLabel className="font-normal">
                                Check if unavailable for entire day
                            </FormLabel>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Time range */}
                {!allDay && (
                    <div className="grid grid-cols-1 gap-4 w-full md:col-span-2">
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Starting Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ending Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Weekly team meeting" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
