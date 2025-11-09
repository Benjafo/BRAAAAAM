"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { DatePickerInput } from "../ui/datePickerField";

const schema = z
    .object({
        multiDay: z.boolean(),
        allDay: z.boolean(),
        startDate: z.date("Please select a date."),
        endDate: z.date("Please select a date").optional(),
        startTime: z.string().min(1, "Please select a time.").optional(),
        endTime: z.string().min(1, "Please select a time.").optional(),
        reason: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        // Validate endDate is required when multiDay is true
        if (data.multiDay && !data.endDate) {
            ctx.addIssue({
                code: "custom",
                path: ["endDate"],
                message: "Please select an end date",
            });
        }

        // Validate multiDay: endDate must be after startDate
        if (data.multiDay && data.endDate && data.endDate < data.startDate) {
            ctx.addIssue({
                code: "custom",
                path: ["endDate"],
                message: "End date must be after or equal to start date",
            });
        }

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

export type TempUnavailabilityFormValues = z.infer<typeof schema>;

type Props = {
    defaultValues?: Partial<TempUnavailabilityFormValues>;
    onSubmit: (values: TempUnavailabilityFormValues) => Promise<void> | void;
};

export default function TempUnavailabilityForm({ defaultValues, onSubmit }: Props) {
    const form = useForm({
        resolver: zodResolver(schema),
        mode: "onBlur",
        defaultValues: {
            multiDay: false,
            allDay: false,
            startDate: defaultValues?.startDate ?? new Date(),
            endDate: defaultValues?.endDate,
            startTime: defaultValues?.startTime ?? "08:00",
            endTime: defaultValues?.endTime ?? "10:00",
            reason: defaultValues?.reason ?? "",
        },
    });

    const multiDay = form.watch("multiDay");
    const allDay = form.watch("allDay");

    return (
        <Form {...form}>
            <form
                id="temp-unavailability-form"
                className="space-y-5"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                <FormField
                    control={form.control}
                    name="multiDay"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                                />
                            </FormControl>
                            <FormLabel className="font-normal">
                                Check if unavailable for multiple days
                            </FormLabel>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                                <DatePickerInput value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {multiDay && (
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                    <DatePickerInput
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

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

                {!allDay && (
                    <div className="grid grid-cols-1 gap-4 w-full ">
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
                                <Input placeholder="e.g., Doctor appointment" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
