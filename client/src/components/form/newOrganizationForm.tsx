"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
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
import { toast } from "sonner";
import { DatePickerInput } from "../ui/datePickerField";

/* ----------------------------- Zod schema ----------------------------- */
/* Used AI help for the URL -> allows link to start without http/https, and ends with something like .com or .org */
const newOrganizationSchema = z.object({
    orgName: z
        .string()
        .min(1, "Organization name is required")
        .max(255, "Max characters allowed is 255."),
    orgNameForMailingAddress: z
        .string()
        .min(1, "Organization name is required")
        .max(255, "Max characters allowed is 255."),
    orgCreationDate: z.date("Please select a valid date."),
    logo: z.instanceof(File),
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
    website: z
        .string()
        .min(1, "Website is required")
        .transform((val) => {
            const trimmed = val.trim();

            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                return trimmed;
            }

            return `https://${trimmed}`;
        })
        .pipe(z.url("Please enter a valid URL"))
        .refine(
            (url) => {
                try {
                    const urlObj = new URL(url);
                    const allowedTLDs = [".com", ".org", ".net", ".edu", ".gov"];
                    return allowedTLDs.some((tld) => urlObj.hostname.endsWith(tld));
                } catch {
                    return false;
                }
            },
            {
                message: "Website must end with .com, .org, .net, .edu, or .gov",
            }
        ),
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
    status: z.enum(["Active", "Inactive"], {
        message: "Please specify if driver is active or inactive.",
    }),

    // contacts
    primaryContact: z
        .string()
        .min(1, "Primary contact is required.")
        .max(255, "Max characters allowed is 255."),
    adminEmail: z.email(),
    adminMailingAddress: z
        .string()
        .min(1, "Admin mailing address is required.")
        .max(255, "Max characters allowed is 255."),
    adminAddress2: z.string().optional(),
    secondaryContact: z.string().max(255, "Max characters allowed is 255.").optional(),
    secondaryEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    secondaryMailingAddress: z.string().max(255, "Max characters allowed is 255.").optional(),
    secondaryAddress2: z.string().max(255, "Max characters allowed is 255.").optional(),
});

export type NewOrganizationFormValues = z.infer<typeof newOrganizationSchema>;

/* -------------------------------- Props -------------------------------- */
type Props = {
    defaultValues: Partial<NewOrganizationFormValues>;
    onSubmit: (values: NewOrganizationFormValues) => void | Promise<void>;
};

/* --------------------------------- Form -------------------------------- */
export default function NewOrganizationForm({ defaultValues, onSubmit }: Props) {
    const form = useForm<NewOrganizationFormValues>({
        resolver: zodResolver(newOrganizationSchema),
        mode: "onBlur",
        defaultValues: {
            orgName: defaultValues.orgName ?? "",
            orgNameForMailingAddress: defaultValues.orgNameForMailingAddress ?? "",
            orgCreationDate: defaultValues.orgCreationDate ?? new Date(),
            logo: defaultValues.logo,

            phoneGeneral: defaultValues.phoneGeneral ?? "",
            phoneRides: defaultValues.phoneRides ?? "",
            email: defaultValues.email ?? "",
            website: defaultValues.website ?? "",

            mailingAddress: defaultValues.mailingAddress ?? "",
            streetAddress: defaultValues.streetAddress ?? "",
            address2: defaultValues.address2 ?? "",

            status: defaultValues.status ?? "Active",

            primaryContact: defaultValues.primaryContact ?? "",
            adminEmail: defaultValues.adminEmail ?? "",
            adminMailingAddress: defaultValues.adminMailingAddress ?? "",
            adminAddress2: defaultValues.adminAddress2 ?? "",

            secondaryContact: defaultValues.secondaryContact ?? "",
            secondaryEmail: defaultValues.secondaryEmail ?? "",
            secondaryMailingAddress: defaultValues.secondaryMailingAddress ?? "",
            secondaryAddress2: defaultValues.secondaryAddress2 ?? "",
        },
    });

    return (
        <Form {...form}>
            <form
                id="new-organization-form"
                className="grid grid-cols-1 gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
            >
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

                {/* Organization Name */}
                <FormField
                    control={form.control}
                    name="orgNameForMailingAddress"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Name For Mailing Address</FormLabel>
                            <FormControl>
                                <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Organization Creation Date */}
                <FormField
                    control={form.control}
                    name="orgCreationDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Creation Date</FormLabel>
                            <FormControl>
                                <DatePickerInput value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Logo */}
                <FormField
                    control={form.control}
                    name="logo"
                    render={({ field: { onChange, ...field } }) => (
                        <FormItem>
                            <FormLabel>Upload Organization Logo</FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Size Validation
                                            if (file.size > 2 * 1024 * 1024) {
                                                toast.error("File size must be less than 2MB");
                                                return;
                                            }
                                            onChange(file);
                                        }
                                    }}
                                    {...field}
                                    value={undefined} // File inputs can't have a controlled value
                                />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                                JPEG, PNG, or WebP up to 2MB
                            </p>
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
                                    <Input
                                        placeholder="(Replace with Google autocomplete when it's ready)"
                                        {...field}
                                    />
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
                                        placeholder="(Replace with Google autocomplete when it's ready)"
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
                                <div className="relative">
                                    <Input
                                        placeholder="(Replace with Google autocomplete when it's ready)"
                                        {...field}
                                    />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
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
                                    <Input
                                        placeholder="(Replace with Google autocomplete when it's ready)"
                                        {...field}
                                    />
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
                                <div className="relative">
                                    <Input
                                        placeholder="(Replace with Google autocomplete when it's ready)"
                                        {...field}
                                    />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
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
                                    <Input
                                        placeholder="(Replace with Google autocomplete when it's ready)"
                                        {...field}
                                    />
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
                                <div className="relative">
                                    <Input
                                        placeholder="(Replace with Google autocomplete when it's ready)"
                                        {...field}
                                    />
                                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
