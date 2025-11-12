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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useRef, useState } from "react";
import { GoogleAddressFields } from "../GoogleAddressFields";
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
import DynamicFormFields, { type DynamicFormFieldsRef } from "./DynamicFormFields";

/* --------------------------------- Schema --------------------------------- */
/* using z.enum for select values that we know are included */
const rideSchema = z
    .object({
        clientId: z.string().uuid(),
        clientName: z
            .string()
            .min(1, "Please select an option.")
            .max(255, "Max characters allowed is 255."),
        clientStreetAddress: z
            .string()
            .min(1, "Must have a pickup address.")
            .max(255, "Max characters allowed is 255."),
        clientCity: z
            .string()
            .min(1, "City is required")
            .max(255, "Max characters allowed is 255."),
        clientState: z
            .string()
            .min(1, "State is required")
            .max(255, "Max characters allowed is 255."),
        clientZip: z
            .string()
            .min(5, "ZIP code is required")
            .max(10, "Max characters allowed is 10.")
            .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid US zip code."),
        destinationAddress: z
            .string()
            .min(1, "Destination address is required")
            .max(255, "Max characters allowed is 255."),
        destinationAddress2: z.string().max(255, "Max characters allowed is 255.").optional(),
        destinationCity: z
            .string()
            .min(1, "City is required")
            .max(255, "Max characters allowed is 255."),
        destinationState: z
            .string()
            .min(1, "State is required")
            .max(255, "Max characters allowed is 255."),
        destinationZip: z
            .string()
            .min(5, "ZIP code is required")
            .max(10, "Max characters allowed is 10.")
            .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid US zip code."),
        purposeOfTrip: z.string().min(1, "Must have a purpose.").max(255),
        tripDate: z.date("Please select a date."),
        tripType: z.enum(["roundTrip", "oneWayFrom", "oneWayTo"], {
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
            .enum(["Unassigned", "Scheduled", "Cancelled", "Completed", "Withdrawn"], {
                message: "Please select a valid ride status.",
            })
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
        customFields: z.record(z.string(), z.any()).optional(),
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

        // Driver assignment validation based on ride status
        if (data.rideStatus === "Unassigned") {
            if (data.assignedDriver?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "Cannot assign a driver to an unassigned ride.",
                    path: ["assignedDriver"],
                });
            }
        }

        if (data.rideStatus === "Scheduled" || data.rideStatus === "Completed") {
            if (!data.assignedDriver?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "A driver must be assigned for scheduled or completed rides.",
                    path: ["assignedDriver"],
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
    clients?: Array<{ id: string; value: string; label: string; profile?: ClientProfile }>;
    drivers?: Array<{ value: string; label: string }>;
    onClientChange?: (clientValue: string) => void;
    onFindMatchingDrivers?: () => void;
    isLoading: boolean;
};

/* --------------------------------- Form ----------------------------------- */
export default function EditRideForm({
    defaultValues,
    onSubmit,
    clients: clientsProp,
    drivers: driversProp,
    onClientChange,
    onFindMatchingDrivers,
    isLoading,
}: Props) {
    const dynamicFieldsRef = useRef<DynamicFormFieldsRef>(null);

    const form = useForm<RideFormValues>({
        resolver: zodResolver(rideSchema),
        mode: "onBlur",
        defaultValues: {
            clientId: defaultValues.clientId,
            clientName: defaultValues.clientName ?? "",
            clientStreetAddress: defaultValues.clientStreetAddress ?? "",
            clientCity: defaultValues.clientCity ?? "",
            clientState: defaultValues.clientState ?? "",
            clientZip: defaultValues.clientZip ?? "",
            destinationAddress: defaultValues.destinationAddress ?? "",
            destinationCity: defaultValues.destinationCity ?? "",
            destinationState: defaultValues.destinationState ?? "",
            destinationZip: defaultValues.destinationZip ?? "",
            destinationAddress2: defaultValues.destinationAddress2 ?? "",
            purposeOfTrip: defaultValues.purposeOfTrip ?? "Medical",
            tripDate: defaultValues.tripDate ?? new Date(),

            // TODO fix this
            // tripType: defaultValues.tripType,
            tripType: defaultValues.tripType ?? "roundTrip",
            // appointmentTime: defaultValues.appointmentTime ?? "12:00:00",
            appointmentTime: defaultValues.appointmentTime ?? "12:00",

            additionalRider: defaultValues.additionalRider ?? "No",
            additionalRiderFirstName: defaultValues.additionalRiderFirstName ?? "",
            assignedDriver: defaultValues.assignedDriver ?? "",
            additionalRiderLastName: defaultValues.additionalRiderLastName ?? "",
            relationshipToClient: defaultValues.relationshipToClient ?? "",
            rideStatus: defaultValues.rideStatus ?? "Unassigned",
            tripDuration: defaultValues.tripDuration,
            tripDistance: defaultValues.tripDistance,
            donationType: defaultValues.donationType,
            donationAmount: defaultValues.donationAmount,
            customFields: defaultValues.customFields ?? {},
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

    // Client and driver lists
    const clients = clientsProp ?? [];
    const drivers = driversProp ?? [];

    /* Controls opening for client, and driver pop ups  */
    const [clientOpen, setClientOpen] = useState(false);
    const [driverOpen, setDriverOpen] = useState(false);

    const handleFormSubmit = (values: RideFormValues) => {
        // Validate custom fields before submitting
        const isValid = dynamicFieldsRef.current?.validateCustomFields(values.customFields || {});
        if (!isValid) return;

        onSubmit(values);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form
                id="create-ride-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start pt-5"
                onSubmit={form.handleSubmit(handleFormSubmit)}
            >
                {/* Basic Information Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Basic Information</h3>
                </div>

                {/* Client Name, on all the dropdowns, replace with information from API later. Using ShadCN Combo box. */}
                <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => {
                        return (
                            <FormItem className="w-full">
                                <FormLabel>Client</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <Popover open={clientOpen} onOpenChange={setClientOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={clientOpen}
                                                    className="flex-1 justify-between"
                                                >
                                                    <span className="truncate">
                                                        {field.value
                                                            ? clients.find(
                                                                  (client) =>
                                                                      client.value === field.value
                                                              )?.label
                                                            : "Select Client"}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search client..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No client found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {clients.map((client) => (
                                                                <CommandItem
                                                                    key={client.value}
                                                                    value={client.label}
                                                                    onSelect={() => {
                                                                        field.onChange(
                                                                            client.value
                                                                        );
                                                                        onClientChange?.(
                                                                            client.value
                                                                        );
                                                                        form.setValue(
                                                                            "clientId",
                                                                            client.id
                                                                        );
                                                                        // Set the client's street address from their profile
                                                                        if (
                                                                            client.profile?.address
                                                                        ) {
                                                                            form.setValue(
                                                                                "clientStreetAddress",
                                                                                client.profile
                                                                                    .address
                                                                            );
                                                                        }
                                                                        if (client.profile?.city) {
                                                                            form.setValue(
                                                                                "clientCity",
                                                                                client.profile.city
                                                                            );
                                                                        }
                                                                        if (client.profile?.state) {
                                                                            form.setValue(
                                                                                "clientState",
                                                                                client.profile.state
                                                                            );
                                                                        }
                                                                        if (client.profile?.zip) {
                                                                            form.setValue(
                                                                                "clientZip",
                                                                                client.profile.zip
                                                                            );
                                                                        }
                                                                        setClientOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value ===
                                                                                client.value
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
                                        {field.value && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => {
                                                    field.onChange("");
                                                    form.setValue("clientId", "");
                                                    form.setValue("clientStreetAddress", "");
                                                    form.setValue("clientCity", "");
                                                    form.setValue("clientState", "");
                                                    form.setValue("clientZip", "");
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                {/* Round Trip/One Way */}
                <FormField
                    control={form.control}
                    name="purposeOfTrip"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Purpose of Trip</FormLabel>
                            <FormControl className="w-full">
                                <Input {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Pickup & Appointment Details Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Pickup & Appointment Details</h3>
                </div>

                {/* Client Street Address - populated from selected client's profile */}
                <FormField
                    control={form.control}
                    name="clientStreetAddress"
                    render={({ field }) => (
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Client Street Address</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>
                    )}
                />

                {/* Client City - populated from selected client's profile */}
                <FormField
                    control={form.control}
                    name="clientCity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Client City</FormLabel>
                            <FormControl>
                                <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Client State - populated from selected client's profile */}
                <FormField
                    control={form.control}
                    name="clientState"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Client State</FormLabel>
                            <FormControl>
                                <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Client ZIP Code - populated from selected client's profile */}
                <FormField
                    control={form.control}
                    name="clientZip"
                    render={({ field }) => (
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Client ZIP Code</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>
                    )}
                />

                {/* Destination Address with Google Autocomplete */}
                <div className="md:col-span-2">
                    <GoogleAddressFields
                        control={form.control}
                        setValue={form.setValue}
                        addressFieldLabel="Destination Street Address"
                        addressFieldName="destinationAddress"
                        address2FieldLabel="Destination Street Address 2"
                        address2FieldName="destinationAddress2"
                        cityFieldLabel="Destination City"
                        cityFieldName="destinationCity"
                        stateFieldLabel="Destination State"
                        stateFieldName="destinationState"
                        zipFieldLabel="Destination ZIP Code"
                        zipFieldName="destinationZip"
                        showAddress2={true}
                    />
                </div>

                {/* Date of Trip */}
                <FormField
                    control={form.control}
                    name="tripDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Appointment Date</FormLabel>
                            <FormControl>
                                <DatePickerInput value={field.value} onChange={field.onChange} />
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
                                <Input type="time" step="60" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Trip Type */}
                <FormField
                    control={form.control}
                    name="tripType"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Trip Type</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="roundTrip">Round Trip</SelectItem>
                                        <SelectItem value="oneWayFrom">One Way From</SelectItem>
                                        <SelectItem value="oneWayTo">One Way To</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Assignment Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Assignment</h3>
                </div>

                {/* Assigned Driver, select or type from the dropdowns, replace with information from API later. Using ShadCN Combo box.  */}
                <FormField
                    control={form.control}
                    name="assignedDriver"
                    render={({ field }) => {
                        return (
                            <FormItem className="w-full">
                                <div className="flex items-center justify-between">
                                    <FormLabel>Assigned Driver</FormLabel>
                                    {onFindMatchingDrivers && (
                                        <button
                                            type="button"
                                            onClick={onFindMatchingDrivers}
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            Find matching drivers
                                        </button>
                                    )}
                                </div>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={driverOpen}
                                                    className="flex-1 justify-between"
                                                >
                                                    <span className="truncate">
                                                        {field.value
                                                            ? drivers.find(
                                                                  (driver) =>
                                                                      driver.value === field.value
                                                              )?.label
                                                            : "Select Driver"}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search driver..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No driver found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {drivers.map((driver) => (
                                                                <CommandItem
                                                                    key={driver.value}
                                                                    value={driver.label}
                                                                    onSelect={() => {
                                                                        field.onChange(
                                                                            driver.value
                                                                        );
                                                                        setDriverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value ===
                                                                                driver.value
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
                                        {field.value && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => {
                                                    field.onChange("");
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                {/* Additional Riders Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Additional Riders</h3>
                </div>

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

                {/* Fields only shown when additional rider is selected */}
                {additionalRider === "Yes" && (
                    <FormField
                        control={form.control}
                        name="additionalRiderFirstName"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Additional Rider First Name</FormLabel>
                                <FormControl className="w-full">
                                    <Input {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {additionalRider === "Yes" && (
                    <FormField
                        control={form.control}
                        name="additionalRiderLastName"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Additional Rider Last Name</FormLabel>
                                <FormControl className="w-full">
                                    <Input {...field} className="w-full" />
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
                                    <Input {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Ride Status & Completion Details Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Ride Status & Completion Details</h3>
                </div>

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
                                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Fields only shown for completed rides */}
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
                                        step="0.01"
                                        min="0.01"
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

                {/* Custom Fields Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Custom Fields</h3>
                </div>

                {/* Custom Fields */}
                <div className="md:col-span-2">
                    <DynamicFormFields
                        ref={dynamicFieldsRef}
                        control={form.control}
                        entityType="appointment"
                        setError={form.setError}
                    />
                </div>
            </form>
        </Form>
    );
}
