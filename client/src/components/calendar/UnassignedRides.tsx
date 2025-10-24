/**
 * UnassignedRides component - View only unassigned rides in calendar
 * This component is used by dispatchers to view and assign unassigned rides
 */

import { useEffect, useState } from "react";
import type { SlotInfo } from "react-big-calendar";
import type { BusinessHoursConfig, CalendarEvent } from "../../types/rides";
import BaseCalendar from "./BaseCalendar";

// Type matching the API response
type RideFromAPI = {
    date: string; // e.g., '2025-10-15'
    time: string; // e.g., '08:30 AM'
    duration: number; // duration in minutes
    clientName: string;
    destinationAddress: string;
    dispatcherName: string;
    status: "unassigned" | "scheduled" | "cancelled" | "completed" | "withdrawn";
};

const API_RIDES_ENDPOINT = `http://localhost:3000/dummy/rides?status=unassigned&pageSize=1000`;

// Transform API ride data to CalendarEvent format
const transformRidesToCalendarEvents = (rides: RideFromAPI[]): CalendarEvent[] => {
    return rides.map((ride, index) => {
        // Parse date and time
        const [year, month, day] = ride.date.split("-").map(Number);
        const [time, period] = ride.time.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        // Convert to 24-hour format
        if (period === "PM" && hours !== 12) {
            hours += 12;
        } else if (period === "AM" && hours === 12) {
            hours = 0;
        }

        const startDate = new Date(year, month - 1, day, hours, minutes);
        // Use duration from API (in minutes)
        const durationMs = ride.duration * 60 * 1000;
        const endDate = new Date(startDate.getTime() + durationMs);

        return {
            id: index + 1,
            title: ride.clientName,
            start: startDate,
            end: endDate,
            type: "ride",
            resource: {
                status: "unassigned", // Always unassigned in this view
                clientName: ride.clientName,
                driverName: undefined, // No driver for unassigned rides
                purpose: "Medical appointment",
                details: `Ride to ${ride.destinationAddress.split(",")[0]}`,
                driver: undefined,
                location: ride.destinationAddress,
                dispatcherName: ride.dispatcherName,
            },
        };
    });
};

// Business hours configuration
const businessHours: BusinessHoursConfig = {
    monday: [{ start: "09:00", end: "17:00" }],
    tuesday: [{ start: "09:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "17:00" }],
    thursday: [{ start: "09:00", end: "17:00" }],
    friday: [{ start: "09:00", end: "17:00" }],
    saturday: [],
    sunday: [],
};

export default function UnassignedRides() {
    const [rides, setRides] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch unassigned rides from API
    useEffect(() => {
        const fetchUnassignedRides = async () => {
            try {
                setLoading(true);

                const response = await fetch(API_RIDES_ENDPOINT);

                if (!response.ok) {
                    throw new Error(`Failed to fetch unassigned rides: ${response.status}`);
                }

                const data = await response.json();
                const transformedRides = transformRidesToCalendarEvents(data.data || []);
                setRides(transformedRides);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching unassigned rides:", err);
            }
        };

        fetchUnassignedRides();
    }, []);

    // Handle ride selection - for assigning driver
    const handleRideSelect = (event: CalendarEvent) => {
        console.log("Selected unassigned ride:", event);

        // Open a modal to assign a driver
        alert(`
            Unassigned Ride Details:
            Client: ${event.resource?.clientName}
            Location: ${event.resource?.location}
            Date: ${event.start.toLocaleDateString()}
            Time: ${event.start.toLocaleTimeString()}
            Duration: ${(event.end.getTime() - event.start.getTime()) / (1000 * 60)} minutes

            Click to assign a driver...
        `);
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);

        const startTime = slotInfo.start.toLocaleTimeString();
        const endTime = slotInfo.end.toLocaleTimeString();
        alert(`Create new unassigned ride for:\nStart: ${startTime}\nEnd: ${endTime}`);
    };

    // Handle create ride button
    const handleCreateUnassignedRide = () => {
        console.log("Creating new unassigned ride...");
        alert("Create Unassigned Ride modal would open here");
    };

    // Show loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading unassigned rides...</p>
                </div>
            </div>
        );
    }

    // Show empty state if no unassigned rides
    if (rides.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Unassigned Rides
                        </h3>
                        <p className="text-gray-600 mb-4">
                            All rides have been assigned to drivers
                        </p>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={handleCreateUnassignedRide}
                        >
                            Create New Ride
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <BaseCalendar
                events={rides}
                businessHours={businessHours}
                onEventSelect={handleRideSelect}
                onSlotSelect={handleSlotSelect}
            />
        </div>
    );
}
