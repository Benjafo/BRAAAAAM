"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type FormState = {
  client: string;
  purpose: string;
  tripType: "Round Trip" | "One Way" | "";
  date: Date | undefined;
  time: string;
  additionalRider: "Yes" | "No" | "";
  addFirst: string;
  addLast: string;
  driver: string;
  relation: string;
};

export default function CreateRideModal() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    client: "",
    purpose: "",
    tripType: "",
    date: undefined,
    time: "",
    additionalRider: "",
    addFirst: "",
    addLast: "",
    driver: "",
    relation: "",
  });

  const save = () => {
    // TODO: replace with real submit (API call)
    console.log("Create Ride →", form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-md">New Ride</Button>
      </DialogTrigger>

      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>New Ride</DialogTitle>
        </DialogHeader>

        {/* Two-column layout like Figma */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Client */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              value={form.client}
              onValueChange={(v) => setForm((s) => ({ ...s, client: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dropdown here also" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WASPS">WASPS</SelectItem>
                <SelectItem value="Joan Albany">Joan Albany</SelectItem>
                <SelectItem value="Deb Reilley">Deb Reilley</SelectItem>
                <SelectItem value="Audrey Buck">Audrey Buck</SelectItem>
                <SelectItem value="Caren">Caren</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Purpose of trip */}
          <div className="space-y-2">
            <Label>Purpose of trip</Label>
            <Input
              placeholder="Value"
              value={form.purpose}
              onChange={(e) => setForm((s) => ({ ...s, purpose: e.target.value }))}
            />
          </div>

          {/* Date of Trip */}
          <div className="space-y-2">
            <Label>Date of Trip</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.date ? format(form.date, "PPP") : "Calendar picker here"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="bottom" align="start">
                <Calendar
                  mode="single"
                  selected={form.date}
                  onSelect={(d) => setForm((s) => ({ ...s, date: d }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Round Trip / One Way */}
          <div className="space-y-2">
            <Label>Round Trip/One Way</Label>
            <Select
              value={form.tripType}
              onValueChange={(v: "Round Trip" | "One Way") =>
                setForm((s) => ({ ...s, tripType: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Dropdown here" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Round Trip">Round Trip</SelectItem>
                <SelectItem value="One Way">One Way</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Time */}
          <div className="space-y-2">
            <Label>Appointment Time</Label>
            <Input
              type="time"
              placeholder="Time select element here"
              value={form.time}
              onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))}
            />
          </div>

          {/* Additional Rider */}
          <div className="space-y-2">
            <Label>Additional Rider</Label>
            <Select
              value={form.additionalRider}
              onValueChange={(v: "Yes" | "No") =>
                setForm((s) => ({ ...s, additionalRider: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Rider First Name */}
          <div className="space-y-2">
            <Label>Additional Rider First  Name</Label>
            <Input
              placeholder="Value"
              value={form.addFirst}
              onChange={(e) => setForm((s) => ({ ...s, addFirst: e.target.value }))}
            />
          </div>

          {/* Additional Rider Last Name */}
          <div className="space-y-2">
            <Label>Additional Rider Last Name</Label>
            <Input
              placeholder="Value"
              value={form.addLast}
              onChange={(e) => setForm((s) => ({ ...s, addLast: e.target.value }))}
            />
          </div>

          {/* Assigned Driver */}
          <div className="space-y-2">
            <Label>Assigned Driver</Label>
            <Select
              value={form.driver}
              onValueChange={(v) => setForm((s) => ({ ...s, driver: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Driver A">Driver A</SelectItem>
                <SelectItem value="Driver B">Driver B</SelectItem>
                <SelectItem value="Driver C">Driver C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Relationship to Client */}
          <div className="space-y-2">
            <Label>Relationship to Client</Label>
            <Input
              placeholder="Value"
              value={form.relation}
              onChange={(e) => setForm((s) => ({ ...s, relation: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
