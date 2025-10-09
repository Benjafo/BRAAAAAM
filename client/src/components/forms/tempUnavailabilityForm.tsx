"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";

export type TempUnavailabilityFormValues = {
    multiDay: boolean;
    allDay: boolean;
    startDate: Date | undefined;
    endDate?: Date | undefined;
    startTime: string;
    endTime: string;
};

const schema = z
    .object({
        multiDay: z.boolean(),
        allDay: z.boolean(),
        startDate: z
            .any()
            .refine((v): v is Date => v instanceof Date, { message: "Pick a start date" }),
        endDate: z.any().optional(),
        startTime: z.string(),
        endTime: z.string(),
    })
    .refine((v) => !v.multiDay || v.endDate instanceof Date, {
        path: ["endDate"],
        message: "Pick an end date",
    })
    .refine((v) => v.allDay || v.startTime.trim().length > 0, {
        path: ["startTime"],
        message: "Pick a start time",
    })
    .refine((v) => v.allDay || v.endTime.trim().length > 0, {
        path: ["endTime"],
        message: "Pick an end time",
    });

type Props = {
    defaultValues?: Partial<TempUnavailabilityFormValues>;
    onSubmit: (values: TempUnavailabilityFormValues) => Promise<void> | void;
    submitLabel?: string;
};

export default function TempUnavailabilityForm({
    defaultValues,
    onSubmit,
    submitLabel = "Save",
}: Props) {
    const form = useForm<TempUnavailabilityFormValues>({
        resolver: zodResolver(schema),
        mode: "onBlur",
        defaultValues: {
            multiDay: false,
            allDay: false,
            startDate: new Date(),
            endDate: undefined,
            startTime: "08:00",
            endTime: "11:00",
            ...defaultValues,
        },
    });

    const multiDay = form.watch("multiDay");
    const allDay = form.watch("allDay");

    const DateButton = ({
        value,
        placeholder,
        onSelect,
    }: {
        value?: Date;
        placeholder: string;
        onSelect: (d?: Date) => void;
    }) => (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "MM/dd/yyyy") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
                <Calendar mode="single" selected={value} onSelect={onSelect} initialFocus />
            </PopoverContent>
        </Popover>
    );

    return (
        <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
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

                <div className="space-y-2">
                    <Label>Select Date Unavailable</Label>
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <DateButton
                                        value={field.value}
                                        onSelect={(d) => d && field.onChange(d)}
                                        placeholder="Pick a date"
                                    />
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
                                <FormItem className="mt-2">
                                    <Label className="mb-1 block">End Date</Label>
                                    <FormControl>
                                        <DateButton
                                            value={field.value}
                                            onSelect={(d) => d && field.onChange(d)}
                                            placeholder="Pick an end date"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="flex justify-end">
                    <Button type="submit">{submitLabel}</Button>
                </div>
            </form>
        </Form>
    );
}
