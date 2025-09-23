"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

/* ----------------------------- Zod Schema ----------------------------- */
const schema = z.object({
  client: z.string().min(1, "Client is required"),
  purpose: z.string().min(1, "Purpose is required"),

  
  // Accept empty string from <Select>, then validate value is one of the two
  tripType: z
    .string()
    .min(1, "Select trip type")
    .refine((v): v is "Round Trip" | "One Way" => v === "Round Trip" || v === "One Way", {
      message: "Select trip type",
    }),
    
  // Validate we actually got a Date from the calendar
  date: z.any().refine((v): v is Date => v instanceof Date, { message: "Pick a date" }),

  time: z
    .string()
    .min(1, "Pick a time")
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),

  // Same trick for Yes/No
  additionalRider: z
    .string()
    .min(1, "Select Yes or No")
    .refine((v): v is "Yes" | "No" => v === "Yes" || v === "No", { message: "Select Yes or No"}),

  addFirst: z.string().optional(),
  addLast: z.string().optional(),
  driver: z.string().min(1, "Driver is required"),
  relation: z.string().min(1, "Relationship is required"),
}).refine(
  (d) => d.additionalRider === "No" || (d.addFirst && d.addLast),
  { message: "Enter first and last name for additional rider", path: ["addFirst"] }
);

type CreateRideFormData = z.infer<typeof schema>;

/* ---------------------------- Component ---------------------------- */
export default function CreateRideModal() {
  const [open, setOpen] = React.useState(false);

  const form = useForm<CreateRideFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
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
    },
  });

  const additionalRider = form.watch("additionalRider");

  async function onSubmit(values: CreateRideFormData) {
    try {
      // TODO: replace with real API call
      console.log("Create Ride →", values);
      toast.success("Ride created");
      setOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to create ride. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-md">New Ride</Button>
      </DialogTrigger>

      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>New Ride</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Client */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Dropdown here also" /></SelectTrigger>
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

            {/* Purpose */}
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

            {/* Date */}
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

            {/* Trip type */}
            <FormField
              control={form.control}
              name="tripType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Round Trip/One Way</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Dropdown here" /></SelectTrigger>
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

            {/* Appointment time */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Time</FormLabel>
                  <FormControl><Input type="time" placeholder="Time select element here" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional rider Yes/No */}
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

            {/* Additional rider first/last (only when Yes) */}
            {additionalRider === "Yes" && (
              <>
                <FormField
                  control={form.control}
                  name="addFirst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Rider First Name</FormLabel>
                      <FormControl><Input placeholder="Value" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="Value" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Driver */}
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

            {/* Relationship */}
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

            <div className="md:col-span-2">
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
