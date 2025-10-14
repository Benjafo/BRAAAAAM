import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "./ui/input";
import type { Location, LocationSelectorProps } from "@/lib/types";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

const GoogleLocator: React.FC<LocationSelectorProps> = ({
    onLocationSelect,
    placeholder = "Search for a location...",
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");

    // Initialize Google Places API, some AI logic was used to help set this up
    // To use locator, you need to initalize function handleLocationSelect, like this for an example:
    //   const handleLocationSelect = (location: Location | null) => {
    //    location;
    // };
    // Then you call it like this (in the location you want it) : <GoogleLocator onLocationSelect={handleLocationSelect} />
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
        if (place && place.place_id && place.geometry?.location) {
            const location: Location = {
                placeId: place.place_id,
                address: place.formatted_address || "",
                coordinates: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                },
            };
            setInputValue(place.formatted_address || "");
            onLocationSelect(location);
        }
    }, [onLocationSelect]);

    // Initialize autocomplete when API is loaded
    useEffect(() => {
        if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["place_id", "formatted_address", "geometry.location"],
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
        const value = e.target.value;
        setInputValue(value);
        if (value === "") onLocationSelect(null);
    };

    // handle error, AI used to help write this
    if (error) {
        return (
            <div className="relative w-full">
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
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
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={!isLoaded || isLoading}
                    className="w-full pr-12 truncate"
                />
                {isLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                )}
            </div>
        </div>
    );
};

export default GoogleLocator;
