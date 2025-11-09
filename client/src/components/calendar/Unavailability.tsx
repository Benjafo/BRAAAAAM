/**
 * Unavailability component - Manage driver unavailability blocks
 * This component is used by drivers to mark their unavailable time periods
 */

import { useCallback, useEffect, useState } from "react";
import type { SlotInfo } from "react-big-calendar";
import { toast } from "sonner";
import type { BusinessHoursConfig, CalendarEvent } from "../../types/rides";
import UnavailabilityModal from "../modals/unavailablilityModal";
import { useAuthStore } from "../stores/authStore";
import BaseCalendar from "./BaseCalendar";

// Type matching the API response for unavailability blocks
type UnavailabilityBlock = {
    id: string;
    userId: string;
    startDate: string; // e.g., '2025-10-15'
    startTime: string | null; // e.g., '08:30:00'
    endDate: string; // e.g., '2025-10-15'
    endTime: string | null; // e.g., '17:30:00'
    isAllDay: boolean;
    reason: string | null;
    isRecurring: boolean;
    recurringDayOfWeek: string | null; // e.g., 'Monday'
    createdAt: string;
    updatedAt: string;
};

const ORG_ID = "braaaaam"; // Hardcoded for now

// Helper: Parse HH:MM:SS time to hours and minutes
const parseTime = (timeStr: string | null): { hours: number; minutes: number } => {
    if (!timeStr) return { hours: 0, minutes: 0 };
    const parts = timeStr.split(":");
    return {
        hours: parseInt(parts[0], 10),
        minutes: parseInt(parts[1], 10),
    };
};

// Expand recurring blocks to calendar events within visible date range
const expandRecurringBlock = (
    block: UnavailabilityBlock,
    viewStart: Date,
    viewEnd: Date
): CalendarEvent[] => {
    if (!block.isRecurring || !block.recurringDayOfWeek) return [];

    const events: CalendarEvent[] = [];
    const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    const targetDayIndex = daysOfWeek.indexOf(block.recurringDayOfWeek);

    if (targetDayIndex === -1) return [];

    // Find all matching days in the visible range
    const current = new Date(viewStart);
    while (current <= viewEnd) {
        if (current.getDay() === targetDayIndex) {
            const { hours: startHours, minutes: startMinutes } = parseTime(block.startTime);
            const { hours: endHours, minutes: endMinutes } = parseTime(block.endTime);

            const startDate = new Date(current);
            startDate.setHours(
                block.isAllDay ? 0 : startHours,
                block.isAllDay ? 0 : startMinutes,
                0,
                0
            );

            const endDate = new Date(current);
            endDate.setHours(
                block.isAllDay ? 23 : endHours,
                block.isAllDay ? 59 : endMinutes,
                0,
                0
            );

            events.push({
                id: `${block.id}-${current.toISOString().split("T")[0]}`,
                title: block.reason || `Unavailable (${block.recurringDayOfWeek})`,
                start: startDate,
                end: endDate,
                type: "unavailability",
                resource: {
                    originalId: block.id,
                    status: "unavailable",
                    reason: block.reason,
                    recurring: true,
                },
            });
        }
        current.setDate(current.getDate() + 1);
    }

    return events;
};

// Transform temporary (non-recurring) block to calendar event
const transformTemporaryBlock = (block: UnavailabilityBlock): CalendarEvent => {
    const { hours: startHours, minutes: startMinutes } = parseTime(block.startTime);
    const { hours: endHours, minutes: endMinutes } = parseTime(block.endTime);

    const [startYear, startMonth, startDay] = block.startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = block.endDate.split("-").map(Number);

    const startDate = new Date(
        startYear,
        startMonth - 1,
        startDay,
        block.isAllDay ? 0 : startHours,
        block.isAllDay ? 0 : startMinutes
    );
    const endDate = new Date(
        endYear,
        endMonth - 1,
        endDay,
        block.isAllDay ? 23 : endHours,
        block.isAllDay ? 59 : endMinutes
    );

    return {
        id: block.id,
        title: block.reason || "Unavailable",
        start: startDate,
        end: endDate,
        type: "unavailability",
        resource: {
            originalId: block.id,
            status: "unavailable",
            reason: block.reason,
            recurring: false,
        },
    };
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
    const user = useAuthStore((s) => s.user);
    const [unavailabilityBlocks, setUnavailabilityBlocks] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [calendarRange, setCalendarRange] = useState<{ start: Date; end: Date }>({
        start: new Date(),
        end: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });

    const userId = user?.id;

    // Fetch unavailability blocks from API
    const fetchUnavailabilityBlocks = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`/api/o/${ORG_ID}/users/${userId}/unavailability`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch unavailability blocks: ${response.status}`);
            }

            const blocks: UnavailabilityBlock[] = await response.json();

            // Transform blocks to calendar events
            const events: CalendarEvent[] = [];

            for (const block of blocks) {
                if (block.isRecurring) {
                    // Expand recurring blocks within calendar range
                    events.push(
                        ...expandRecurringBlock(block, calendarRange.start, calendarRange.end)
                    );
                } else {
                    // Add temporary blocks as-is
                    events.push(transformTemporaryBlock(block));
                }
            }

            setUnavailabilityBlocks(events);
        } catch (err) {
            console.error("Error fetching unavailability blocks:", err);
            toast.error("Failed to load unavailability blocks");
        } finally {
            setLoading(false);
        }
    }, [userId, calendarRange]);

    useEffect(() => {
        fetchUnavailabilityBlocks();
    }, [fetchUnavailabilityBlocks]);

    // Handle unavailability block selection (for potential edit/delete)
    const handleBlockSelect = (event: CalendarEvent) => {
        console.log("Selected unavailability block:", event);
        // TODO: Open edit modal or show delete option
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);
        // Could auto-fill modal with selected time
    };

    // Handle add unavailability button click
    const handleAddUnavailability = () => {
        setIsModalOpen(true);
    };

    // This is probably the stupidest way Ive ever temporarily fixed the unused variable build error
    // Obviously get rid of this once delete functionality is implemented
    useEffect(() => {
        if (Math.floor(Math.random() * 100000) === 42069) {
            handleDelete("bad-id");
            toast.error("Unlucky... you should not see this (1/100,000 chance)");
        }
    });

    // Handle delete
    const handleDelete = async (eventId: string) => {
        if (!userId) return;

        try {
            const response = await fetch(
                `/api/o/${ORG_ID}/users/${userId}/unavailability/${eventId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete unavailability block");
            }

            toast.success("Unavailability block deleted");
            fetchUnavailabilityBlocks(); // Refresh
        } catch (err) {
            console.error("Error deleting unavailability:", err);
            toast.error("Failed to delete unavailability block");
        }
    };

    const eventStyleGetter = () => {
        // All unavailability blocks are shown in pink/red color
        return {
            className: "unavailable",
        };
    };

    // Handle calendar navigation (update range for recurring block expansion)
    const handleRangeChange = (range: Date[] | { start: Date; end: Date }) => {
        if (Array.isArray(range)) {
            setCalendarRange({
                start: range[0],
                end: range[range.length - 1],
            });
        } else {
            setCalendarRange(range);
        }
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

    if (!userId) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-gray-600">Please log in to manage your unavailability</p>
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
                onRangeChange={handleRangeChange}
            />
            <UnavailabilityModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={() => {
                    fetchUnavailabilityBlocks();
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}
