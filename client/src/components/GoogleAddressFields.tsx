import type { Location } from "@/lib/types";
import { type Control, type UseFormSetValue } from "react-hook-form";
import GoogleLocator from "./GoogleLocator";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

interface GoogleAddressFieldsProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
    addressFieldName?: string;
    cityFieldName?: string;
    stateFieldName?: string;
    zipFieldName?: string;
    showLabels?: boolean;
    disabled?: boolean;
}

/**
 * GoogleAddressFields Component
 * A composite component that renders a Google Places autocomplete input
 * followed by individual fields for street address, city, state, and zip code.
 * When a location is selected, all fields are automatically populated.
 *
 * @example
 * ```tsx
 * <GoogleAddressFields control={form.control} setValue={form.setValue} />
 * ```
 */
export function GoogleAddressFields({
    control,
    setValue,
    addressFieldName = "address",
    cityFieldName = "city",
    stateFieldName = "state",
    zipFieldName = "zip",
    showLabels = true,
    disabled = false,
}: GoogleAddressFieldsProps) {
    const handleLocationSelect = (location: Location | null) => {
        if (location?.addressComponents) {
            // Update city, state, and zip fields (address is handled by GoogleLocator)
            setValue(cityFieldName, location.addressComponents.city || "");
            setValue(stateFieldName, location.addressComponents.state || "");
            setValue(zipFieldName, location.addressComponents.zip || "");
        } else {
            // Clear other fields if location is cleared
            setValue(cityFieldName, "");
            setValue(stateFieldName, "");
            setValue(zipFieldName, "");
        }
    };

    return (
        <div className="space-y-4">
            {/* Street Address Field with Google Places Autocomplete */}
            <FormField
                control={control}
                name={addressFieldName}
                render={({ field }) => (
                    <FormItem>
                        {showLabels && <FormLabel>Street Address</FormLabel>}
                        <FormControl>
                            <GoogleLocator
                                value={field.value}
                                onChange={field.onChange}
                                onLocationSelect={handleLocationSelect}
                                placeholder="Start typing an address..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {/* City, State, Zip in a grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* City Field */}
                <FormField
                    control={control}
                    name={cityFieldName}
                    render={({ field }) => (
                        <FormItem>
                            {showLabels && <FormLabel>City</FormLabel>}
                            <FormControl>
                                <Input placeholder="City" {...field} disabled={disabled} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* State Field */}
                <FormField
                    control={control}
                    name={stateFieldName}
                    render={({ field }) => (
                        <FormItem>
                            {showLabels && <FormLabel>State</FormLabel>}
                            <FormControl>
                                <Input placeholder="ST" {...field} disabled={disabled} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Zip Field */}
            <div className="col-span-2">
                <FormField
                    control={control}
                    name={zipFieldName}
                    render={({ field }) => (
                        <FormItem>
                            {showLabels && <FormLabel>ZIP Code</FormLabel>}
                            <FormControl>
                                <Input placeholder="12345" {...field} disabled={disabled} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
