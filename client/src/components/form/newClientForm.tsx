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

import { DatePickerInput } from "../ui/datePickerField";
import { MapPin } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";

/* --------------------------------- Schema --------------------------------- */
/* using z.enum for select values that we know are included */
const newClientSchema = z.object({
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
    primaryContactPref: z
        .string()
        .min(1, "Write in how you want to be contacted. ")
        .max(255, "Max characters allowed is 255."),
    birthYear: z.date("Please select a date."),
    secondaryContactPref: z.string().max(255, "Max characters allowed is 255.").optional(),
    homeAddress: z
        .string()
        .min(1, "Home address is required")
        .max(255, "Max characters allowed is 255."),
    clientGender: z.enum(["Male", "Female", "Other"], {
        message: "Please specify the clients gender.",
    }),
    homeAddress2: z.string().max(255, "Max characters allowed is 255.").optional(),
    clientStatus: z.enum(["Permanent client", "Temporary client"], {
        message: "Please specify if the client is a permanent or temporary client",
    }),
    primaryPhoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .regex(
            /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
            "Please enter a valid US phone number."
        ),

    primaryPhoneIsCellPhone: z.boolean(),
    okToTextPrimaryPhone: z.boolean(),
    endActiveStatus: z.date("Please select the date the active status for the client ends."),
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

export type NewClientFormValues = z.infer<typeof newClientSchema>;

/* --------------------------------- Props ---------------------------------- */
/** Accept Partial so we can provide sane fallbacks when something is missing. */
type Props = {
    defaultValues: Partial<NewClientFormValues>;
    onSubmit: (values: NewClientFormValues) => void | Promise<void>;
};

/* --------------------------------- Form ----------------------------------- */
export default function NewClientForm({ defaultValues, onSubmit }: Props) {
    const form = useForm<NewClientFormValues>({
        resolver: zodResolver(newClientSchema),
        mode: "onBlur",

        defaultValues: {
            firstName: defaultValues.firstName ?? "",
            livingAlone: defaultValues.livingAlone ?? "Lives alone",
            lastName: defaultValues.lastName ?? "",
            primaryContactPref: defaultValues.primaryContactPref ?? "",
            birthYear: defaultValues.birthYear ?? new Date(),
            secondaryContactPref: defaultValues.secondaryContactPref ?? "",
            homeAddress: defaultValues.homeAddress ?? "",
            clientGender: defaultValues.clientGender ?? "Other",
            homeAddress2: defaultValues.homeAddress2 ?? "",
            clientStatus: defaultValues.clientStatus ?? "Permanent client",
            primaryPhoneNumber: defaultValues.primaryPhoneNumber ?? "",
            primaryPhoneIsCellPhone: defaultValues.primaryPhoneIsCellPhone ?? false,
            okToTextPrimaryPhone: defaultValues.okToTextPrimaryPhone ?? false,
            endActiveStatus: defaultValues.endActiveStatus ?? new Date(),
            secondaryPhoneNumber: defaultValues.secondaryPhoneNumber ?? "",
            secondaryPhoneIsCellPhone: defaultValues.secondaryPhoneIsCellPhone ?? false,
            okToTextSecondaryPhone: defaultValues.okToTextSecondaryPhone ?? false,
        },
    });

    const clientStatus = form.watch("clientStatus");

    return (
        <Form {...form}>
            <form
                id="new-client-form"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full items-start pt-"
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

                {/* Primary contact preference */}
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

                {/* Month/Year of Birth */}
                <FormField
                    control={form.control}
                    name="birthYear"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Month/Year of Birth</FormLabel>
                            <FormControl>
                                <DatePickerInput value={field.value} onChange={field.onChange} />
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

                {/* Living alone / not */}
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

                {/* Home Address 2 */}
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

                {/* Client Status */}
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

                {/* End date of active status */}
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
            </form>
        </Form>
    );
}
