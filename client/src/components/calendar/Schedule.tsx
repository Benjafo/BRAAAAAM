/**
 * Schedule component - View all rides calendar
 * This component is used by admins and dispatchers to view and manage all rides
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

const API_RIDES_ENDPOINT = `http://localhost:3000/dummy/rides`;

// Transform API ride data to CalendarEvent format
// ai helped with this data transformation
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
        const durationMs = ride.duration * 60 * 1000;
        const endDate = new Date(startDate.getTime() + durationMs);

        // Extract driver name from dispatcher (if assigned)
        const driverName = ride.status === "unassigned" ? undefined : ride.dispatcherName;

        return {
            id: index + 1,
            title: ride.clientName,
            start: startDate,
            end: endDate,
            type: "ride",
            resource: {
                status: ride.status,
                clientName: ride.clientName,
                driverName: driverName,
                purpose: "Medical appointment", // Default purpose since API doesn't provide it
                details: `Ride to ${ride.destinationAddress.split(",")[0]}`,
                driver: driverName,
                location: ride.destinationAddress,
                dispatcherName: ride.dispatcherName,
            },
        };
    });
};

// Standard 9-5 business hours configuration
const businessHours: BusinessHoursConfig = {
    monday: [{ start: "09:00", end: "17:00" }],
    tuesday: [{ start: "09:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "17:00" }],
    thursday: [{ start: "09:00", end: "17:00" }],
    friday: [{ start: "09:00", end: "17:00" }],
    saturday: [], // Closed on Saturday
    sunday: [], // Closed on Sunday
};

export default function Schedule() {
    const [rides, setRides] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch rides from API
    useEffect(() => {
        const fetchRides = async () => {
            try {
                setLoading(true);

                // Fetch all rides without pagination for calendar view
                const response = await fetch(`${API_RIDES_ENDPOINT}?pageSize=1000`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch rides: ${response.status}`);
                }

                const data = await response.json();
                const transformedRides = transformRidesToCalendarEvents(data.data || []);
                setRides(transformedRides);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching rides:", err);
            }
        };

        fetchRides();
    }, []);

    // Handle ride selection
    const handleRideSelect = (event: CalendarEvent) => {
        console.log("Selected ride:", event);
        alert(`
            Ride Details:
            ID: ${event.id}
            Title: ${event.title}
            Status: ${event.resource?.status}
            Location: ${event.resource?.location}
            Details: ${event.resource?.details}
            Driver: ${event.resource?.driver || "Unassigned"}
        `);
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);
        const startTime = slotInfo.start.toLocaleTimeString();
        const endTime = slotInfo.end.toLocaleTimeString();
        alert(`Create new ride for:\nStart: ${startTime}\nEnd: ${endTime}`);
    };

    // Handle create ride button click
    const handleCreateRide = () => {
        console.log("Create Ride button clicked");
        alert("Create Ride modal would open here");
    };

    // Show loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading rides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <BaseCalendar
                events={rides}
                businessHours={businessHours}
                actionButton={{
                    label: "Create Ride",
                    onClick: handleCreateRide,
                }}
                onEventSelect={handleRideSelect}
                onSlotSelect={handleSlotSelect}
            />
        </div>
    );
}
