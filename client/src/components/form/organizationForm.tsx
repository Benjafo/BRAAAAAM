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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
// import { MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
// import { toast } from "sonner";
import { z } from "zod";
import { DatePickerInput } from "../ui/datePickerField";
import { GoogleAddressFields } from "../GoogleAddressFields";
import { Label } from "../ui/label";
// import { Button } from "../ui/button";

/* ----------------------------- Zod schema ----------------------------- */
/* Used AI help for the URL -> allows link to start without http/https, and ends with something like .com or .org */
// const organizationSchema = z.object({
//     orgName: z
//         .string()
//         .min(1, "Organization name is required")
//         .max(255, "Max characters allowed is 255."),
//     orgNameForMailingAddress: z
//         .string()
//         // .min(1, "Organization name is required")
//         .max(255, "Max characters allowed is 255.")
//         .optional(),
//     orgCreationDate: z.date("Please select a valid date."),
//     logo: z.instanceof(File).optional(),
//     phoneGeneral: z
//         .string()
//         .min(1, "Phone number is required")
//         .regex(
//             /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
//             "Please enter a 10 digit phone number."
//         ),
//     phoneRides: z
//         .string()
//         // .min(1, "Phone number is required")
//         // .regex(
//         //     /^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/,
//         //     "Please enter a 10 digit phone number."
//         // )
//         .optional(),
//     email: z.email(),
//     website: z
//         .string()
//         // .min(1, "Website is required")
//         // .transform((val) => {
//         //     const trimmed = val.trim();

//         //     if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
//         //         return trimmed;
//         //     }

//         //     return `https://${trimmed}`;
//         // })
//         // .pipe(z.url("Please enter a valid URL"))
//         // .refine(
//         //     (url) => {
//         //         try {
//         //             const urlObj = new URL(url);
//         //             const allowedTLDs = [".com", ".org", ".net", ".edu", ".gov"];
//         //             return allowedTLDs.some((tld) => urlObj.hostname.endsWith(tld));
//         //         } catch {
//         //             return false;
//         //         }
//         //     },
//         //     {
//         //         message: "Website must end with .com, .org, .net, .edu, or .gov",
//         //     }
//         // )
//         .optional(),
//     mailingAddress: z
//         .string()
//         // .min(1, "Mailing address is required.")
//         // .max(255, "Max characters allowed is 255.")
//         .optional(),
//     streetAddress: z
//         .string()
//         // .min(1, "Street address is required")
//         // .max(255, "Max characters allowed is 255.")
//         .optional(),
//     address2: z.string().optional(),

//     // status
//     status: z.enum(["Active", "Inactive"], {
//         message: "Please specify if driver is active or inactive.",
//     }),

//     // contacts
//     primaryContact: z
//         .string()
//         // .min(1, "Primary contact is required.")
//         // .max(255, "Max characters allowed is 255.")
//         .optional(),
//     adminEmail: z
//         .string()
//         // .email()
//         .optional(),
//     adminMailingAddress: z
//         .string()
//         // .min(1, "Admin mailing address is required.")
//         // .max(255, "Max characters allowed is 255.")
//         .optional(),
//     adminAddress2: z.string().optional(),
//     secondaryContact: z
//         .string()
//         // .max(255, "Max characters allowed is 255.")
//         .optional(),
//     secondaryEmail: z
//         .string()
//         // .email("Invalid email address")
//         .optional()
//         .or(z.literal("")),
//     secondaryMailingAddress: z
//         .string()
//         // .max(255, "Max characters allowed is 255.")
//         .optional(),
//     secondaryAddress2: z
//         .string()
//         // .max(255, "Max characters allowed is 255.")
//         .optional(),
// });

// export type OrganizationFormValues = z.infer<typeof organizationSchema>;









/**
 * 
 * 
 * 
 * 
 * 
 * 
 * @TODO REMOVE ABOVE
 */

export const organizationSchema = z.object({
    id: z.uuid().nullable().optional(),
    name: z.string().max(255).min(3),
    subdomain: z
        .string()
        .min(3)
        .max(15)
        .regex(/^[a-z0-9]([a-z0-9-]{0,13}[a-z0-9])?$/).optional(),

    logoPath: z.string().max(255).nullable().optional(),
    website: z.string().max(255).nullable().optional(),

    phone: z
        .string()
        .regex(/^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/, "Please enter a 10 digit phone number.")
        .nullable().optional(),

    email: z.email().max(255).nullable().optional(),

    attentionLine: z.string().max(255).min(3),
    addressLine1: z.string().max(255).min(3),
    addressLine2: z.string().max(255).nullable().optional(),
    city: z.string().max(100).min(2),
    state: z.string().max(50).min(2),
    zip: z.string().max(20).min(5),
    country: z.string().max(100).default("USA"),

    addressValidated: z.coerce.boolean().default(false),

    establishedDate: z.coerce.date().nullable().optional(),

    pocName: z.string().max(255),
    pocEmail: z.email().max(255),
    pocPhone: z
        .string()
        .regex(/^(\+1\s?)?(\([0-9]{3}\)\s?|[0-9]{3}[-.\s]?)[0-9]{3}[-.\s]?[0-9]{4}$/, "Please enter a 10 digit phone number.")
        .nullable()
        .optional(),

    createdAt: z.iso.datetime().optional(),
    updatedAt: z.iso.datetime().optional(),

    isActive: z.coerce.boolean().default(true),
});

