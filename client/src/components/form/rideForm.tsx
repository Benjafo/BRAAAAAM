"use client";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ClientProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../ui/command";
import { DatePickerInput } from "../ui/datePickerField";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

/* --------------------------------- Schema --------------------------------- */
/* using z.enum for select values that we know are included */
const rideSchema = z
    .object({
        clientName: z
            .string()
            .min(1, "Please select an option.")
            .max(255, "Max characters allowed is 255."),
        clientStreetAddress: z
            .string()
            .min(1, "Must have a pickup address.")
            .max(255, "Max characters allowed is 255."),
        destinationAddress: z
            .string()
            .min(1, "Destination address is required")
            .max(255, "Max characters allowed is 255."),
        destinationAddress2: z.string().max(255, "Max characters allowed is 255.").optional(),
        purposeOfTrip: z.string().min(1, "Must have a purpose.").max(255),
        tripDate: z.date("Please select a date."),
        tripType: z.enum(["roundTrip", "oneWay"], {
            message: "Please specify the trip type.",
        }),
        appointmentTime: z.string().min(1, "Please select a time."),
        additionalRider: z.enum(["Yes", "No"], {
            message: "Please specify if there's an additional rider.",
        }),
        additionalRiderFirstName: z.string().max(255).optional(),
        additionalRiderLastName: z.string().max(255).optional(),
        relationshipToClient: z.string().max(255).optional(),
        assignedDriver: z.string().optional(),
        rideStatus: z
            .enum(
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
            )
            .optional(),
        tripDuration: z
            .number()
            .min(0.25, "Trip duration must be atleast 0.25 hours.")
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
            .min(0.1, "Trip distance must be atleast 0.1 miles.")
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

        if (data.rideStatus?.toLowerCase().includes("completed")) {
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

export type RideFormValues = z.infer<typeof rideSchema>;

/* --------------------------------- Props ---------------------------------- */
/** Accept Partial so we can provide sane fallbacks when something is missing. */
type Props = {
    defaultValues: Partial<RideFormValues>;
    onSubmit: (values: RideFormValues) => void | Promise<void>;
    // Use these props for AI integration later
    clients?: Array<{ value: string; label: string; profile?: ClientProfile }>;
    drivers?: Array<{ value: string; label: string }>;
    onClientChange?: (clientValue: string) => void;
};

/* --------------------------------- Form ----------------------------------- */
export default function EditRideForm({
    defaultValues,
    onSubmit,
    clients: clientsProp,
    drivers: driversProp,
    onClientChange,
}: Props) {
    const form = useForm<RideFormValues>({
        resolver: zodResolver(rideSchema),
        mode: "onBlur",

        defaultValues: {
            clientName: defaultValues.clientName ?? "",
            clientStreetAddress: defaultValues.clientStreetAddress ?? "",
            destinationAddress: defaultValues.destinationAddress ?? "",
            destinationAddress2: defaultValues.destinationAddress2 ?? "",
            purposeOfTrip: defaultValues.purposeOfTrip ?? "",
            tripDate: defaultValues.tripDate ?? new Date(),
            tripType: defaultValues.tripType,
            appointmentTime: defaultValues.appointmentTime ?? "12:00:00",
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

    /* AI said to use form.watch to check if Additional Rider/Ride Status(Completed) is included - if it is, show additional rider form fields, if not, don't include them. */
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

    /* Client data information, Update with API information later  */
    const clients = clientsProp ?? [];

    /* Driver data information, update with API information later */
    const drivers = driversProp ?? [
        { value: "driverOne", label: "Bob Smith" },
        { value: "driverTwo", label: "Samantha Noel" },
    ];

    /* Controls opening for client, and driver pop ups  */
    const [clientOpen, setClientOpen] = useState(false);
    const [driverOpen, setDriverOpen] = useState(false);

    return (
        <Form {...form}>
            <form
                id="create-ride-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start pt-5"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* Client Name, on all the dropdowns, replace with information from API later. Using ShadCN Combo box. */}
                <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => {
                        return (
                            <FormItem className="w-full">
                                <FormLabel>Client</FormLabel>
                                <FormControl className="w-full">
                                    <Popover open={clientOpen} onOpenChange={setClientOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={clientOpen}
                                                className="w-full justify-between"
                                            >
                                                {field.value
                                                    ? clients.find(
                                                          (client) => client.value === field.value
                                                      )?.label
                                                    : "Select Client"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search client..." />
                                                <CommandList>
                                                    <CommandEmpty>No client found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {clients.map((client) => (
                                                            <CommandItem
                                                                key={client.value}
                                                                value={client.label}
                                                                onSelect={() => {
                                                                    field.onChange(client.value);
                                                                    onClientChange?.(client.value);
                                                                    // Set the client's street address from their profile
                                                                    if (client.profile?.address) {
                                                                        form.setValue(
                                                                            "clientStreetAddress",
                                                                            client.profile.address
                                                                        );
                                                                    }
                                                                    setClientOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        field.value === client.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {client.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
                {/* Client Street Address - populated from selected client's profile */}
                <FormField
                    control={form.control}
                    name="clientStreetAddress"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Client Street Address</FormLabel>
                            <FormControl className="w-full">
                                <Input
                                    placeholder="Select a client to populate"
                                    {...field}
                                    className="w-full"
                                    readOnly
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    disabled
                />
                {/* Street Address */}
                <FormField
                    control={form.control}
                    name="destinationAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Street Address</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="(Replace with Google autocomplete)"
                                        {...field}
                                    />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Destination Unit/Apartment/Suite  */}
                <FormField
                    control={form.control}
                    name="destinationAddress2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Street Unit/Apartment/Suite</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="(Replace with Google autocomplete)"
                                        {...field}
                                    />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
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
                        <FormItem>
                            <FormLabel>Trip Date</FormLabel>
                            <FormControl>
                                <DatePickerInput value={field.value} onChange={field.onChange} />
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
                    name="appointmentTime"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Appointment Time</FormLabel>
                            <FormControl className="w-full">
                                <Input type="time" {...field} />
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
                {/* Assigned Driver, select or type from the dropdowns, replace with information from API later. Using ShadCN Combo box.  */}
                <FormField
                    control={form.control}
                    name="assignedDriver"
                    render={({ field }) => {
                        return (
                            <FormItem className="w-full">
                                <FormLabel>Assigned Driver</FormLabel>
                                <FormControl className="w-full">
                                    <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={driverOpen}
                                                className="w-full justify-between"
                                            >
                                                {field.value
                                                    ? drivers.find(
                                                          (driver) => driver.value === field.value
                                                      )?.label
                                                    : "Select Driver"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search driver..." />
                                                <CommandList>
                                                    <CommandEmpty>No driver found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {drivers.map((driver) => (
                                                            <CommandItem
                                                                key={driver.value}
                                                                value={driver.label}
                                                                onSelect={() => {
                                                                    field.onChange(driver.value);
                                                                    setDriverOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        field.value === driver.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {driver.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
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
