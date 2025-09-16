"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function RecurringUnavailabilityModal({
  trigger,
  initial,
  onSave,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<RecurringUnavailability>({
    day: "",
    allDay: false,
    startTime: "08:00",
    endTime: "11:00",
    ...(initial ?? {}),
  });

  const save = () => {
    if (!form.day) {
      alert("Please select a day of week.");
      return;
    }
    if (!form.allDay && (!form.startTime || !form.endTime)) {
      alert("Please fill start and end time or mark as entire day.");
      return;
    }
    onSave?.(form);
    setOpen(false);
  };

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

        <div className="space-y-5">
          {/* Day of week */}
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select
              value={form.day}
              onValueChange={(v: RecurringUnavailability["day"]) =>
                setForm((s) => ({ ...s, day: v }))
              }
            >
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
          </div>

          {/* all-day */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allDay"
              checked={form.allDay}
              onCheckedChange={(v) =>
                setForm((s) => ({ ...s, allDay: Boolean(v) }))
              }
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
                value={form.startTime}
                onChange={(e) =>
                  setForm((s) => ({ ...s, startTime: e.target.value }))
                }
                disabled={form.allDay}
              />
            </div>
            <div className="space-y-2">
              <Label>Ending Time</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm((s) => ({ ...s, endTime: e.target.value }))
                }
                disabled={form.allDay}
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
