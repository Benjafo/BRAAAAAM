"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import EditRideForm, {
  type EditRideFormValues,
} from "@/components/forms/editRideForm";

export type Ride = {
  id: string;
  clientName: string;
  driverName: string;
  dispatcherName: string;
  numClients: number;
  status: "completed" | "cancelled" | "one-way" | "round-trip" | "scheduled" | "";
  durationHours: number;
  distanceMilesTenths: number;
  donationType: "Check" | "Cash" | "Card" | "";
  donationAmount: number;
};

type Props = {
  ride: Ride;
  onSave?: (updated: Ride) => Promise<void> | void;
  trigger?: React.ReactNode;
};

function numOrZero(val: unknown): number {
  if (val === "" || val === undefined || val === null) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export default function EditRideModal({ ride, onSave, trigger }: Props) {
  const [open, setOpen] = React.useState(false);

  async function handleSubmit(values: EditRideFormValues) {
    const updated: Ride = {
      ...ride,

      // copy strings
      clientName: values.clientName,
      driverName: values.driverName,
      dispatcherName: values.dispatcherName,
      status: values.status as Ride["status"],
      donationType: values.donationType as Ride["donationType"],

      // normalize numbers
      numClients: numOrZero(values.numClients),
      durationHours: numOrZero(values.durationHours),
      distanceMilesTenths: numOrZero(values.distanceMilesTenths),
      donationAmount: numOrZero(values.donationAmount),
    };

    await onSave?.(updated);
    toast.success("Ride updated");
    setOpen(false);
  }

  const defaults: EditRideFormValues = {
    clientName: ride.clientName,
    driverName: ride.driverName,
    dispatcherName: ride.dispatcherName,
    numClients: ride.numClients ?? 0,
    durationHours: ride.durationHours ?? 0,
    distanceMilesTenths: ride.distanceMilesTenths ?? 0,
    donationAmount: ride.donationAmount ?? 0,
    status: ride.status,
    donationType: ride.donationType,
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

        <EditRideForm defaultValues={defaults} onSubmit={handleSubmit} />

        <DialogFooter className="mt-2">
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {/* The actual submit button needs to trigger the <form> inside EditRideForm */}
          <Button onClick={() => (document.activeElement as HTMLElement)?.blur()} form="__no-id__" type="submit">
            {/* form prop is ignored since the child form handles its own submit via handleSubmit; 
                the primary action is really inside the form. If you prefer, add a submit button inside the form instead. */}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
