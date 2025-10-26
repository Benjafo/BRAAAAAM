/**
 * Unavailability component - Manage driver unavailability blocks
 * This component is used by drivers to mark their unavailable time periods
 */

import { useEffect, useState } from "react";
import type { SlotInfo } from "react-big-calendar";
import type { BusinessHoursConfig, CalendarEvent } from "../../types/rides";
import BaseCalendar from "./BaseCalendar";

// Type matching the API response for unavailability blocks
type UnavailabilityBlock = {
    id: number;
    startDate: string; // e.g., '2025-10-15'
    startTime: string; // e.g., '08:30 AM'
    endDate: string; // e.g., '2025-10-15'
    endTime: string; // e.g., '05:30 PM'
    reason?: string;
    recurring?: boolean;
    recurringPattern?: "daily" | "weekly" | "monthly";
};

const API_UNAVAILABILITY_ENDPOINT = `http://localhost:3000/dummy/unavailability`;

// Transform API unavailability data to CalendarEvent format
const transformUnavailabilityToCalendarEvents = (
    blocks: UnavailabilityBlock[]
): CalendarEvent[] => {
    return blocks.map((block) => {
        // Parse start date and time
        const [startYear, startMonth, startDay] = block.startDate.split("-").map(Number);
        const [startTimeStr, startPeriod] = block.startTime.split(" ");
        let [startHours, startMinutes] = startTimeStr.split(":").map(Number);

        // Convert to 24-hour format for start time
        if (startPeriod === "PM" && startHours !== 12) {
            startHours += 12;
        } else if (startPeriod === "AM" && startHours === 12) {
            startHours = 0;
        }

        // Parse end date and time
        const [endYear, endMonth, endDay] = block.endDate.split("-").map(Number);
        const [endTimeStr, endPeriod] = block.endTime.split(" ");
        let [endHours, endMinutes] = endTimeStr.split(":").map(Number);

        // Convert to 24-hour format for end time
        if (endPeriod === "PM" && endHours !== 12) {
            endHours += 12;
        } else if (endPeriod === "AM" && endHours === 12) {
            endHours = 0;
        }

        const startDate = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes);
        const endDate = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes);

        return {
            id: block.id,
            title: block.reason || "Unavailable",
            start: startDate,
            end: endDate,
            type: "unavailability",
            resource: {
                status: "unavailable",
                reason: block.reason || "Personal",
                recurring: block.recurring,
                recurringPattern: block.recurringPattern,
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

export default function Unavailability() {
    const [unavailabilityBlocks, setUnavailabilityBlocks] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch unavailability blocks from API
    useEffect(() => {
        const fetchUnavailabilityBlocks = async () => {
            try {
                setLoading(true);

                const response = await fetch(`${API_UNAVAILABILITY_ENDPOINT}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch unavailability blocks: ${response.status}`);
                }
                const data = await response.json();
                const transformedBlocks = transformUnavailabilityToCalendarEvents(data.data || []);
                setUnavailabilityBlocks(transformedBlocks);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching unavailability blocks:", err);
                setLoading(false);
            }
        };

        fetchUnavailabilityBlocks();
    }, []);

    // Handle unavailability block selection
    const handleBlockSelect = (event: CalendarEvent) => {
        console.log("Selected unavailability block:", event);
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);
    };

    // Handle add unavailability button click
    const handleAddUnavailability = () => {
        console.log("Add Unavailability button clicked");
        alert(
            "Add Unavailability modal would open here with options for:\n- Date/Time selection\n- Reason\n- Recurring options"
        );
    };

    const eventStyleGetter = (_event: CalendarEvent) => {
        // All unavailability blocks are shown in pink/red color
        return {
            className: "unavailable",
        };
    };

    // Show loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading unavailability blocks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <BaseCalendar
                events={unavailabilityBlocks}
                businessHours={businessHours}
                actionButton={{
                    label: "Add Unavailability",
                    onClick: handleAddUnavailability,
                }}
                onEventSelect={handleBlockSelect}
                onSlotSelect={handleSlotSelect}
                eventStyleGetter={eventStyleGetter}
            />
        </div>
    );
}
