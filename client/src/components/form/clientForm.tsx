import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
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
        birthMonth: z.string().min(1, "Please select a month."),
        birthYear: z.string().min(1, "Please select a year."),
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
                "Please enter a valid US phone number."
            ),

        primaryPhoneIsCellPhone: z.boolean(),
        okToTextPrimaryPhone: z.boolean(),
        endActiveStatus: z.date().optional(),
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
export default function ClientForm({ defaultValues, onSubmit }: Props) {
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
        },
    });

    const clientStatus = form.watch("clientStatus");
    const volunteeringStatus = form.watch("volunteeringStatus");
    const primaryPhoneIsCellPhone = form.watch("primaryPhoneIsCellPhone");
    const secondaryPhoneIsCellPhone = form.watch("secondaryPhoneIsCellPhone");

    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    return (
        <Form {...form}>
            <form
                id="new-client-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start pt-"
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

                {/* Home Address */}
                <div className="md:col-span-2">
                    {/* className="md:col-span-2" */}
                    <GoogleAddressFields
                        control={form.control}
                        setValue={form.setValue}
                        addressFieldName="homeAddress"
                        cityFieldName="city"
                        stateFieldName="state"
                        zipFieldName="zipCode"
                    />
                </div>

                {/* Home Unit/Apartment/Suite */}
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="homeAddress2"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit/Apartment/Suite</FormLabel>
                                <FormControl>
                                    <Input placeholder="Unit, apartment, suite, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />{" "}
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
            </form>
        </Form>
    );
}
