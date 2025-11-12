import type { Location } from "@/lib/types";
import { type Control, type UseFormSetValue } from "react-hook-form";
import GoogleLocator from "./googleLocator";
import ky from "ky";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";

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
    showAliasField?: boolean;
    aliasFieldLabel?: string;
    aliasFieldName?: string;
}

type LocationAlias = {
    id: string;
    alias: string;
    address: string;
    city: string;
    state: string;
    zip: string;
};

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
    showAliasField = false,
    aliasFieldLabel = "Search Saved Locations",
    aliasFieldName = "search saved locations",
}: GoogleAddressFieldsProps) {
    const [aliasResults, setAliasResults] = useState<LocationAlias[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAliasOpen, setIsAliasOpen] = useState(false);
    const [selectedAliasDisplay, setSelectedAliasDisplay] = useState<string>("");

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

    // AI help on example API call
    const handleSearchAliases = async (query: string): Promise<void> => {
        if (!query.trim()) {
            setAliasResults([]);
            return;
        }

        setIsSearching(true);

        try {
            const orgId = "braaaaam";
            const data = await ky
                .get(`o/${orgId}/locations/aliases`, {
                    headers: {
                        "x-org-subdomain": orgId,
                    },
                })
                .json<{ results: LocationAlias[] }>();

            setAliasResults(data.results);
            setIsSearching(false);
        } catch (err) {
            console.error("Failed to search aliases:", err);
            setAliasResults([]);
            setIsSearching(false);
        }
    };

    // AI help
    const handleAliasSelect = (alias: LocationAlias | null) => {
        if (alias) {
            setValue(addressFieldName, alias.address);
            setValue(cityFieldName, alias.city);
            setValue(stateFieldName, alias.state);
            setValue(zipFieldName, alias.zip);
            setSelectedAliasDisplay(alias.alias);
        } else {
            // Clear all fields when no alias is selected
            setValue(addressFieldName, "");
            setValue(cityFieldName, "");
            setValue(stateFieldName, "");
            setValue(zipFieldName, "");
            setSelectedAliasDisplay("");
        }
        setIsAliasOpen(false);
    };

    return (
        <div className="space-y-4">
            {/* Alias Search Field (AI help) */}
            {showAliasField && (
                <FormField
                    control={control}
                    name={aliasFieldName}
                    render={({ field }) => (
                        <FormItem className="w-full">
                            {showLabels && <FormLabel>{aliasFieldLabel}</FormLabel>}
                            <FormControl>
                                <div className="flex gap-2">
                                    <Popover open={isAliasOpen} onOpenChange={setIsAliasOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isAliasOpen}
                                                className="flex-1 justify-between"
                                                disabled={disabled}
                                            >
                                                <span className="truncate">
                                                    {selectedAliasDisplay ||
                                                        "Search saved locations"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search by location name..."
                                                    onValueChange={handleSearchAliases}
                                                />
                                                <CommandList>
                                                    {isSearching ? (
                                                        <CommandEmpty>Searching...</CommandEmpty>
                                                    ) : aliasResults.length === 0 ? (
                                                        <CommandEmpty>
                                                            No locations found.
                                                        </CommandEmpty>
                                                    ) : (
                                                        <CommandGroup>
                                                            {aliasResults.map((alias) => (
                                                                <CommandItem
                                                                    key={alias.id}
                                                                    value={alias.id}
                                                                    onSelect={() =>
                                                                        handleAliasSelect(alias)
                                                                    }
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === alias.id
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">
                                                                            {alias.alias}
                                                                        </span>
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {alias.address},{" "}
                                                                            {alias.city},{" "}
                                                                            {alias.state}{" "}
                                                                            {alias.zip}
                                                                        </span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {selectedAliasDisplay && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0"
                                            onClick={() => {
                                                field.onChange("");
                                                setValue(addressFieldName, "");
                                                setValue(cityFieldName, "");
                                                setValue(stateFieldName, "");
                                                setValue(zipFieldName, "");
                                                setSelectedAliasDisplay("");
                                            }}
                                            disabled={disabled}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
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
