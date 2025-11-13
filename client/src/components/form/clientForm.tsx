import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GoogleAddressFields } from "../GoogleAddressFields";
import { Checkbox } from "../ui/checkbox";
import { DatePickerInput } from "../ui/datePickerField";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import DynamicFormFields, { type DynamicFormFieldsRef } from "./DynamicFormFields";

/* --------------------------------- Schema --------------------------------- */
/* using z.enum for select values that we know are included */

const clientSchema = z
    .object({
        firstName: z
            .string()
            .min(1, "Please enter the first name.")
            .max(255, "Max characters allowed is 255."),
        livingAlone: z.enum(["Lives alone", "Does not live alone"], {
            message: "Please specify if the client is living alone or not.",
        }),
        lastName: z
            .string()
            .min(1, "Please enter the last name.")
            .max(255, "Max characters allowed is 255."),
        contactPref: z
            .string()
            .min(1, "Write in how you want to be contacted. ")
            .max(255, "Max characters allowed is 255."),
        birthMonth: z.string().optional(),
        birthYear: z.string().min(1, "Please select a year."),
        homeAlias: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        homeAddress: z
            .string()
            .min(1, "Home address is required")
            .max(255, "Max characters allowed is 255."),
        city: z.string().min(1, "City is required").max(255, "Max characters allowed is 255."),
        state: z.string().min(1, "State is required").max(255, "Max characters allowed is 255."),
        zipCode: z
            .string()
            .min(5, "Zip Code is required")
            .max(10, "Max characters allowed is 10.")
            .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid US zip code."),
        homeAddress2: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        clientGender: z.enum(["Male", "Female", "Other"], {
            message: "Please specify the clients gender.",
        }),
        clientStatus: z.enum(["Permanent client", "Temporary client"], {
            message: "Please specify if the client is a permanent or temporary client",
        }),
        volunteeringStatus: z.enum(["Active", "On leave", "Inactive", "Away"], {
            message: "Please specify the volunteering status.",
        }),
        onLeaveUntil: z.date().optional(),
        inactiveSince: z.date().optional(),
        awayFrom: z.date().optional(),
        awayTo: z.date().optional(),
        clientEmail: z.email("Please enter a valid email address.").optional().or(z.literal("")),
        primaryPhoneNumber: z
            .string()
            .min(1, "Phone number is required")
            .regex(
                /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
                "Please enter a 10 digit phone number."
            ),

        primaryPhoneIsCellPhone: z.boolean(),
        okToTextPrimaryPhone: z.boolean(),
        endActiveStatus: z.date().optional(),
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
        notes: z.string().optional().or(z.literal("")),
        pickupInstructions: z.string().optional().or(z.literal("")),
        mobilityEquipment: z
            .array(z.enum(["cane", "crutches", "lightweight_walker", "rollator", "other"]))
            .optional(),
        mobilityEquipmentOther: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        vehicleTypes: z
            .array(
                z.enum([
                    "sedan",
                    "small_suv",
                    "medium_suv",
                    "large_suv",
                    "small_truck",
                    "large_truck",
                ])
            )
            .optional(),
        hasOxygen: z.boolean().optional(),
        hasServiceAnimal: z.boolean().optional(),
        serviceAnimalDescription: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        otherLimitations: z.array(z.enum(["vision", "hearing", "cognitive", "other"])).optional(),
        otherLimitationsOther: z
            .string()
            .max(255, "Max characters allowed is 255.")
            .optional()
            .or(z.literal("")),
        customFields: z.record(z.string(), z.any()).optional(),
    })
    .superRefine((data, ctx) => {
        // AI helped on the super refine
        // If client status is "Temporary client", endActiveStatus must be provided
        if (data.clientStatus === "Temporary client" && !data.endActiveStatus) {
            ctx.addIssue({
                code: "custom",
                message: "Please select the date the active status for the client ends.",
                path: ["endActiveStatus"],
            });
        }

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
    });

export type ClientFormValues = z.infer<typeof clientSchema>;

/* --------------------------------- Props ---------------------------------- */
/** Accept Partial so we can provide sane fallbacks when something is missing. */
type Props = {
    defaultValues: Partial<ClientFormValues>;
    onSubmit: (values: ClientFormValues) => void | Promise<void>;
    viewMode?: boolean;
};

