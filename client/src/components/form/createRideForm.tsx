"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent } from "../ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { format } from "date-fns";

/* --------------------------------- Schema --------------------------------- */
const createRideSchema = z
    .object({
        clientName: z.string().min(1, "Please select an option."),
        purposeOfTrip: z.string().min(1, "Must have a purpose.").max(255),
        tripDate: z.date("Please select a date."),
        tripType: z.string().min(1, "Please select an option."),
        appointmentType: z.string().min(1, "Please select a time."),
        additionalRider: z
            .string()
            // Using AI for this refine selection of Yes / No
            .min(1, "Please specify if there's an additional rider.")
            .refine((val) => ["Yes", "No"].includes(val), {
                message: "Invalid selection.",
            }),
        additionalRiderFirstName: z.string().max(255).optional(),
        additionalRiderLastName: z.string().max(255).optional(),
        relationshipToClient: z.string().max(255).optional(),
        assignedDriver: z.string().min(1, "Please select a driver."),
        rideStatus: z.string().min(1, "Please select an option."),
        tripDuration: z.number().min(1, "Please select how long the trip was."),
        volunteerHours: z
            .number()
            .min(0, "Volunteer hours cannot be negative.")
            .refine(
                (val) => {
                    // Check if it's a valid quarter-hour increment (0.00, 0.25, 0.50, 0.75)
                    const decimal = val % 1;
                    return [0, 0.25, 0.5, 0.75].includes(Math.round(decimal * 100) / 100);
                },
                {
                    message:
                        "Volunteer hours must be in quarter-hour increments (e.g., 1.25, 2.50).",
                }
            ),
    })
    .superRefine((data, ctx) => {
        if (data.additionalRider === "Yes") {
            if (!data.additionalRiderFirstName?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "First name is required when there's an additional rider.",
                    path: ["additionalRiderFirstName"],
                });
            }
            if (!data.additionalRiderLastName?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "Last name is required when there's an additional rider.",
                    path: ["additionalRiderLastName"],
                });
            }
            if (!data.relationshipToClient?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "Relationship is required when there's an additional rider.",
                    path: ["relationshipToClient"],
                });
            }
        }
    });

export type CreateRideFormValues = z.infer<typeof createRideSchema>;

/* --------------------------------- Props ---------------------------------- */
/** Accept Partial so we can provide sane fallbacks when something is missing. */
type Props = {
    defaultValues: Partial<CreateRideFormValues>;
    onSubmit: (values: CreateRideFormValues) => void | Promise<void>;
};

/* --------------------------------- Form ----------------------------------- */
export default function EditRideForm({ defaultValues, onSubmit }: Props) {
    const form = useForm<CreateRideFormValues>({
        resolver: zodResolver(createRideSchema),
        mode: "onBlur",
        /** Explicit, standardized defaults (requested in review) */
        defaultValues: {
            clientName: defaultValues.clientName ?? "",
            purposeOfTrip: defaultValues.purposeOfTrip ?? "",
            tripDate: defaultValues.tripDate ?? new Date(),

            tripType: defaultValues.tripType ?? "",
            appointmentType: defaultValues.appointmentType ?? "12:00:00",
            additionalRider: defaultValues.additionalRider ?? "No",
            additionalRiderFirstName: defaultValues.additionalRiderFirstName ?? "",
            assignedDriver: defaultValues.assignedDriver ?? "",

            additionalRiderLastName: defaultValues.additionalRiderLastName ?? "",
            relationshipToClient: defaultValues.relationshipToClient ?? "",
            rideStatus: defaultValues.rideStatus ?? "",
            tripDuration: defaultValues.tripDuration ?? 0,
            volunteerHours: defaultValues.volunteerHours ?? 0,
        },
    });

    /* AI said to use form.watch to check if Additional Rider is included - if it is, show additional rider form fields, if not, don't include them. */
    const additionalRider = form.watch("additionalRider");
    return (
        <Form {...form}>
            <form
                id="create-ride-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* Client Name, on all the dropdowns, replace with information from API later. */}
                <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Client</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="clientOne">Bob Joel</SelectItem>
                                        <SelectItem value="clientTwo">John Smith</SelectItem>
                                        <SelectItem value="clientThree">Emily Keller</SelectItem>
                                        <SelectItem value="clientFour">Bobbert Dole</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Trip Purpose */}
                <FormField
                    control={form.control}
                    name="purposeOfTrip"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Purpose of trip</FormLabel>
                            <FormControl className="w-full">
                                <Input placeholder="Value" {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Date of Trip */}
                <FormField
                    control={form.control}
                    name="tripDate"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Trip Date</FormLabel>
                            <FormControl className="w-full">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            data-empty={!field.value}
                                            className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon />
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Round Trip/One Way */}
                <FormField
                    control={form.control}
                    name="tripType"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Round Trip/One Way</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="roundTrip">Round Trip</SelectItem>
                                        <SelectItem value="oneWay">One Way</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Appointment Time */}
                <FormField
                    control={form.control}
                    name="appointmentType"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Appointment Time</FormLabel>
                            <FormControl className="w-full">
                                <Input
                                    type="time"
                                    step="1"
                                    {...field}
                                    className="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Additional Rider */}
                <FormField
                    control={form.control}
                    name="additionalRider"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Additional Rider</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a value" />
                                    </SelectTrigger>
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
                {/* Assigned Driver */}
                <FormField
                    control={form.control}
                    name="assignedDriver"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Assigned Driver</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DriverOne">Bob Smith</SelectItem>
                                        <SelectItem value="DriverTwo">Samantha Noel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Additional Rider First Name */}
                {additionalRider === "Yes" && (
                    <FormField
                        control={form.control}
                        name="additionalRiderFirstName"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Additional Rider First Name</FormLabel>
                                <FormControl className="w-full">
                                    <Input placeholder="Value" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Additional Rider Last Name  */}
                {additionalRider === "Yes" && (
                    <FormField
                        control={form.control}
                        name="additionalRiderLastName"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Additional Rider Last Name</FormLabel>
                                <FormControl className="w-full">
                                    <Input placeholder="Value" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {additionalRider === "Yes" && (
                    <FormField
                        control={form.control}
                        name="relationshipToClient"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Relationship to Client</FormLabel>
                                <FormControl className="w-full">
                                    <Input placeholder="Value" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {/* Ride Status: Completed Round Trip, Completed One Way To, Completed One Way From, Cancelled by Client, Cancelled by Driver */}
                <FormField
                    control={form.control}
                    name="rideStatus"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Ride Status</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Ride Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Completed Round Trip">
                                            Completed Round Trip
                                        </SelectItem>
                                        <SelectItem value="Completed One Way To">
                                            Completed One Way To
                                        </SelectItem>
                                        <SelectItem value="Completed One Way From">
                                            Completed One Way From
                                        </SelectItem>
                                        <SelectItem value="Cancelled by Driver">
                                            Cancelled by Client
                                        </SelectItem>
                                        <SelectItem value="Cancelled by Driver">
                                            Cancelled by Driver
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Volunteer Hours */}
                <FormField
                    control={form.control}
                    name="volunteerHours"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Volunteer Hours</FormLabel>
                            <FormControl className="w-full">
                                <Input
                                    type="number"
                                    step="0.25"
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // If empty, set to 0
                                        if (value === "") {
                                            field.onChange(0);
                                            return;
                                        }
                                        // Otherwise parse as float
                                        const parsed = parseFloat(value);
                                        field.onChange(isNaN(parsed) ? 0 : parsed);
                                    }}
                                    className="w-full"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
