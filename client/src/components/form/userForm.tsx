"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { DatePickerInput } from "../ui/datePickerField";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

/* --------------------------------- Schema --------------------------------- */

const userSchema = z
    .object({
        firstName: z
            .string()
            .min(1, "Please enter the first name.")
            .max(255, "Max characters allowed is 255."),
        userRole: z.enum(["Driver", "Admin", "Dispatcher"], {
            message: "Please specify the users role.",
        }),
        lastName: z
            .string()
            .min(1, "Please enter the last name.")
            .max(255, "Max characters allowed is 255."),
        clientEmail: z.email("Please enter a valid email address."),
        birthMonth: z.string().min(1, "Please select a month."),
        birthYear: z.string().min(1, "Please select a year."),
        streetAddress: z
            .string()
            .min(1, "Street address is required")
            .max(255, "Max characters allowed is 255."),
        streetAddress2: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        volunteeringStatus: z.enum(["Active", "On leave", "Inactive", "Away"], {
            message: "Please specify the volunteering status.",
        }),
        onLeaveUntil: z.date().optional(),
        inactiveSince: z.date().optional(),
        awayFrom: z.date().optional(),
        awayTo: z.date().optional(),
        primaryPhoneNumber: z
            .string()
            .min(1, "Phone number is required")
            .regex(
                /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
                "Please enter a valid US phone number."
            ),
        primaryPhoneIsCellPhone: z.boolean(),
        okToTextPrimaryPhone: z.boolean(),
        contactPreference: z.enum(["Phone", "Email"]),
        secondaryPhoneNumber: z
            .string()
            .regex(
                /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
                "Please enter a valid US phone number."
            )
            .or(z.literal(""))
            .optional(),
        secondaryPhoneIsCellPhone: z.boolean(),
        okToTextSecondaryPhone: z.boolean(),
        vehicleType: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        vehicleColor: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        maxRides: z
            .number("Must enter the number of rides, a 0 means no limit.")
            .min(0, "Rides cannot be less than 0.")
            .optional(),
        townPreferences: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        destinationLimitations: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        distanceLimitation: z
            .number("Must enter the maximum number of miles the driver is willing to go.")
            .min(0.1, "Cannot be 0 miles.")
            .optional(),
        lifeSpanReimbursement: z.enum(["Yes", "No"]).optional(),
    })
    .superRefine((data, ctx) => {
        // AI helped on the super refine
        // If volunteering status is "On leave", onLeaveUntil must be provided
        if (data.volunteeringStatus === "On leave" && !data.onLeaveUntil) {
            ctx.addIssue({
                code: "custom",
                message: "Please select the date when the leave ends.",
                path: ["onLeaveUntil"],
            });
        }

        // If volunteering status is "Inactive", inactiveSince must be provided
        if (data.volunteeringStatus === "Inactive" && !data.inactiveSince) {
            ctx.addIssue({
                code: "custom",
                message: "Please select the date when the client became inactive.",
                path: ["inactiveSince"],
            });
        }

        // If volunteering status is "Away", both awayFrom and awayTo must be provided
        if (data.volunteeringStatus === "Away") {
            if (!data.awayFrom) {
                ctx.addIssue({
                    code: "custom",
                    message: "Please select the start date.",
                    path: ["awayFrom"],
                });
            }
            if (!data.awayTo) {
                ctx.addIssue({
                    code: "custom",
                    message: "Please select the end date.",
                    path: ["awayTo"],
                });
            }
        }

        // Driver-specific validation
        if (data.userRole === "Driver") {
            if (!data.vehicleType) {
                ctx.addIssue({
                    code: "custom",
                    message: "Please enter the vehicle type.",
                    path: ["vehicleType"],
                });
            }
            if (!data.vehicleColor) {
                ctx.addIssue({
                    code: "custom",
                    message: "Please enter the vehicle color/details.",
                    path: ["vehicleColor"],
                });
            }
            if (data.maxRides === undefined) {
                ctx.addIssue({
                    code: "custom",
                    message: "Must enter the number of rides, a 0 means no limit.",
                    path: ["maxRides"],
                });
            }
            if (!data.townPreferences) {
                ctx.addIssue({
                    code: "custom",
                    message: "Please enter any town preferences.",
                    path: ["townPreferences"],
                });
            }
            if (!data.destinationLimitations) {
                ctx.addIssue({
                    code: "custom",
                    message: "Please enter any destination limitations.",
                    path: ["destinationLimitations"],
                });
            }
            if (data.distanceLimitation === undefined || data.distanceLimitation < 0.1) {
                ctx.addIssue({
                    code: "custom",
                    message: "Must enter the maximum number of miles driver is willing to go.",
                    path: ["distanceLimitation"],
                });
            }

            if (!data.lifeSpanReimbursement) {
                ctx.addIssue({
                    code: "custom",
                    message: "Please specify if there was a reimbursement.",
                    path: ["lifeSpanReimbursement"],
                });
            }
        }
    });

