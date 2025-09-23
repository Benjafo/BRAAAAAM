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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

/* -------------------------- Types ----------------------------- */
export type Ride = {
  id: string;
  clientName: string;
  driverName: string;
  dispatcherName: string;
  numClients: number;               // default 0
  status: "completed" | "cancelled" | "one-way" | "round-trip" | "scheduled" | "";
  durationHours: number;            // default 0
  distanceMilesTenths: number;      // default 0
  donationType: "Check" | "Cash" | "Card" | "";
  donationAmount: number;           // default 0
};

type Props = {
  ride: Ride;                          // passed from parent
  onSave?: (updated: Ride) => void;    // callback to persist changes
  trigger?: React.ReactNode;           // optional custom trigger button
};

/* ----------------------------- Zod Schema ----------------------------- */
/** Number text: require non-empty and numeric */
const requiredNumberString = z
  .string()
  .min(1, "Required")
  .regex(/^\d+(\.\d+)?$/, "Must be a number");

const schema = z.object({
  clientName: z.string().min(1, "Client is required"),
  driverName: z.string().min(1, "Driver is required"),
  dispatcherName: z.string().min(1, "Dispatcher is required"),

  // required numeric text fields
  numClients: requiredNumberString,
  durationHours: requiredNumberString,
  distanceMilesTenths: requiredNumberString,
  donationAmount: requiredNumberString,

  // same pattern as CreateRideModal
  status: z
    .string()
    .min(1, "Select a status")
    .refine(
      (v): v is Ride["status"] =>
        ["completed", "cancelled", "one-way", "round-trip", "scheduled"].includes(v as any),
      { message: "Select a status" }
    ),
  donationType: z
    .string()
    .min(1, "Select donation type")
    .refine(
      (v): v is Ride["donationType"] => ["Check", "Cash", "Card"].includes(v as any),
      { message: "Select donation type" }
    ),
});

type EditRideForm = z.infer<typeof schema>;

/* ---------------------------- helpers ---------------------------- */
const toNum = (s: string) => Number(s); // form guarantees non-empty & numeric

/* ---------------------------- Component ---------------------------- */
export default function EditRideModal({ ride, onSave, trigger }: Props) {
  const [open, setOpen] = React.useState(false);

  // Preload with ride (numbers -> strings for controlled inputs); default 0
  const form = useForm<EditRideForm>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      clientName: ride.clientName,
      driverName: ride.driverName,
      dispatcherName: ride.dispatcherName,

      numClients: String(ride.numClients ?? 0),
      durationHours: String(ride.durationHours ?? 0),
      distanceMilesTenths: String(ride.distanceMilesTenths ?? 0),
      donationAmount: String(ride.donationAmount ?? 0),

      status: ride.status || "scheduled",
      donationType: ride.donationType || "Check",
    },
  });

  /* ------------------------- onSubmit ------------------------- */
  async function onSubmit(values: EditRideForm) {
    const updated: Ride = {
      ...ride,
      clientName: values.clientName,
      driverName: values.driverName,
      dispatcherName: values.dispatcherName,
      status: values.status as Ride["status"],
      donationType: values.donationType as Ride["donationType"],

      // numbers (non-empty validated)
      numClients: toNum(values.numClients),
      durationHours: toNum(values.durationHours),
      distanceMilesTenths: toNum(values.distanceMilesTenths),
      donationAmount: toNum(values.donationAmount),
    };

    onSave?.(updated);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Trigger button */}
        {trigger ?? <Button variant="outline">Edit Ride</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Edit Ride Details</DialogTitle>
        </DialogHeader>

        {/* Form wrapper from ShadCN */}
        <Form {...form}>
          <form className="grid grid-cols-1 gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Client Name (uneditable) */}
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl><Input {...field} disabled /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Driver Name (uneditable) */}
            <FormField
              control={form.control}
              name="driverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Name</FormLabel>
                  <FormControl><Input {...field} disabled /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dispatcher Name (uneditable) */}
            <FormField
              control={form.control}
              name="dispatcherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispatcher Name</FormLabel>
                  <FormControl><Input {...field} disabled /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of Clients */}
            <FormField
              control={form.control}
              name="numClients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Clients</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="(number, including 0)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ride Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ride Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trip Duration (hours & quarter-hours) */}
            <FormField
              control={form.control}
              name="durationHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Duration (hours and quarter-hours)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="0.75" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trip Distance (miles and tenths) */}
            <FormField
              control={form.control}
              name="distanceMilesTenths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Distance (miles and tenths)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="25.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Donation Type */}
            <FormField
              control={form.control}
              name="donationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donation Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Donation Amount ($) */}
            <FormField
              control={form.control}
              name="donationAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donation Amount ($)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="15.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