export const organizationFormSchema = organizationSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  addressValidated: true,
  isActive: true,
});

export type OrganizationValues = z.infer<typeof organizationSchema>;
export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;


/* -------------------------------- Props -------------------------------- */
type Props = {
    defaultValues?: Partial<OrganizationValues>;
    onSubmit: (values: OrganizationValues) => void | Promise<void>;
};

/* --------------------------------- Form -------------------------------- */
export default function OrganizationForm({ defaultValues = {}, onSubmit }: Props) {
    const form = useForm({
        resolver: zodResolver(organizationSchema),
        mode: "onBlur",
        defaultValues: {
            id: defaultValues.id ?? null,
            name: defaultValues.name ?? "",
            // subdomain: defaultValues.subdomain ?? "",

            logoPath: defaultValues.logoPath ?? null,
            website: defaultValues.website ?? null,

            phone: defaultValues.phone ?? null,
            email: defaultValues.email ?? null,

            attentionLine: defaultValues.attentionLine ?? "",
            addressLine1: defaultValues.addressLine1 ?? "",
            addressLine2: defaultValues.addressLine2 ?? null,
            city: defaultValues.city ?? "",
            state: defaultValues.state ?? "",
            zip: defaultValues.zip ?? "",
            country: defaultValues.country ?? "USA",

            addressValidated: defaultValues.addressValidated ?? false,
            establishedDate: defaultValues.establishedDate ?? null,

            pocName: defaultValues.pocName ?? "",
            pocEmail: defaultValues.pocEmail ?? "",
            pocPhone: defaultValues.pocPhone ?? null,
        },
    });

    return (
        <Form {...form}>
            <form
                id="new-organization-form"
                className="grid grid-cols-1 gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
                // onSubmit={(e) => {
                //     e.preventDefault();
                //     console.log("Submitting form");
                //     console.log("Form values:", form.getValues());
                //     console.log("Zod parsed values:", organizationSchema.safeParse(form.getValues()));
                //     console.log("Is valid:", form.formState.isValid);
                //     console.log("Errors:", form.formState.errors);
                // }}
            >
                <div className="grid grid-cols-1 gap-4 mb-2">
                    <Label className="text-md">Organization General</Label>
                    {/* Organization Name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Value" {...field} />
                                </FormControl>
                                <FormMessage />
                                <small className="text-muted-foreground">This name will be used to generate the organization url.</small>
                            </FormItem>
                        )}
                    />

                    {/* Organization Creation Date */}
                    <FormField
                        control={form.control}
                        name="establishedDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Established Date</FormLabel>
                                <FormControl>
                                    <DatePickerInput
                                        value={(field.value ?? undefined) as Date | undefined}
                                        onChange={(date) => field.onChange(date)}
                                        
                                        placeholder="Select date"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    
                    {/** Logo - @TODO DISABLED, POSSIBLY REMOVE THIS, NOT CRITICAL*/}
                    {/* <FormField
                        control={form.control}
                        name="logoPath"
                        disabled={true}
                        render={({ field: { onChange, ...field } }) => (
                            <FormItem>
                                <FormLabel>Upload Logo</FormLabel>
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
                    /> */}

                    {/* Website */}
                    <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Value" 
                                        {...field} 
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? null : e.target.value)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                </div>
                
                <div className="grid grid-cols-1 gap-4 mt-4 mb-2">
                    <Label className="text-md">Organization Contact Information</Label>
                    {/* General Phone */}
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number (General Contact)</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Value" 
                                        {...field} 
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? null : e.target.value)
                                        }
                                    />
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
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Value" 
                                        {...field} 
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? null : e.target.value)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>



                <div className="grid grid-cols-1 gap-4 mt-4 mb-2">
                    <Label className="text-md">Organization Mailing Address</Label>
                    {/* Organization Name for mailing address */}
                    <FormField
                        control={form.control}
                        name="attentionLine"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Recipient/Attention Line</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Value" 
                                        {...field} 
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? null : e.target.value)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <GoogleAddressFields
                        control={form.control}
                        setValue={form.setValue}
                        addressFieldName="addressLine1"
                        address2FieldName="addressLine2"
                        cityFieldName="city"
                        stateFieldName="state"
                        zipFieldName="zip"
                        showAddress2={true}
                        showAliasField={false}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4 mb-2">
                    <Label className="text-md">Primary Admin Contact</Label>
                    {/* Primary Contact */}
                    <FormField
                        control={form.control}
                        name="pocName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Value" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Admin Phone */}
                    <FormField
                        control={form.control}
                        name="pocPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Value" 
                                        {...field} 
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? null : e.target.value)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Admin Email */}
                    <FormField
                        control={form.control}
                        name="pocEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                
                                <FormControl>
                                    <Input placeholder="Value" {...field} />
                                </FormControl>
                                <small className="text-muted-foreground">This email address will be used to create an initial admin user for this organization.</small>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* <Button type="submit" className="mt-4">
                    Submit
                </Button> */}
            </form>
        </Form>
    );
}
