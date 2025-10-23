"use client";

import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { MapPin } from "lucide-react";

/* --------------------------------- Schema --------------------------------- */
/* using z.enum for select values that we know are included */
const newLocationSchema = z.object({
    locationName: z
        .string()
        .min(1, "Please enter the location name.")
        .max(255, "Max characters allowed is 255."),
    newAddress: z
        .string()
        .min(1, "New address is required")
        .max(255, "Max characters allowed is 255."),
    newAddress2: z.string().max(255, "Max characters allowed is 255.").optional(),
});

export type NewLocationFormValues = z.infer<typeof newLocationSchema>;

/* --------------------------------- Props ---------------------------------- */
/** Accept Partial so we can provide sane fallbacks when something is missing. */
type Props = {
    defaultValues: Partial<NewLocationFormValues>;
    onSubmit: (values: NewLocationFormValues) => void | Promise<void>;
};

/* --------------------------------- Form ----------------------------------- */
export default function NewLocationForm({ defaultValues, onSubmit }: Props) {
    const form = useForm<NewLocationFormValues>({
        resolver: zodResolver(newLocationSchema),
        mode: "onBlur",

        defaultValues: {
            locationName: defaultValues.locationName ?? "",
            newAddress: defaultValues.newAddress ?? "",
            newAddress2: defaultValues.newAddress2 ?? "",
        },
    });

    return (
        <Form {...form}>
            <form
                id="new-location-form"
                className="grid grid-cols-1 gap-x-8 gap-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                {/* First Name */}
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

                {/* Address */}
                <FormField
                    control={form.control}
                    name="newAddress"
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
                {/* Unit/Apartment/Suite */}
                <FormField
                    control={form.control}
                    name="newAddress2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Unit/Apartment/Suite</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input {...field} />
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
