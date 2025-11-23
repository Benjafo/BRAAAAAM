"use client";

import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { GoogleAddressFields } from "@/components/common/GoogleAddressFields";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

/* --------------------------------- Schema --------------------------------- */
/* using z.enum for select values that we know are included */
const locationSchema = z.object({
    locationName: z
        .string()
        .min(1, "Please enter the location name.")
        .max(255, "Max characters allowed is 255."),
    address: z.string().min(1, "Address is required").max(255, "Max characters allowed is 255."),
    address2: z.string().max(255, "Max characters allowed is 255.").optional(),
    city: z.string().min(1, "City is required").max(100, "Max characters allowed is 100."),
    state: z.string().min(1, "State is required").max(50, "Max characters allowed is 50."),
    zip: z.string().min(1, "ZIP code is required").max(20, "Max characters allowed is 20."),
    country: z.string().min(1, "Country is required").max(100, "Max characters allowed is 100."),
});

export type LocationFormValues = z.infer<typeof locationSchema>;

/* --------------------------------- Props ---------------------------------- */
/** Accept Partial so we can provide sane fallbacks when something is missing. */
type Props = {
    defaultValues: Partial<LocationFormValues>;
    onSubmit: (values: LocationFormValues) => void | Promise<void>;
};

/* --------------------------------- Form ----------------------------------- */
export default function LocationForm({ defaultValues, onSubmit }: Props) {
    const form = useForm<LocationFormValues>({
        resolver: zodResolver(locationSchema),
        mode: "onBlur",

        defaultValues: {
            locationName: defaultValues.locationName ?? "",
            address: defaultValues.address ?? "",
            address2: defaultValues.address2 ?? "",
            city: defaultValues.city ?? "",
            state: defaultValues.state ?? "",
            zip: defaultValues.zip ?? "",
            country: defaultValues.country ?? "USA",
        },
    });

    return (
        <Form {...form}>
            <form
                id="new-location-form"
                className="grid grid-cols-1 gap-x-8 gap-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* Location Name */}
                <FormField
                    control={form.control}
                    name="locationName"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Location Name</FormLabel>
                            <FormControl className="w-full">
                                <Input placeholder="Value" {...field} className="w-full" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Address Fields with Google Autocomplete */}
                <GoogleAddressFields
                    control={form.control}
                    setValue={form.setValue}
                    addressFieldName="address"
                    address2FieldName="address2"
                    cityFieldName="city"
                    stateFieldName="state"
                    zipFieldName="zip"
                    showAddress2={true}
                    showLabels={true}
                />
            </form>
        </Form>
    );
}