export type UserFormValues = z.infer<typeof userSchema>;

/* --------------------------------- Props ---------------------------------- */
type Props = {
    defaultValues: Partial<UserFormValues>;
    onSubmit: (values: UserFormValues) => void | Promise<void>;
};

const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
] as const;

const YEARS = Array.from({ length: 100 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: String(year), label: String(year) };
});

/* --------------------------------- Form ----------------------------------- */
export default function NewUserForm({ defaultValues, onSubmit }: Props) {
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        mode: "onBlur",

        defaultValues: {
            firstName: defaultValues.firstName ?? "",
            userRole: defaultValues.userRole ?? "Dispatcher",
            lastName: defaultValues.lastName ?? "",
            birthMonth: defaultValues.birthMonth ?? "",
            birthYear: defaultValues.birthYear ?? "",
            streetAddress: defaultValues.streetAddress ?? "",
            streetAddress2: defaultValues.streetAddress2 ?? "",
            volunteeringStatus: defaultValues.volunteeringStatus ?? "Active",
            onLeaveUntil: defaultValues.onLeaveUntil,
            inactiveSince: defaultValues.inactiveSince,
            awayFrom: defaultValues.awayFrom,
            awayTo: defaultValues.awayTo,
            clientEmail: defaultValues.clientEmail ?? "",
            primaryPhoneNumber: defaultValues.primaryPhoneNumber ?? "",
            primaryPhoneIsCellPhone: defaultValues.primaryPhoneIsCellPhone ?? false,
            okToTextPrimaryPhone: defaultValues.okToTextPrimaryPhone ?? false,
            contactPreference: defaultValues.contactPreference ?? "Phone",
            secondaryPhoneNumber: defaultValues.secondaryPhoneNumber ?? "",
            secondaryPhoneIsCellPhone: defaultValues.secondaryPhoneIsCellPhone ?? false,
            okToTextSecondaryPhone: defaultValues.okToTextSecondaryPhone ?? false,
            vehicleType: defaultValues.vehicleType ?? "",
            vehicleColor: defaultValues.vehicleColor ?? "",
            maxRides: defaultValues.maxRides,
            townPreferences: defaultValues.townPreferences ?? "",
            destinationLimitations: defaultValues.destinationLimitations ?? "",
            distanceLimitation: defaultValues.distanceLimitation,
            lifeSpanReimbursement: defaultValues.lifeSpanReimbursement ?? "No",
        },
    });

    const volunteeringStatus = form.watch("volunteeringStatus");
    const primaryPhoneIsCellPhone = form.watch("primaryPhoneIsCellPhone");
    const secondaryPhoneIsCellPhone = form.watch("secondaryPhoneIsCellPhone");

    const userRole = form.watch("userRole");
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    const handleNumberChange =
        (field: { onChange: (value: number | undefined) => void }) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (value === "") {
                field.onChange(undefined);
                return;
            }
            const parsed = parseFloat(value);
            field.onChange(isNaN(parsed) ? undefined : parsed);
        };

    return (
        <Form {...form}>
            <form
                id="new-user-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* First name */}
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>First Name</FormLabel>
                            <FormControl className="w-full">
                                <Input placeholder="Value" {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* User role */}
                <FormField
                    control={form.control}
                    name="userRole"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>User Role</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="User Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Driver">Driver</SelectItem>
                                        <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Last name */}
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Last Name</FormLabel>
                            <FormControl className="w-full">
                                <Input placeholder="Value" {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Email */}
                <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Birth Month */}
                <FormField
                    control={form.control}
                    name="birthMonth"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Birth Month</FormLabel>
                            <Popover open={monthOpen} onOpenChange={setMonthOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={monthOpen}
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? MONTHS.find(
                                                      (month) => month.value === field.value
                                                  )?.label
                                                : "Select month"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search month..." />
                                        <CommandList>
                                            <CommandEmpty>No month found.</CommandEmpty>
                                            <CommandGroup>
                                                {MONTHS.map((month) => (
                                                    <CommandItem
                                                        key={month.value}
                                                        value={month.label}
                                                        onSelect={() => {
                                                            field.onChange(month.value);
                                                            setMonthOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                month.value === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {month.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Street Address */}
                <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Street Address</FormLabel>
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

                {/* Birth Year */}
                <FormField
                    control={form.control}
                    name="birthYear"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Birth Year</FormLabel>
                            <Popover open={yearOpen} onOpenChange={setYearOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={yearOpen}
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? YEARS.find((year) => year.value === field.value)
                                                      ?.label
                                                : "Select year"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search year..." />
                                        <CommandList>
                                            <CommandEmpty>No year found.</CommandEmpty>
                                            <CommandGroup>
                                                {YEARS.map((year) => (
                                                    <CommandItem
                                                        key={year.value}
                                                        value={year.label}
                                                        onSelect={() => {
                                                            field.onChange(year.value);
                                                            setYearOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                year.value === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {year.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Street Unit/Apartment/Suite */}
                <FormField
                    control={form.control}
                    name="streetAddress2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Street Unit/Apartment/Suite</FormLabel>
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

                {/* Additional Rider with conditional date pickers */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="volunteeringStatus"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Status</FormLabel>
                                <FormControl className="w-full">
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Volunteer Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="On leave">On Leave</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Away">Away From</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* On Leave Until Date Picker - conditionally rendered */}
                    {volunteeringStatus === "On leave" && (
                        <FormField
                            control={form.control}
                            name="onLeaveUntil"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>On Leave Until</FormLabel>
                                    <FormControl>
                                        <DatePickerInput
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Inactive Since Date Picker - conditionally rendered */}
                    {volunteeringStatus === "Inactive" && (
                        <FormField
                            control={form.control}
                            name="inactiveSince"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Inactive Since</FormLabel>
                                    <FormControl>
                                        <DatePickerInput
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Away From Date Pickers */}
                    {volunteeringStatus === "Away" && (
                        <>
                            <FormField
                                control={form.control}
                                name="awayFrom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Away From</FormLabel>
                                        <FormControl>
                                            <DatePickerInput
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="awayTo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>To</FormLabel>
                                        <FormControl>
                                            <DatePickerInput
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </div>

                {/* Primary Phone, adding div to make checkboxes align underneath primary phone number. */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="primaryPhoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Primary Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Value" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Primary Phone is Cell Phone Checkbox */}
                    <FormField
                        control={form.control}
                        name="primaryPhoneIsCellPhone"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                        Primary phone is a cell phone
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    {primaryPhoneIsCellPhone && (
                        <FormField
                            control={form.control}
                            name="okToTextPrimaryPhone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="font-normal">
                                            OK to text primary phone
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Contact preference */}
                <FormField
                    control={form.control}
                    name="contactPreference"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Contact Preference</FormLabel>
                            <FormControl className="w-full">
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Contact Preference" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Phone">Phone</SelectItem>
                                        <SelectItem value="Email">Email</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Secondary Phone, adding div to make checkboxes align underneath secondary phone number. */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="secondaryPhoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Secondary Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Value" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Secondary Phone is Cell Phone Checkbox */}
                    <FormField
                        control={form.control}
                        name="secondaryPhoneIsCellPhone"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                        Secondary phone is a cell phone
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    {secondaryPhoneIsCellPhone && (
                        <FormField
                            control={form.control}
                            name="okToTextSecondaryPhone"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="font-normal">
                                            OK to text secondary phone
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Driver-specific fields - only shown when userRole is "Driver" */}
                {userRole === "Driver" && (
                    <>
                        {/* Vehicle Type */}
                        <FormField
                            control={form.control}
                            name="vehicleType"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Vehicle Type</FormLabel>
                                    <FormControl className="w-full">
                                        <Input placeholder="Value" {...field} className="w-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Vehicle Color */}
                        <FormField
                            control={form.control}
                            name="vehicleColor"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Vehicle Color</FormLabel>
                                    <FormControl className="w-full">
                                        <Input placeholder="Value" {...field} className="w-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Maximum Rides per Week */}
                        <FormField
                            control={form.control}
                            name="maxRides"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Maximum Rides per Week</FormLabel>
                                    <FormControl className="w-full">
                                        <Input
                                            type="number"
                                            step="1"
                                            min="0"
                                            placeholder="0"
                                            value={field.value ?? ""}
                                            onChange={handleNumberChange(field)}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Town Preferences */}
                        <FormField
                            control={form.control}
                            name="townPreferences"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Town Preferences</FormLabel>
                                    <FormControl className="w-full">
                                        <Input placeholder="Value" {...field} className="w-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Destination Limitations */}
                        <FormField
                            control={form.control}
                            name="destinationLimitations"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Destination Limitations</FormLabel>
                                    <FormControl className="w-full">
                                        <Input placeholder="Value" {...field} className="w-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Lifespan Reimbursement */}
                        <FormField
                            control={form.control}
                            name="lifeSpanReimbursement"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lifespan Mileage Reimbursement</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            className="flex flex-col gap-2"
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem id="yes" value="Yes" />
                                                <FormLabel htmlFor="yes" className="font-normal">
                                                    Yes
                                                </FormLabel>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem id="no" value="No" />
                                                <FormLabel htmlFor="no" className="font-normal">
                                                    No
                                                </FormLabel>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Distance Limitation */}
                        <FormField
                            control={form.control}
                            name="distanceLimitation"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Maximum Distance Willing to Go (In Miles)</FormLabel>
                                    <FormControl className="w-full">
                                        <Input
                                            type="number"
                                            step="1"
                                            min="0.1"
                                            placeholder="0.1"
                                            value={field.value ?? ""}
                                            onChange={handleNumberChange(field)}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
            </form>
        </Form>
    );
}
