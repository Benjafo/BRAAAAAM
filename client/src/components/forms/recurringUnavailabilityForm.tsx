"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
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

/* ----------------------------- Zod Schema ----------------------------- */
const timeRegex = /^\d{2}:\d{2}$/;

const recurringUnavailabilitySchema = z
  .object({
    day: z.string().min(1, "Select a day"),
    allDay: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
  // if not all-day, require both times and basic HH:MM
  .refine(
    (v) => {
      if (v.allDay) return true;
      return (
        !!v.startTime &&
        !!v.endTime &&
        timeRegex.test(v.startTime) &&
        timeRegex.test(v.endTime)
      );
    },
    { message: "Provide start and end time (HH:MM)", path: ["startTime"] }
  );

export type RecurringUnavailabilityFormValues = z.infer<
  typeof recurringUnavailabilitySchema
>;

/* -------------------------------- Props -------------------------------- */
type Props = {
  defaultValues?: Partial<RecurringUnavailabilityFormValues>;
  onSubmit: (values: RecurringUnavailabilityFormValues) => void | Promise<void>;
  submitLabel?: string;
};

/* --------------------------------- Form --------------------------------- */
export default function RecurringUnavailabilityForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
}: Props) {
  const form = useForm<RecurringUnavailabilityFormValues>({
    resolver: zodResolver(recurringUnavailabilitySchema),
    mode: "onBlur",
    defaultValues: {
      day: "",
      allDay: false,
      startTime: "08:00",
      endTime: "11:00",
      ...defaultValues,
    },
  });

  const allDay = form.watch("allDay");

  const handleSubmit: SubmitHandler<RecurringUnavailabilityFormValues> = async (
    values
  ) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
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
                    <SelectValue placeholder="select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mon">Monday</SelectItem>
                    <SelectItem value="Tue">Tuesday</SelectItem>
                    <SelectItem value="Wed">Wednesday</SelectItem>
                    <SelectItem value="Thu">Thursday</SelectItem>
                    <SelectItem value="Fri">Friday</SelectItem>
                    <SelectItem value="Sat">Saturday</SelectItem>
                    <SelectItem value="Sun">Sunday</SelectItem>
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
            </FormItem>
          )}
        />

        {/* Time range */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Starting Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} disabled={allDay} />
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
                  <Input type="time" {...field} disabled={allDay} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-1">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
