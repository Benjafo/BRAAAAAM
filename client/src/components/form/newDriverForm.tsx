"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";

import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";

/* --------------------------------- Schema --------------------------------- */
/* using z.enum for select values that we know are included */
const newDriverSchema = z.object({
    firstName: z
        .string()
        .min(1, "Please enter the first name.")
        .max(255, "Max characters allowed is 255."),
    vehicleType: z
        .string()
        .min(1, "Please enter the vehicle type.")
        .max(255, "Max characters allowed is 255."),
    lastName: z
        .string()
        .min(1, "Please enter the last name.")
        .max(255, "Max characters allowed is 255."),
    vehicleColor: z
        .string()
        .min(1, "Please enter the vehicle color/details.")
        .max(255, "Max characters allowed is 255."),
    birthMonth: z.string().min(1, "Please select a month."),
    birthYear: z.string().min(1, "Please select a year."),
    maxRides: z
        .number("Must enter the number of rides, a 0 means no limit.")
        .min(0, "Rides cannot be less than 0."),
    homeAddress: z
        .string()
        .min(1, "Home address is required.")
        .max(255, "Max characters allowed is 255."),

    townPreferences: z.string().max(255, "Max characters allowed is 255.").optional(),

    homeAddress2: z.string().max(255, "Max characters allowed is 255.").optional(),
    destinationLimitations: z.string().max(255, "Max characters allowed is 255."),
    driverEmail: z.email(),
    maxRidesDistance: z
        .number("Must enter the maximum number of miles driver is willing to go.")
        .min(0, "Rides cannot be less than 0."),
    distanceLimitation: z
        .number("Must enter the maximum number of miles the driver is willing to go.")
        .min(0, "Cannot be 0 miles."),

    lifeSpanReimbursement: z.enum(["Yes", "No"], {
        message: "Please specifiy if there was a reimbursement. ",
    }),
    primaryContactPref: z
        .string()
        .min(1, "Write in how you want to be contacted. ")
        .max(255, "Max characters allowed is 255."),

    secondaryContactPref: z.string().max(255, "Max characters allowed is 255.").optional(),

    primaryPhoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .regex(
            /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
            "Please enter a valid US phone number."
        ),

    primaryPhoneIsCellPhone: z.boolean(),
    okToTextPrimaryPhone: z.boolean(),
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
});

export type NewDriverFormValues = z.infer<typeof newDriverSchema>;

/* --------------------------------- Props ---------------------------------- */
/** Accept Partial so we can provide sane fallbacks when something is missing. */
type Props = {
    defaultValues: Partial<NewDriverFormValues>;
    onSubmit: (values: NewDriverFormValues) => void | Promise<void>;
};

/* --------------------------------- Form ----------------------------------- */
export default function NewDriverForm({ defaultValues, onSubmit }: Props) {
    const form = useForm<NewDriverFormValues>({
        resolver: zodResolver(newDriverSchema),
        mode: "onBlur",

        defaultValues: {
            firstName: defaultValues.firstName ?? "",
            vehicleType: defaultValues.vehicleType ?? "",
            lastName: defaultValues.lastName ?? "",
            vehicleColor: defaultValues.vehicleColor ?? "",
            birthMonth: defaultValues.birthMonth ?? "",
            birthYear: defaultValues.birthYear ?? "",
            maxRides: defaultValues.maxRides,
            homeAddress: defaultValues.homeAddress ?? "",
            townPreferences: defaultValues.townPreferences ?? "",
            homeAddress2: defaultValues.homeAddress2 ?? "",
            destinationLimitations: defaultValues.destinationLimitations ?? "",
            driverEmail: defaultValues.driverEmail ?? "",
            maxRidesDistance: defaultValues.maxRidesDistance,
            distanceLimitation: defaultValues.distanceLimitation,
            lifeSpanReimbursement: defaultValues.lifeSpanReimbursement ?? "No",
            primaryContactPref: defaultValues.primaryContactPref ?? "",

            secondaryContactPref: defaultValues.secondaryContactPref ?? "",
            primaryPhoneNumber: defaultValues.primaryPhoneNumber ?? "",
            primaryPhoneIsCellPhone: defaultValues.primaryPhoneIsCellPhone ?? false,
            okToTextPrimaryPhone: defaultValues.okToTextPrimaryPhone ?? false,
            secondaryPhoneNumber: defaultValues.secondaryPhoneNumber ?? "",
            secondaryPhoneIsCellPhone: defaultValues.secondaryPhoneIsCellPhone ?? false,
            okToTextSecondaryPhone: defaultValues.okToTextSecondaryPhone ?? false,
        },
    });

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

    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

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
    ];

    const YEARS = Array.from({ length: 100 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: String(year), label: String(year) };
    });
    return (
        <Form {...form}>
            <form
                id="new-driver-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* First Name */}
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

                {/* Last Name */}
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

                <FormField
                    control={form.control}
                    name="distanceLimitation"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Maximum Distance Willing to go (In Miles) </FormLabel>
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

                {/* Trip Distance */}
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

                {/* Home Address */}
                <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
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

                {/* Address Line 2 */}
                <FormField
                    control={form.control}
                    name="homeAddress2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address 2</FormLabel>
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

                {/* Email */}
                <FormField
                    control={form.control}
                    name="driverEmail"
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

                {/* Trip Distance */}
                <FormField
                    control={form.control}
                    name="maxRidesDistance"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Maximum Ride Distance (In Miles) </FormLabel>
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
                </div>

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

                    {/* Primary Phone is Cell Phone Checkbox */}
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
                </div>

                {/* Primary contact preference */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="primaryContactPref"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Primary Contact Preference</FormLabel>
                                <FormControl className="w-full">
                                    <Input placeholder="Value" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Secondary contact preference */}
                    <FormField
                        control={form.control}
                        name="secondaryContactPref"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Secondary Contact Preference</FormLabel>
                                <FormControl className="w-full">
                                    <Input placeholder="Value" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </form>
        </Form>
    );
}
