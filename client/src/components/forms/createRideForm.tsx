"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

export const createRideSchema = z.object({
  client: z.string().min(1, "Client is required"),
  purpose: z.string().min(1, "Purpose is required"),

  tripType: z
    .string()
    .min(1, "Select trip type")
    .refine((v): v is "Round Trip" | "One Way" => v === "Round Trip" || v === "One Way", {
      message: "Select trip type",
    }),

  date: z.any().refine((v): v is Date => v instanceof Date, { message: "Pick a date" }),

  time: z.string().min(1, "Pick a time").regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),

  additionalRider: z
    .string()
    .min(1, "Select Yes or No")
    .refine((v): v is "Yes" | "No" => v === "Yes" || v === "No", { message: "Select Yes or No" }),

  addFirst: z.string().optional(),
  addLast: z.string().optional(),
  driver: z.string().min(1, "Driver is required"),
  relation: z.string().min(1, "Relationship is required"),
}).refine(
  (d) => d.additionalRider === "No" || (d.addFirst && d.addLast),
  { message: "Enter first and last name for additional rider", path: ["addFirst"] }
);

export type CreateRideFormValues = z.infer<typeof createRideSchema>;

type Props = {
  defaultValues?: Partial<CreateRideFormValues>;
  onSubmit: (values: CreateRideFormValues) => Promise<void> | void;
  submitLabel?: string;
};

export default function CreateRideForm({ defaultValues, onSubmit, submitLabel = "Save" }: Props) {
  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    mode: "onBlur",
    defaultValues: {
      client: "",
      purpose: "",
      tripType: "",
      date: undefined,
      time: "",
      additionalRider: "No",
      addFirst: "",
      addLast: "",
      driver: "",
      relation: "",
      ...defaultValues,
    },
  });

  const additionalRider = form.watch("additionalRider");

  return (
    <Form {...form}>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WASPS">WASPS</SelectItem>
                    <SelectItem value="Joan Albany">Joan Albany</SelectItem>
                    <SelectItem value="Deb Reilley">Deb Reilley</SelectItem>
                    <SelectItem value="Audrey Buck">Audrey Buck</SelectItem>
                    <SelectItem value="Caren">Caren</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose of trip</FormLabel>
              <FormControl><Input placeholder="Value" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Trip</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("justify-start", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Calendar picker here"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="bottom" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(d) => d && field.onChange(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tripType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Round Trip/One Way</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Round Trip">Round Trip</SelectItem>
                    <SelectItem value="One Way">One Way</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Time</FormLabel>
              <FormControl><Input type="time" placeholder="HH:MM" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalRider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Rider</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {additionalRider === "Yes" && (
          <>
            <FormField
              control={form.control}
              name="addFirst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Rider First Name</FormLabel>
                  <FormControl><Input placeholder="First" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addLast"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Rider Last Name</FormLabel>
                  <FormControl><Input placeholder="Last" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="driver"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Driver</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select a driver" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Driver A">Driver A</SelectItem>
                    <SelectItem value="Driver B">Driver B</SelectItem>
                    <SelectItem value="Driver C">Driver C</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="relation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship to Client</FormLabel>
              <FormControl><Input placeholder="Value" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
