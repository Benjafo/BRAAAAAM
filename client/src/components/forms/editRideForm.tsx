"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Button } from "@/components/ui/button";

/* --------------------------------- Schema --------------------------------- */

const editRideSchema = z.object({
  clientName: z.string(),
  driverName: z.string(),
  dispatcherName: z.string(),

  // numbers (already numbers in your modal’s defaultValues)
  numClients: z.number().min(0, "Must be ≥ 0"),
  durationHours: z.number().min(0, "Must be ≥ 0"),
  distanceMilesTenths: z.number().min(0, "Must be ≥ 0"),
  donationAmount: z.number().min(0, "Must be ≥ 0"),

  // selects as strings but constrained
  status: z
    .string()
    .min(1, "Select a status")
    .refine(
      (v): v is
        | "completed"
        | "cancelled"
        | "one-way"
        | "round-trip"
        | "scheduled" =>
        ["completed", "cancelled", "one-way", "round-trip", "scheduled"].includes(v as any),
      { message: "Select a status" }
    ),

  donationType: z
    .string()
    .min(1, "Select donation type")
    .refine((v): v is "Check" | "Cash" | "Card" => ["Check", "Cash", "Card"].includes(v as any), {
      message: "Select donation type",
    }),
});

export type EditRideFormValues = z.infer<typeof editRideSchema>;

/* --------------------------------- Props ---------------------------------- */

type Props = {
  defaultValues: EditRideFormValues;
  onSubmit: (values: EditRideFormValues) => void | Promise<void>;
  submitLabel?: string;
};

/* --------------------------------- Form ----------------------------------- */

export default function EditRideForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Changes",
}: Props) {
  const form = useForm<EditRideFormValues>({
    resolver: zodResolver(editRideSchema),
    mode: "onBlur",
    defaultValues,
  });

  return (
    <Form {...form}>
      <form className="grid grid-cols-1 gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Client Name (read-only) */}
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Driver Name (read-only) */}
        <FormField
          control={form.control}
          name="driverName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Driver Name</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dispatcher Name (read-only) */}
        <FormField
          control={form.control}
          name="dispatcherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dispatcher Name</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
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
                <Input inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
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

        {/* Duration Hours */}
        <FormField
          control={form.control}
          name="durationHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Duration (hours & quarter-hours)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Distance */}
        <FormField
          control={form.control}
          name="distanceMilesTenths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Distance (miles & tenths)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" {...field} />
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

        {/* Donation Amount */}
        <FormField
          control={form.control}
          name="donationAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Donation Amount ($)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-2">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
