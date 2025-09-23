"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

/* ----------------------------- Types ------------------------------ */
export type TempUnavailability = {
  multiDay: boolean;
  allDay: boolean;
  startDate: Date | null;
  endDate: Date | null;   // only used when multiDay = true
  startTime: string;      // "08:00"
  endTime: string;        // "11:00"
};

type Props = {
  trigger?: React.ReactNode;
  initial?: Partial<TempUnavailability>;
  onSave?: (data: TempUnavailability) => void;
};

/* ----------------------------- Zod Schema ------------------------- */
const schema = z
  .object({
    multiDay: z.boolean(),
    allDay: z.boolean(),
    // Validate we actually have a Date for startDate
    startDate: z.any().refine((v): v is Date => v instanceof Date, {
      message: "Pick a start date",
    }),
    // Optional endDate; required only when multiDay is true (see refine below)
    endDate: z.any().optional(),
    // Times required unless allDay checked (handled in refine below)
    startTime: z.string(),
    endTime: z.string(),
  })
  .refine(
    (v) => (v.multiDay ? v.endDate instanceof Date : true),
    { path: ["endDate"], message: "Pick an end date" }
  )
  .refine(
    (v) => (v.allDay ? true : v.startTime.trim().length > 0),
    { path: ["startTime"], message: "Pick a start time" }
  )
  .refine(
    (v) => (v.allDay ? true : v.endTime.trim().length > 0),
    { path: ["endTime"], message: "Pick an end time" }
  );

type UnavailForm = z.infer<typeof schema>;

/* ----------------------------- Component -------------------------- */
export default function TempUnavailabilityModal({ trigger, initial, onSave }: Props) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<UnavailForm>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      multiDay: initial?.multiDay ?? false,
      allDay: initial?.allDay ?? false,
      startDate: initial?.startDate ?? new Date(),
      endDate: initial?.endDate ?? undefined, // undefined in form until picked
      startTime: initial?.startTime ?? "08:00",
      endTime: initial?.endTime ?? "11:00",
    },
  });

  const multiDay = form.watch("multiDay");
  const allDay = form.watch("allDay");

  async function onSubmit(values: UnavailForm) {
    // Normalize to the outward TempUnavailability shape
    const out: TempUnavailability = {
      multiDay: values.multiDay,
      allDay: values.allDay,
      startDate: values.startDate ?? null,
      endDate: values.multiDay ? ((values.endDate as Date) ?? null) : null,
      startTime: values.allDay ? "" : values.startTime,
      endTime: values.allDay ? "" : values.endTime,
    };

    onSave?.(out);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Add Unavailability</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add a Temporary Unavailability</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            {/* multiple days */}
            <FormField
              control={form.control}
              name="multiDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Check if unavailable for multiple days
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* start date (and end date if multi-day) */}
            <div className="space-y-2">
              <FormLabel>Select Date Unavailable</FormLabel>

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DateButton
                        value={field.value as Date}
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
                      <FormLabel className="mb-1 block">End Date</FormLabel>
                      <FormControl>
                        <DateButton
                          value={(field.value as Date) ?? undefined}
                          onSelect={(d) => field.onChange(d)}
                          placeholder="Pick an end date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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

/* ----------------------- Small UI helper ------------------------- */
function DateButton({
  value,
  onSelect,
  placeholder,
}: {
  value?: Date;
  onSelect: (d?: Date) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
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
}
