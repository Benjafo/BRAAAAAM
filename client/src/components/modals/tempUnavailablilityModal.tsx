"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type TempUnavailability = {
  multiDay: boolean;
  allDay: boolean;
  startDate: Date | null;
  endDate: Date | null;     // only used when multiDay = true
  startTime: string;        // "08:00"
  endTime: string;          // "11:00"
};

type Props = {
  trigger?: React.ReactNode;
  initial?: Partial<TempUnavailability>;
  onSave?: (data: TempUnavailability) => void;
};

export default function TempUnavailabilityModal({ trigger, initial, onSave }: Props) {
  const [open, setOpen] = React.useState(false);

  const [data, setData] = React.useState<TempUnavailability>({
    multiDay: false,
    allDay: false,
    startDate: new Date(),
    endDate: null,
    startTime: "08:00",
    endTime: "11:00",
    ...initial,
  });

  const save = () => {
    if (!data.startDate) {
      alert("Please select a date.");
      return;
    }
    if (data.multiDay && !data.endDate) {
      alert("Please select an end date.");
      return;
    }
    if (!data.allDay && (!data.startTime || !data.endTime)) {
      alert("Please select start and end times.");
      return;
    }
    onSave?.(data);
    setOpen(false);
  };

  const DateField = ({
    value,
    onChange,
    placeholder,
  }: {
    value: Date | null;
    onChange: (d: Date | undefined) => void;
    placeholder: string;
  }) => (
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
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Add Unavailability</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add a Temporary Unavailability</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* multiple days */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiDay"
              checked={data.multiDay}
              onCheckedChange={(v: any) => setData((s) => ({ ...s, multiDay: Boolean(v) }))}
            />
            <Label htmlFor="multiDay" className="font-normal">
              Check if unavailable for multiple days
            </Label>
          </div>

          {/* date(s) */}
          <div className="space-y-2">
            <Label>Select Date Unavailable</Label>
            <DateField
              value={data.startDate}
              onChange={(d) => setData((s) => ({ ...s, startDate: d ?? null }))}
              placeholder="Pick a date"
            />
            {data.multiDay && (
              <div className="mt-2">
                <Label className="mb-1 block">End Date</Label>
                <DateField
                  value={data.endDate}
                  onChange={(d) => setData((s) => ({ ...s, endDate: d ?? null }))}
                  placeholder="Pick an end date"
                />
              </div>
            )}
          </div>

          {/* all-day */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allDay"
              checked={data.allDay}
              onCheckedChange={(v: any) => setData((s) => ({ ...s, allDay: Boolean(v) }))}
            />
            <Label htmlFor="allDay" className="font-normal">
              Check if unavailable for entire day
            </Label>
          </div>

          {/* time range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Starting Time</Label>
              <Input
                type="time"
                value={data.startTime}
                onChange={(e) => setData((s) => ({ ...s, startTime: e.target.value }))}
                disabled={data.allDay}
              />
            </div>
            <div className="space-y-2">
              <Label>Ending Time</Label>
              <Input
                type="time"
                value={data.endTime}
                onChange={(e) => setData((s) => ({ ...s, endTime: e.target.value }))}
                disabled={data.allDay}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
