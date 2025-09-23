"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

/* ----------------------------- Types ------------------------------ */
export type RecurringUnavailability = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun" | "";
  allDay: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "11:00"
};

type Props = {
  trigger?: React.ReactNode;
  initial?: Partial<RecurringUnavailability>;
  onSave?: (val: RecurringUnavailability) => void;
};

/* ----------------------------- Zod Schema ------------------------- */
const dayList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const schema = z
  .object({
    day: z
      .string()
      .min(1, "Select a day of week")
      .refine((v): v is RecurringUnavailability["day"] => (dayList as readonly string[]).includes(v), {
        message: "Select a valid day",
      }),
    allDay: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  })
  // when not all-day, both times are required
  .refine((v) => (v.allDay ? true : v.startTime.trim().length > 0), {
    path: ["startTime"],
    message: "Pick a start time",
  })
  .refine((v) => (v.allDay ? true : v.endTime.trim().length > 0), {
    path: ["endTime"],
    message: "Pick an end time",
  });

type RecurringForm = z.infer<typeof schema>;

/* ----------------------------- Component -------------------------- */
export default function RecurringUnavailabilityModal({
  trigger,
  initial,
  onSave,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<RecurringForm>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      day: (initial?.day as RecurringUnavailability["day"]) ?? "",
      allDay: initial?.allDay ?? false,
      startTime: initial?.startTime ?? "08:00",
      endTime: initial?.endTime ?? "11:00",
    },
  });

  const allDay = form.watch("allDay");

  async function submit(values: RecurringForm) {
    const out: RecurringUnavailability = {
      day: values.day as RecurringUnavailability["day"],
      allDay: values.allDay,
      startTime: values.allDay ? "" : values.startTime,
      endTime: values.allDay ? "" : values.endTime,
    };
    onSave?.(out);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* white trigger button */}
        {trigger ?? <Button variant="outline">Recurring Unavailability</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Schedule Unavailability</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
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

            {/* all-day */}
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Check if unavailable for entire day
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* time range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Time</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={allDay} {...field} />
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
                      <Input type="time" disabled={allDay} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
