import type { Location } from "@/lib/types";
import { type Control, type UseFormSetValue } from "react-hook-form";
import GoogleLocator from "./googleLocator";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

/**@TODO Fix eslint disable that is caused by the "any". */
interface GoogleAddressFieldsProps {
    control: Control<any>; //eslint-disable-line
    setValue: UseFormSetValue<any>; //eslint-disable-line
    addressFieldLabel?: string;
    addressFieldName?: string;
    address2FieldLabel?: string;
    address2FieldName?: string;
    cityFieldLabel?: string;
    cityFieldName?: string;
    stateFieldLabel?: string;
    stateFieldName?: string;
    zipFieldLabel?: string;
    zipFieldName?: string;
    showLabels?: boolean;
    disabled?: boolean;
    showAddress2?: boolean;
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
    addressFieldLabel = "Address",
    addressFieldName = "address",
    address2FieldLabel = "Address 2",
    address2FieldName = "address2",
    cityFieldLabel = "City",
    cityFieldName = "city",
    stateFieldLabel = "State",
    stateFieldName = "state",
    zipFieldLabel = "ZIP Code",
    zipFieldName = "zip",
    showLabels = true,
    disabled = false,
    showAddress2 = false,
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
                        {showLabels && <FormLabel>{addressFieldLabel}</FormLabel>}
                        <FormControl>
                            <GoogleLocator
                                value={field.value}
                                onChange={field.onChange}
                                onLocationSelect={handleLocationSelect}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Address Line 2 - Only shown if showAddress2 is true */}
            {showAddress2 && (
                <FormField
                    control={control}
                    name={address2FieldName}
                    render={({ field }) => (
                        <FormItem>
                            {showLabels && <FormLabel>{address2FieldLabel}</FormLabel>}
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            {/* City, State, Zip in a grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* City Field */}
                <FormField
                    control={control}
                    name={cityFieldName}
                    render={({ field }) => (
                        <FormItem>
                            {showLabels && <FormLabel>{cityFieldLabel}</FormLabel>}
                            <FormControl>
                                <Input {...field} disabled={disabled} />
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
                            {showLabels && <FormLabel>{stateFieldLabel}</FormLabel>}
                            <FormControl>
                                <Input {...field} disabled={disabled} />
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
                            {showLabels && <FormLabel>{zipFieldLabel}</FormLabel>}
                            <FormControl>
                                <Input {...field} disabled={disabled} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
