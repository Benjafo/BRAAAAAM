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
/* using z.enum for select values that we know are included */
const createRideSchema = z
    .object({
        clientName: z.string().min(1, "Please select an option."),
        purposeOfTrip: z.string().min(1, "Must have a purpose.").max(255),
        tripDate: z.date("Please select a date."),
        tripType: z.enum(["roundTrip", "oneWay"], {
            message: "Please specifiy the trip type.",
        }),
        appointmentType: z.string().min(1, "Please select a time."),
        additionalRider: z.enum(["Yes", "No"], {
            message: "Please specify if there's an additional rider.",
        }),
        additionalRiderFirstName: z.string().max(255).optional(),
        additionalRiderLastName: z.string().max(255).optional(),
        relationshipToClient: z.string().max(255).optional(),
        assignedDriver: z.string().min(1, "Please select a driver."),
        rideStatus: z.enum(
            [
                "completedRoundTrip",
                "completedOneWayTo",
                "completedOneWayFrom",
                "cancelledClient",
                "cancelledDriver",
            ],
            {
                message: "Please select a ride status.",
            }
        ),
        tripDuration: z
            .number()
            .min(0, "Trip duration cannot be negative.")
            .optional()
            .refine(
                (val) => {
                    if (val === undefined || val === 0) return true;

                    // Check if multiplying by 4 gives a whole number, uses quarter hour increment
                    return Number.isInteger(val * 4);
                },
                {
                    message: "Hours must be in full or quarter-hour increments (e.g., 1.25, 1.5).",
                }
            ),
        tripDistance: z
            .number()
            .min(0, "Trip distance cannot be negative.")
            .optional()
            .refine(
                (val) => {
                    if (val === undefined || val === 0) return true;
                    // Check if multiplying by 10 gives a whole number, gives tenth mile increment
                    return Number.isInteger(val * 10);
                },
                {
                    message: "Miles must be in full or tenths (e.g., 1.0, 1.1, 1.2).",
                }
            ),
        donationType: z.enum(["Check", "Cash", "unopenedEnvelope"]).optional(),
        donationAmount: z.number().min(1, "Donation amount must be at least $1.").optional(),
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

        if (data.rideStatus.toLowerCase().includes("completed")) {
            if (!data.tripDuration || data.tripDuration === 0) {
                ctx.addIssue({
                    code: "custom",
                    message: "Trip duration is required for completed rides.",
                    path: ["tripDuration"],
                });
            }
            if (!data.tripDistance || data.tripDistance === 0) {
                ctx.addIssue({
                    code: "custom",
                    message: "Trip distance is required for completed rides.",
                    path: ["tripDistance"],
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

        defaultValues: {
            clientName: defaultValues.clientName ?? "",
            purposeOfTrip: defaultValues.purposeOfTrip ?? "",
            tripDate: defaultValues.tripDate ?? new Date(),
            tripType: defaultValues.tripType,
            appointmentType: defaultValues.appointmentType ?? "12:00:00",
            additionalRider: defaultValues.additionalRider ?? "No",
            additionalRiderFirstName: defaultValues.additionalRiderFirstName ?? "",
            assignedDriver: defaultValues.assignedDriver ?? "",

            additionalRiderLastName: defaultValues.additionalRiderLastName ?? "",
            relationshipToClient: defaultValues.relationshipToClient ?? "",
            rideStatus: defaultValues.rideStatus,
            tripDuration: defaultValues.tripDuration,
            tripDistance: defaultValues.tripDistance,
            donationType: defaultValues.donationType,
            donationAmount: defaultValues.donationAmount,
        },
    });

    /* AI said to use form.watch to check if Additional Rider is included - if it is, show additional rider form fields, if not, don't include them. */
    const additionalRider = form.watch("additionalRider");
    const rideStatus = form.watch("rideStatus");

    // Check if ride status contains "completed"
    const isCompleted = rideStatus?.toLowerCase().includes("completed");

    // Used to handle number input logic (AI helped on this)
    const handleNumberChange =
        (field: { onChange: (value: number | undefined) => void }) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (value === "") {
                field.onChange(undefined); // Set to undefined when empty
                return;
            }
            const parsed = parseFloat(value);
            field.onChange(isNaN(parsed) ? undefined : parsed);
        };
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
                                        <SelectItem value="driverOne">Bob Smith</SelectItem>
                                        <SelectItem value="driverTwo">Samantha Noel</SelectItem>
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

                {/* Relationship to client */}
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
                                        <SelectItem value="completedRoundTrip">
                                            Completed Round Trip
                                        </SelectItem>
                                        <SelectItem value="completedOneWayTo">
                                            Completed One Way To
                                        </SelectItem>
                                        <SelectItem value="completedOneWayFrom">
                                            Completed One Way From
                                        </SelectItem>
                                        <SelectItem value="cancelledClient">
                                            Cancelled by Client
                                        </SelectItem>
                                        <SelectItem value="cancelledDriver">
                                            Cancelled by Driver
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Trip Duration */}
                {/* Volunteer Hours - Only show for completed rides */}
                {isCompleted && (
                    <FormField
                        control={form.control}
                        name="tripDuration"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Trip Duration (Hours)</FormLabel>
                                <FormControl className="w-full">
                                    <Input
                                        type="number"
                                        step="0.25"
                                        min="0"
                                        placeholder="1.00"
                                        value={field.value ?? ""}
                                        onChange={handleNumberChange(field)}
                                        className="w-full"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {isCompleted && (
                    <FormField
                        control={form.control}
                        name="tripDistance"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Trip Distance (Miles)</FormLabel>
                                <FormControl className="w-full">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        placeholder="1.00"
                                        value={field.value ?? ""}
                                        onChange={handleNumberChange(field)}
                                        className="w-full"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {isCompleted && (
                    <FormField
                        control={form.control}
                        name="donationType"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Donation Type</FormLabel>
                                <FormControl className="w-full">
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Check">Check</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="unopenedEnvelope">
                                                Unopened Envelope
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {isCompleted && (
                    <FormField
                        control={form.control}
                        name="donationAmount"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Donation Amount ($)</FormLabel>
                                <FormControl className="w-full">
                                    <Input
                                        type="number"
                                        placeholder="1.00"
                                        step="1"
                                        min="1"
                                        value={field.value ?? ""}
                                        onChange={handleNumberChange(field)}
                                        className="w-full"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </form>
        </Form>
    );
}
