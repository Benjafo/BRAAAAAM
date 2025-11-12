import type { Location, LocationSelectorProps } from "@/lib/types";
import { Loader } from "@googlemaps/js-api-loader";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";

const GoogleLocator: React.FC<LocationSelectorProps> = ({
    onLocationSelect,
    // (ai was used for the controlled value prop)
    // we need this so that we can use input field in this component as the street
    // address field, and have autocomplete fill out the other address component
    // fields in the GoogleAddressFields component
    value,
    onChange,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [internalValue, setInternalValue] = useState("");

    // Use controlled value if provided, otherwise use internal state
    const inputValue = value !== undefined ? value : internalValue;

    // Initialize Google Places API, some AI logic was used to help set this up

    // Here's an example of how to use it in a form:

    // 1. Define form fields for address, city, state, and zip code in your schema
    //    We'd probably do some better validation here, this is bare minimum

    //  const schema = z.object({
    //      (...other fields...)
    //      address: z.string(),
    //      city: z.string(),
    //      state: z.string(),
    //      zip: z.string(),
    //  });

    // 2. Use the <GoogleAddressFields /> component within your form
    //    Pass in the form's control and setValue functions as props
    //
    //  <GoogleAddressFields control={form.control} setValue={form.setValue} />

    useEffect(() => {
        const initializeGooglePlaces = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
                if (!apiKey) {
                    throw new Error("Google Places API key is not configured.");
                }

                const loader = new Loader({
                    apiKey,
                    version: "weekly",
                    libraries: ["places"],
                });

                await loader.importLibrary("places");
                setIsLoaded(true);
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to load Google Places API";
                console.error("Google Places API error:", message);
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        initializeGooglePlaces();
    }, []);

    const handlePlaceChanged = useCallback(() => {
        const place = autocompleteRef.current?.getPlace();
        console.log(place);
        if (place && place.place_id && place.geometry?.location) {
            // Parse address components from Google Places API
            const components = place.address_components || [];
            const getComponent = (type: string, useShortName = false) =>
                components.find((c) => c.types.includes(type))?.[
                    useShortName ? "short_name" : "long_name"
                ] || "";

            const streetNumber = getComponent("street_number");
            const route = getComponent("route");
            const street = [streetNumber, route].filter(Boolean).join(" ");

            const location: Location = {
                placeId: place.place_id,
                address: place.formatted_address || "",
                coordinates: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                },
                addressComponents: {
                    street: street,
                    city: getComponent("locality"),
                    state: getComponent("administrative_area_level_1", true),
                    zip: getComponent("postal_code"),
                },
            };

            // Update the input value - use controlled onChange if provided
            if (onChange) {
                onChange(street);
            } else {
                setInternalValue(street);
            }

            // Notify parent about full location data
            onLocationSelect(location);
        }
    }, [onLocationSelect, onChange]);

    // Initialize autocomplete when API is loaded
    useEffect(() => {
        if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["place_id", "formatted_address", "geometry.location", "address_components"],
            componentRestrictions: { country: "us" },
        });

        autocompleteRef.current.addListener("place_changed", handlePlaceChanged);

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
                autocompleteRef.current = null;
            }
        };
    }, [isLoaded, handlePlaceChanged]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Update value - use controlled onChange if provided
        if (onChange) {
            onChange(newValue);
        } else {
            setInternalValue(newValue);
        }

        // Clear location if input is cleared
        if (newValue === "") {
            onLocationSelect(null);
        }
    };

    // handle error, AI used to help write this
    if (error) {
        return (
            <div className="relative w-full">
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-destructive rounded-md">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <span className="text-sm text-destructive">{error}</span>
                </div>
            </div>
        );
    }

    // AI helped with the input fields
    return (
        <div className="relative w-full">
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    autoComplete="off"
                    disabled={!isLoaded || isLoading}
                    className="w-full pr-12 truncate"
                />
                {isLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                )}
            </div>
        </div>
    );
};

export default GoogleLocator;
