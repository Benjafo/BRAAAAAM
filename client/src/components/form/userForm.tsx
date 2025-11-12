"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { GoogleAddressFields } from "../GoogleAddressFields";
import { Checkbox } from "../ui/checkbox";
import { DatePickerInput } from "../ui/datePickerField";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import DynamicFormFields, { type DynamicFormFieldsRef } from "./DynamicFormFields";

/* --------------------------------- Schema --------------------------------- */

const userSchema = z
    .object({
        firstName: z
            .string()
            .min(1, "Please enter the first name.")
            .max(255, "Max characters allowed is 255."),
        userRole: z.string().min(1, "Please select a user role."),
        lastName: z
            .string()
            .min(1, "Please enter the last name.")
            .max(255, "Max characters allowed is 255."),
        clientEmail: z.email("Please enter a valid email address."),
        birthMonth: z.string().optional(),
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
        city: z.string().min(1, "City is required").max(255, "Max characters allowed is 255."),
        state: z.string().min(1, "State is required").max(255, "Max characters allowed is 255."),
        zipCode: z
            .string()
            .min(5, "Zip Code is required")
            .max(10, "Max characters allowed is 10.")
            .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid US zip code."),
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
                "Please enter a 10 digit phone number."
            ),
        primaryPhoneIsCellPhone: z.boolean(),
        okToTextPrimaryPhone: z.boolean(),
        contactPreference: z.enum(["Phone", "Email"]),
        secondaryPhoneNumber: z
            .string()
            .regex(
                /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
                "Please enter a 10 digit phone number."
            )
            .or(z.literal(""))
            .optional(),
        secondaryPhoneIsCellPhone: z.boolean(),
        okToTextSecondaryPhone: z.boolean(),
        vehicleType: z
            .enum([
                "sedan",
                "small_suv",
                "medium_suv",
                "large_suv",
                "small_truck",
                "large_truck",
                "",
            ])
            .optional(),
        vehicleColor: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        canAccommodateMobilityEquipment: z
            .array(z.enum(["cane", "crutches", "lightweight_walker", "rollator"]))
            .optional(),
        canAccommodateOxygen: z.boolean().optional(),
        canAccommodateServiceAnimal: z.boolean().optional(),
        canAccommodateAdditionalRider: z.boolean().optional(),
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
        lifeSpanReimbursement: z.enum(["Yes", "No"]).optional(),
        emergencyContactName: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        emergencyContactPhone: z
            .string()
            .regex(
                /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
                "Please enter a 10 digit phone number."
            )
            .or(z.literal(""))
            .optional(),
        emergencyContactRelationship: z
            .string()
            .max(100, "Max characters allowed is 100.")
            .optional()
            .or(z.literal("")),
        customFields: z.record(z.string(), z.any()).optional(),
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

        // TODO we cant access the whether the user's role is a driver here, this needs fix
        // eslint-disable-next-line no-constant-condition
        if (false) {
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
            // if (!data.townPreferences) {
            //     ctx.addIssue({
            //         code: "custom",
            //         message: "Please enter any town preferences.",
            //         path: ["townPreferences"],
            //     });
            // }
            // if (!data.destinationLimitations) {
            //     ctx.addIssue({
            //         code: "custom",
            //         message: "Please enter any destination limitations.",
            //         path: ["destinationLimitations"],
            //     });
            // }
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
type Role = {
    id: string;
    name: string;
    roleKey: string;
    description: string;
};

type Props = {
    defaultValues: Partial<UserFormValues>;
    onSubmit: (values: UserFormValues) => void | Promise<void>;
    availableRoles?: Role[];
    isLoadingRoles?: boolean;
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
export default function UserForm({
    defaultValues,
    onSubmit,
    availableRoles = [],
    isLoadingRoles,
}: Props) {
    const dynamicFieldsRef = useRef<DynamicFormFieldsRef>(null);

    // Find default role, dispatcher by default or first available
    const defaultRoleId =
        defaultValues.userRole ??
        availableRoles?.find((r) => r.roleKey === "dispatcher")?.id ??
        availableRoles?.[0]?.id ??
        "";

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        mode: "onBlur",

        defaultValues: {
            firstName: defaultValues.firstName ?? "",
            userRole: defaultRoleId,
            lastName: defaultValues.lastName ?? "",
            birthMonth: defaultValues.birthMonth ?? "",
            birthYear: defaultValues.birthYear ?? "",
            streetAddress: defaultValues.streetAddress ?? "",
            city: defaultValues.city ?? "",
            state: defaultValues.state ?? "",
            zipCode: defaultValues.zipCode ?? "",
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
            contactPreference: defaultValues.contactPreference,
            secondaryPhoneNumber: defaultValues.secondaryPhoneNumber ?? "",
            secondaryPhoneIsCellPhone: defaultValues.secondaryPhoneIsCellPhone ?? false,
            okToTextSecondaryPhone: defaultValues.okToTextSecondaryPhone ?? false,
            vehicleType: defaultValues.vehicleType ?? "",
            vehicleColor: defaultValues.vehicleColor ?? "",
            canAccommodateMobilityEquipment: defaultValues.canAccommodateMobilityEquipment ?? [],
            canAccommodateOxygen: defaultValues.canAccommodateOxygen ?? false,
            canAccommodateServiceAnimal: defaultValues.canAccommodateServiceAnimal ?? false,
            canAccommodateAdditionalRider: defaultValues.canAccommodateAdditionalRider ?? false,
            maxRides: defaultValues.maxRides,
            townPreferences: defaultValues.townPreferences ?? "",
            destinationLimitations: defaultValues.destinationLimitations ?? "",
            lifeSpanReimbursement: defaultValues.lifeSpanReimbursement ?? "No",
            emergencyContactName: defaultValues.emergencyContactName ?? "",
            emergencyContactPhone: defaultValues.emergencyContactPhone ?? "",
            emergencyContactRelationship: defaultValues.emergencyContactRelationship ?? "",
            customFields: defaultValues.customFields ?? {},
        },
    });

    const volunteeringStatus = form.watch("volunteeringStatus");
    const primaryPhoneIsCellPhone = form.watch("primaryPhoneIsCellPhone");
    const secondaryPhoneIsCellPhone = form.watch("secondaryPhoneIsCellPhone");

    const userRole = form.watch("userRole");
    // Check if selected role is a driver role
    const selectedRole = availableRoles?.find((role) => role.id === userRole);
    const isDriverRole = selectedRole?.roleKey === "driver";

    // Update form when roles load and no role is selected yet
    useEffect(() => {
        if (availableRoles?.length > 0 && !userRole) {
            const defaultRole =
                availableRoles?.find((r) => r.roleKey === "dispatcher")?.id ??
                availableRoles[0]?.id;
            if (defaultRole) {
                form.setValue("userRole", defaultRole);
            }
        }
    }, [availableRoles, userRole, form]);

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

    const handleFormSubmit = (values: UserFormValues) => {
        // Validate custom fields before submitting
        const isValid = dynamicFieldsRef.current?.validateCustomFields(values.customFields || {});
        if (!isValid) return;

        onSubmit(values);
    };

    return (
        <Form {...form}>
            <form
                id="new-user-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start"
                onSubmit={form.handleSubmit(handleFormSubmit)}
            >
                {/* Basic Information Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                </div>

                {/* First name */}
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>First Name</FormLabel>
                            <FormControl className="w-full">
                                <Input {...field} className="w-full" />
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
                                <Input {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Contact Information Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                </div>

                {/* Email */}
                <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input {...field} />
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
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isLoadingRoles}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={
                                                isLoadingRoles
                                                    ? "Loading roles..."
                                                    : "Select user role"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles?.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Address Fields with Google Autocomplete */}
                <div className="md:col-span-2">
                    <GoogleAddressFields
                        control={form.control}
                        setValue={form.setValue}
                        addressFieldName="streetAddress"
                        address2FieldName="streetAddress2"
                        cityFieldName="city"
                        stateFieldName="state"
                        zipFieldName="zipCode"
                        showAddress2={true}
                    />
                </div>

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

                {/* Primary Phone, adding div to make checkboxes align underneath primary phone number. */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="primaryPhoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Primary Phone Number</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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

                {/* Secondary Phone, adding div to make checkboxes align underneath secondary phone number. */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="secondaryPhoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Secondary Phone Number</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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

                {/* User status */}
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
                                            <SelectValue />
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
                                        <SelectValue />
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

                {/* Emergency Contact Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                </div>

                <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Emergency Contact Relationship</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Driver-specific fields - only shown when role is driver */}
                {isDriverRole && (
                    <>
                        {/* Driver Information Section */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4">Driver Information</h3>
                        </div>

                        {/* Vehicle Type */}
                        <FormField
                            control={form.control}
                            name="vehicleType"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Vehicle Type</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl className="w-full">
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select vehicle type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="sedan">Sedan</SelectItem>
                                            <SelectItem value="small_suv">Small SUV</SelectItem>
                                            <SelectItem value="medium_suv">Medium SUV</SelectItem>
                                            <SelectItem value="large_suv">Large SUV</SelectItem>
                                            <SelectItem value="small_truck">Small Truck</SelectItem>
                                            <SelectItem value="large_truck">Large Truck</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        <Input {...field} className="w-full" />
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
                                        <Input {...field} className="w-full" />
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
                                        <Input {...field} className="w-full" />
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
                        {/* <FormField
                            control={form.control}
                            name="distanceLimitation"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Maximum Distance Willing to Go (In Miles)</FormLabel>
                                    <FormControl className="w-full">
                                        <Input
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={field.value ?? ""}
                                            onChange={handleNumberChange(field)}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}

                        {/* Can Accommodate Mobility Equipment */}
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="canAccommodateMobilityEquipment"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Can Accommodate Mobility Equipment</FormLabel>
                                        <div className="space-y-2">
                                            {[
                                                { id: "cane", label: "Cane" },
                                                { id: "crutches", label: "Crutches" },
                                                {
                                                    id: "lightweight_walker",
                                                    label: "Lightweight Walker",
                                                },
                                                { id: "rollator", label: "Rollator" },
                                            ].map((item) => (
                                                <FormField
                                                    key={item.id}
                                                    control={form.control}
                                                    name="canAccommodateMobilityEquipment"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(
                                                                        item.id as any
                                                                    )}
                                                                    onCheckedChange={(checked) => {
                                                                        const current =
                                                                            field.value || [];
                                                                        const updated = checked
                                                                            ? [...current, item.id]
                                                                            : current.filter(
                                                                                  (val: string) =>
                                                                                      val !==
                                                                                      item.id
                                                                              );
                                                                        field.onChange(updated);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {item.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Other Accomodations */}
                        <div className="md:col-span-2">
                            <FormItem>
                                <FormLabel>Other Accommodations</FormLabel>
                                <div className="space-y-2">
                                    {/* Can Accommodate Oxygen */}
                                    <FormField
                                        control={form.control}
                                        name="canAccommodateOxygen"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Can Accommodate Oxygen
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Can Accommodate Service Animal */}
                                    <FormField
                                        control={form.control}
                                        name="canAccommodateServiceAnimal"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Can Accommodate Service Animal
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Can Accommodate Additional Rider */}
                                    <FormField
                                        control={form.control}
                                        name="canAccommodateAdditionalRider"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Can Accommodate Additional Rider
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </FormItem>
                        </div>
                    </>
                )}

                {/* Custom Fields */}
                <div className="md:col-span-2">
                    <DynamicFormFields
                        ref={dynamicFieldsRef}
                        control={form.control}
                        entityType="user"
                        setError={form.setError}
                    />
                </div>
            </form>
        </Form>
    );
}
