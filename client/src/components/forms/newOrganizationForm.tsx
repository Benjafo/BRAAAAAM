"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ----------------------------- Zod schema ----------------------------- */
export const newOrganizationSchema = z.object({
    // top section
    orgName: z
        .string()
        .min(1, "Organization name is required")
        .max(255, "Max characters allowed is 255."),
    logo: z.instanceof(File).optional().nullable(),
    phoneGeneral: z
        .string()
        .min(1, "Phone number is required")
        .regex(
            /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
            "Please enter a valid US phone number."
        ),
    phoneRides: z
        .string()
        .min(1, "Phone number is required")
        .regex(
            /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
            "Please enter a valid US phone number."
        ),
    email: z.email(),
    website: z.url("Invalid URL"),
    mailingAddress: z
        .string()
        .min(1, "Mailing address is required.")
        .max(255, "Max characters allowed is 255."),
    streetAddress: z
        .string()
        .min(1, "Street address is required")
        .max(255, "Max characters allowed is 255."),
    address2: z.string().optional(),

    // status
    status: z.enum(["Active", "Inactive"]),

    // contacts
    primaryContact: z
        .string()
        .min(1, "Primary contact is required")
        .max(255, "Max characters allowed is 255."),
    adminEmail: z.email(),
    adminMailingAddress: z
        .string()
        .min(1, "Admin mailing address is required")
        .max(255, "Max characters allowed is 255."),
    adminAddress2: z.string().optional(),
    secondaryContact: z.string().max(255, "Max characters allowed is 255.").optional(),
    secondaryEmail: z.union([z.email("Invalid email address"), z.literal("")]).optional(),
    secondaryMailingAddress: z.string().max(255, "Max characters allowed is 255.").optional(),
    secondaryAddress2: z.string().max(255, "Max characters allowed is 255.").optional(),
});

export type NewOrganizationFormValues = z.infer<typeof newOrganizationSchema>;

/* -------------------------------- Props -------------------------------- */
type Props = {
    defaultValues?: Partial<NewOrganizationFormValues>;
    onSubmit: (values: NewOrganizationFormValues) => void | Promise<void>;
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
};

/* --------------------------------- Form -------------------------------- */
export default function NewOrganizationForm({
    defaultValues,
    onSubmit,
    submitLabel = "Create",
    cancelLabel = "Cancel",
    onCancel,
}: Props) {
    const form = useForm<NewOrganizationFormValues>({
        resolver: zodResolver(newOrganizationSchema),
        mode: "onBlur",
        defaultValues: {
            orgName: defaultValues?.orgName ?? "",
            logo: defaultValues?.logo ?? null,

            phoneGeneral: defaultValues?.phoneGeneral ?? "",
            phoneRides: defaultValues?.phoneRides ?? "",
            email: defaultValues?.email ?? "",
            website: defaultValues?.website ?? "",

            mailingAddress: defaultValues?.mailingAddress ?? "",
            streetAddress: defaultValues?.streetAddress ?? "",
            address2: defaultValues?.address2 ?? "",

            status: defaultValues?.status ?? "Active",

            primaryContact: defaultValues?.primaryContact ?? "",
            adminEmail: defaultValues?.adminEmail ?? "",
            adminMailingAddress: defaultValues?.adminMailingAddress ?? "",
            adminAddress2: defaultValues?.adminAddress2 ?? "",

            secondaryContact: defaultValues?.secondaryContact ?? "",
            secondaryEmail: defaultValues?.secondaryEmail ?? "",
            secondaryMailingAddress: defaultValues?.secondaryMailingAddress ?? "",
            secondaryAddress2: defaultValues?.secondaryAddress2 ?? "",
        },
    });

    return (
        <Form {...form}>
            <form className="grid grid-cols-1 gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                {/* Organization Name */}
                <FormField
                    control={form.control}
                    name="orgName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Logo */}
                <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Organization Logo</FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* General Phone */}
                <FormField
                    control={form.control}
                    name="phoneGeneral"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Phone Number (General Contact)</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Rides Phone */}
                <FormField
                    control={form.control}
                    name="phoneRides"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Phone Number (Ride Requests)</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Email */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Email Address</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Website */}
                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Mailing Address */}
                <FormField
                    control={form.control}
                    name="mailingAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Mailing Address</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input className="pr-8" placeholder="Value" {...field} />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </FormControl>
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
                            <FormLabel>Organization Street Address</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        className="pr-8"
                                        placeholder="(Clicking here opens Google Maps picker)"
                                        {...field}
                                    />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Address Line 2 */}
                <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Address Line 2</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Status */}
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    className="flex gap-6"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="org-status-active" value="Active" />
                                        <FormLabel
                                            htmlFor="org-status-active"
                                            className="font-normal"
                                        >
                                            Active
                                        </FormLabel>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="org-status-inactive" value="Inactive" />
                                        <FormLabel
                                            htmlFor="org-status-inactive"
                                            className="font-normal"
                                        >
                                            Inactive
                                        </FormLabel>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Primary Contact */}
                <FormField
                    control={form.control}
                    name="primaryContact"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Primary Contact (Head Administrator)</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Admin Email */}
                <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Administrator Email Address</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Admin Mailing Address */}
                <FormField
                    control={form.control}
                    name="adminMailingAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Administrator Mailing Address</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input className="pr-8" placeholder="Value" {...field} />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Admin Address Line 2 */}
                <FormField
                    control={form.control}
                    name="adminAddress2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Administrator Address Line 2</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Secondary Contact */}
                <FormField
                    control={form.control}
                    name="secondaryContact"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Secondary Contact</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Secondary Email */}
                <FormField
                    control={form.control}
                    name="secondaryEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Secondary Contact Email Address</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Secondary Mailing Address */}
                <FormField
                    control={form.control}
                    name="secondaryMailingAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Secondary Contact Mailing Address</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input className="pr-8" placeholder="Value" {...field} />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Secondary Address Line 2 */}
                <FormField
                    control={form.control}
                    name="secondaryAddress2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Secondary Contact Address Line 2</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Footer buttons */}
                <div className="mt-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button type="submit">{submitLabel}</Button>
                </div>
            </form>
        </Form>
    );
}
