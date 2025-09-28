import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "./input";
import type { Location } from "@/lib/types";
import type { LocationSelectorProps } from "@/lib/types";
import { MapPin } from "lucide-react";

const GoogleLocator: React.FC<LocationSelectorProps> = ({
    onLocationSelect,
    placeholder = "Search for a location...",
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        const initializeGooglePlaces = async () => {
            try {
                const loader = new Loader({
                    apiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
                    version: "weekly",
                    libraries: ["places"],
                });

                await loader.importLibrary("places");
                setIsLoaded(true);
            } catch (error) {
                console.error("Error loading Google Places API:", error);
            }
        };

        initializeGooglePlaces();
    }, []);

    useEffect(() => {
        if (isLoaded && inputRef.current && !autocompleteRef.current) {
            // Autocomplete initialization
            autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
                fields: ["place_id", "formatted_address", "geometry.location"],
                componentRestrictions: { country: "us" },
            });

            // Handling location change
            autocompleteRef.current.addListener("place_changed", () => {
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
            });
        }

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [isLoaded, onLocationSelect]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        if (e.target.value === "") {
            onLocationSelect(null);
        }
    };

    // Could potentially add this for a clear button at the end of input, don't know if we want that or not
    // const handleClear = () => {
    //     setInputValue("");
    //     onLocationSelect(null);
    //     inputRef.current?.focus();
    // };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={!isLoaded}
                    className="w-full pr-12 truncate" // padding for icon
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
};

export default GoogleLocator;
