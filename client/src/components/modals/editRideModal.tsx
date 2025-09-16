"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type Ride = {
  id: string;
  clientName: string;
  driverName: string;
  dispatcherName: string;
  numClients: number | "";
  status: "completed" | "cancelled" | "one-way" | "round-trip" | "scheduled" | "";
  durationHours: number | "";           // e.g. 0.75
  distanceMilesTenths: number | "";     // e.g. 25.0
  donationType: "Check" | "Cash" | "Card" | "";
  donationAmount: number | "";          // e.g. 15.00
};

type Props = {
  ride: Ride;
  onSave?: (updated: Ride) => void; // parent handles persistence
  trigger?: React.ReactNode;        // optional custom trigger
};

export default function EditRideModal({ ride, onSave, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Ride>(ride);

  // small helpers that coerce numbers but allow empty string (for controlled inputs)
  const setNum = (key: keyof Ride) => (v: string) =>
    setForm((s) => ({ ...s, [key]: v === "" ? "" : Number(v) }));

  const save = () => {
    // Basic guard (you can tighten validation as needed)
    if (
      form.numClients === "" ||
      form.durationHours === "" ||
      form.distanceMilesTenths === "" ||
      form.donationAmount === "" ||
      form.status === "" ||
      form.donationType === ""
    ) {
      alert("Please fill all required fields.");
      return;
    }
    onSave?.(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Edit Ride</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Edit Ride Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          {/* Client Name (uneditable) */}
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input value={form.clientName} disabled />
          </div>

          {/* Driver Name (uneditable) */}
          <div className="space-y-2">
            <Label>Driver Name</Label>
            <Input value={form.driverName} disabled />
          </div>

          {/* Dispatcher Name (uneditable) */}
          <div className="space-y-2">
            <Label>Dispatcher Name</Label>
            <Input value={form.dispatcherName} disabled />
          </div>

          {/* Number of Clients */}
          <div className="space-y-2">
            <Label>Number of Clients</Label>
            <Input
              inputMode="numeric"
              placeholder="(number, including 0)"
              value={form.numClients}
              onChange={(e) => setNum("numClients")(e.target.value)}
            />
          </div>

          {/* Ride Status */}
          <div className="space-y-2">
            <Label>Ride Status</Label>
            <Select
              value={form.status}
              onValueChange={(v: Ride["status"]) => setForm((s) => ({ ...s, status: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="(completed, cancelled, one-way, etc.)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="one-way">One-way</SelectItem>
                <SelectItem value="round-trip">Round trip</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trip Duration (hours & quarter-hours) */}
          <div className="space-y-2">
            <Label>Trip Duration (hours and quarter-hours)</Label>
            <Input
              inputMode="decimal"
              placeholder="0.75"
              value={form.durationHours}
              onChange={(e) => setNum("durationHours")(e.target.value)}
            />
          </div>

          {/* Trip Distance (miles and tenths) */}
          <div className="space-y-2">
            <Label>Trip Distance (miles and tenths)</Label>
            <Input
              inputMode="decimal"
              placeholder="25.0"
              value={form.distanceMilesTenths}
              onChange={(e) => setNum("distanceMilesTenths")(e.target.value)}
            />
          </div>

          {/* Donation Type */}
          <div className="space-y-2">
            <Label>Donation Type</Label>
            <Select
              value={form.donationType}
              onValueChange={(v: Ride["donationType"]) => setForm((s) => ({ ...s, donationType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Donation Amount ($) */}
          <div className="space-y-2">
            <Label>Donation Amount ($)</Label>
            <Input
              inputMode="decimal"
              placeholder="15.00"
              value={form.donationAmount}
              onChange={(e) => setNum("donationAmount")(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