// Months and Years values, from AI

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
export default function ClientForm({ defaultValues, onSubmit, viewMode = false }: Props) {
    const dynamicFieldsRef = useRef<DynamicFormFieldsRef>(null);
    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        mode: "onBlur",

        defaultValues: {
            firstName: defaultValues.firstName ?? "",
            livingAlone: defaultValues.livingAlone ?? "Lives alone",
            lastName: defaultValues.lastName ?? "",
            contactPref: defaultValues.contactPref ?? "",
            birthMonth: defaultValues.birthMonth ?? "",
            birthYear: defaultValues.birthYear ?? "",
            homeAlias: defaultValues.homeAlias ?? "",
            homeAddress: defaultValues.homeAddress ?? "",
            city: defaultValues.city ?? "",
            state: defaultValues.state ?? "",
            zipCode: defaultValues.zipCode ?? "",
            homeAddress2: defaultValues.homeAddress2 ?? "",
            clientGender: defaultValues.clientGender ?? "Other",
            clientStatus: defaultValues.clientStatus ?? "Permanent client",
            volunteeringStatus: defaultValues.volunteeringStatus ?? "Active",
            onLeaveUntil: defaultValues.onLeaveUntil,
            inactiveSince: defaultValues.inactiveSince,
            awayFrom: defaultValues.awayFrom,
            awayTo: defaultValues.awayTo,
            clientEmail: defaultValues.clientEmail ?? "",
            primaryPhoneNumber: defaultValues.primaryPhoneNumber ?? "",
            primaryPhoneIsCellPhone: defaultValues.primaryPhoneIsCellPhone ?? false,
            okToTextPrimaryPhone: defaultValues.okToTextPrimaryPhone ?? false,
            endActiveStatus: defaultValues.endActiveStatus,
            secondaryPhoneNumber: defaultValues.secondaryPhoneNumber ?? "",
            secondaryPhoneIsCellPhone: defaultValues.secondaryPhoneIsCellPhone ?? false,
            okToTextSecondaryPhone: defaultValues.okToTextSecondaryPhone ?? false,
            emergencyContactName: defaultValues.emergencyContactName ?? "",
            emergencyContactPhone: defaultValues.emergencyContactPhone ?? "",
            emergencyContactRelationship: defaultValues.emergencyContactRelationship ?? "",
            notes: defaultValues.notes ?? "",
            pickupInstructions: defaultValues.pickupInstructions ?? "",
            mobilityEquipment: defaultValues.mobilityEquipment ?? [],
            mobilityEquipmentOther: defaultValues.mobilityEquipmentOther ?? "",
            vehicleTypes: defaultValues.vehicleTypes ?? [],
            hasOxygen: defaultValues.hasOxygen ?? false,
            hasServiceAnimal: defaultValues.hasServiceAnimal ?? false,
            serviceAnimalDescription: defaultValues.serviceAnimalDescription ?? "",
            otherLimitations: defaultValues.otherLimitations ?? [],
            otherLimitationsOther: defaultValues.otherLimitationsOther ?? "",
            customFields: defaultValues.customFields ?? {},
        },
    });

    const clientStatus = form.watch("clientStatus");
    const volunteeringStatus = form.watch("volunteeringStatus");
    const primaryPhoneIsCellPhone = form.watch("primaryPhoneIsCellPhone");
    const hasServiceAnimal = form.watch("hasServiceAnimal");
    const mobilityEquipment = form.watch("mobilityEquipment");
    const otherLimitations = form.watch("otherLimitations");
    const secondaryPhoneIsCellPhone = form.watch("secondaryPhoneIsCellPhone");

    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    // Call custom fields validation before submitting
    const handleFormSubmit = (values: ClientFormValues) => {
        const isValid = dynamicFieldsRef.current?.validateCustomFields(values.customFields || {});
        if (!isValid) return;

        onSubmit(values);
    };

    return (
        <Form {...form}>
            <form
                id="new-client-form"
                className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start pt-5",
                    viewMode && "pointer-events-none opacity-70"
                )}
                onSubmit={form.handleSubmit(handleFormSubmit)}
            >
                {/* Basic Information Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
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
                {/* Living alone / not */}
                <FormField
                    control={form.control}
                    name="livingAlone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Living Alone</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    className="flex flex-col gap-2"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="living-alone" value="Lives alone" />
                                        <FormLabel htmlFor="living-alone" className="font-normal">
                                            Lives Alone
                                        </FormLabel>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            id="not-living-alone"
                                            value="Does not live alone"
                                        />
                                        <FormLabel
                                            htmlFor="not-living-alone"
                                            className="font-normal"
                                        >
                                            Does not live alone
                                        </FormLabel>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Primary contact preference */}
                <FormField
                    control={form.control}
                    name="contactPref"
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
                {/* Birth Month, AI helped create this  */}
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
                {/* Birth Year, AI helped create this  */}
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

                {/* Contact Information Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Contact Information</h3>
                </div>

                {/* Home Address */}
                <div className="md:col-span-2">
                    {/* className="md:col-span-2" */}
                    <GoogleAddressFields
                        control={form.control}
                        setValue={form.setValue}
                        addressFieldName="homeAddress"
                        address2FieldName="homeAddress2"
                        cityFieldName="city"
                        stateFieldName="state"
                        zipFieldName="zipCode"
                        showAddress2={true}
                        showAliasField={true}
                        aliasFieldLabel="Search Saved Destinations"
                        aliasFieldName="homeAlias"
                    />
                </div>
                {/* Client Gender */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="clientGender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client Gender</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        className="flex flex-col gap-2"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem id="male" value="Male" />
                                            <FormLabel htmlFor="male" className="font-normal">
                                                Male
                                            </FormLabel>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem id="female" value="Female" />
                                            <FormLabel htmlFor="female" className="font-normal">
                                                Female
                                            </FormLabel>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem id="other" value="Other" />
                                            <FormLabel htmlFor="other" className="font-normal">
                                                Other
                                            </FormLabel>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {/* Client Permanency Status */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="clientStatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client Status</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        className="flex flex-col gap-2"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                id="permanent-client"
                                                value="Permanent client"
                                            />
                                            <FormLabel
                                                htmlFor="permanent-client"
                                                className="font-normal"
                                            >
                                                Permanent Client
                                            </FormLabel>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                id="temporary-client"
                                                value="Temporary client"
                                            />
                                            <FormLabel
                                                htmlFor="temporary-client"
                                                className="font-normal"
                                            >
                                                Temporary Client
                                            </FormLabel>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* End date of active status */}
                    <div>
                        {clientStatus === "Temporary client" && (
                            <FormField
                                control={form.control}
                                name="endActiveStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date of Active Status</FormLabel>
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
                    </div>
                </div>
                {/* Client Status */}
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

                {/* Emergency Contact Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Emergency Contact</h3>
                </div>

                {/* Emergency Contact Information */}
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

                {/* Additional Information Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Additional Information</h3>
                </div>

                {/* Comments/Notes */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Comments/Notes</FormLabel>
                                <FormControl>
                                    <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {/* Pickup Instructions */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="pickupInstructions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pickup Instructions</FormLabel>
                                <FormControl>
                                    <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Accessibility & Transportation Needs Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mt-4">Accessibility & Transportation Needs</h3>
                </div>

                {/* Mobility Equipment */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="mobilityEquipment"
                        render={() => (
                            <FormItem>
                                <FormLabel>Mobility Equipment</FormLabel>
                                <div className="space-y-2">
                                    {[
                                        { id: "cane", label: "Cane" },
                                        { id: "crutches", label: "Crutches" },
                                        { id: "lightweight_walker", label: "Lightweight Walker" },
                                        { id: "rollator", label: "Rollator" },
                                        { id: "other", label: "Other" },
                                    ].map((item) => (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name="mobilityEquipment"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(
                                                                item.id as any
                                                            )}
                                                            onCheckedChange={(checked) => {
                                                                const current = field.value || [];
                                                                const updated = checked
                                                                    ? [...current, item.id]
                                                                    : current.filter(
                                                                          (val: string) =>
                                                                              val !== item.id
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
                    {/* Conditionally render Other textbox */}
                    {mobilityEquipment?.includes("other") && (
                        <FormField
                            control={form.control}
                            name="mobilityEquipmentOther"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Input {...field} placeholder="Specify other equipment..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Vehicle Types */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="vehicleTypes"
                        render={() => (
                            <FormItem>
                                <FormLabel>Acceptable Vehicle Types</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "sedan", label: "Sedan" },
                                        { id: "small_suv", label: "Small SUV" },
                                        { id: "medium_suv", label: "Medium SUV" },
                                        { id: "large_suv", label: "Large SUV" },
                                        { id: "small_truck", label: "Small Truck" },
                                        { id: "large_truck", label: "Large Truck" },
                                    ].map((item) => (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name="vehicleTypes"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(
                                                                item.id as any
                                                            )}
                                                            onCheckedChange={(checked) => {
                                                                const current = field.value || [];
                                                                const updated = checked
                                                                    ? [...current, item.id]
                                                                    : current.filter(
                                                                          (val: string) =>
                                                                              val !== item.id
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

                {/* Has Oxygen */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="hasOxygen"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Oxygen</FormLabel>
                                <div className="space-y-2">
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Has Oxygen</FormLabel>
                                    </FormItem>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Has Service Animal */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="hasServiceAnimal"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Service Animal</FormLabel>
                                <div className="space-y-2">
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Has Service Animal</FormLabel>
                                    </FormItem>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* Conditionally render Service Animal Description textbox */}
                    {hasServiceAnimal && (
                        <FormField
                            control={form.control}
                            name="serviceAnimalDescription"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Describe the service animal..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Other Limitations */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="otherLimitations"
                        render={() => (
                            <FormItem>
                                <FormLabel>Other Limitations</FormLabel>
                                <div className="space-y-2">
                                    {[
                                        { id: "vision", label: "Vision" },
                                        { id: "hearing", label: "Hearing" },
                                        { id: "cognitive", label: "Cognitive" },
                                        { id: "other", label: "Other" },
                                    ].map((item) => (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name="otherLimitations"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(
                                                                item.id as any
                                                            )}
                                                            onCheckedChange={(checked) => {
                                                                const current = field.value || [];
                                                                const updated = checked
                                                                    ? [...current, item.id]
                                                                    : current.filter(
                                                                          (val: string) =>
                                                                              val !== item.id
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
                    {/* Conditionally render Other textbox */}
                    {otherLimitations?.includes("other") && (
                        <FormField
                            control={form.control}
                            name="otherLimitationsOther"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Input {...field} placeholder="Specify other limitations..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {/* Custom Fields */}
                <div className="md:col-span-2">
                    <DynamicFormFields
                        ref={dynamicFieldsRef}
                        control={form.control}
                        entityType="client"
                        setError={form.setError}
                    />
                </div>
            </form>
        </Form>
    );
}
