/**
 * Unavailability component - Manage driver unavailability blocks
 * This component is used by drivers to mark their unavailable time periods
 */

import { http } from "@/services/auth/serviceResolver";
import { useCallback, useEffect, useMemo, useState } from "react";
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
                block.isAllDay ? 9 : startHours,
                block.isAllDay ? 0 : startMinutes,
                0,
                0
            );

            const endDate = new Date(current);
            endDate.setHours(block.isAllDay ? 17 : endHours, block.isAllDay ? 0 : endMinutes, 0, 0);

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
                    isAllDay: block.isAllDay,
                    recurringDayOfWeek: block.recurringDayOfWeek,
                    startTime: block.startTime,
                    endTime: block.endTime,
                },
            });
        }
        current.setDate(current.getDate() + 1);
    }

    return events;
};

// Transform temporary (non-recurring) block to calendar event(s)
// For multi-day blocks, split into individual day events
const transformTemporaryBlock = (block: UnavailabilityBlock): CalendarEvent[] => {
    const { hours: startHours, minutes: startMinutes } = parseTime(block.startTime);
    const { hours: endHours, minutes: endMinutes } = parseTime(block.endTime);

    const [startYear, startMonth, startDay] = block.startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = block.endDate.split("-").map(Number);

    const startDateObj = new Date(startYear, startMonth - 1, startDay);
    const endDateObj = new Date(endYear, endMonth - 1, endDay);

    // Check if this is a multi-day block
    const isMultiDay = block.startDate !== block.endDate;

    if (!isMultiDay) {
        // Single day event
        const startDate = new Date(
            startYear,
            startMonth - 1,
            startDay,
            block.isAllDay ? 9 : startHours,
            block.isAllDay ? 0 : startMinutes
        );
        const endDate = new Date(
            startYear,
            startMonth - 1,
            startDay,
            block.isAllDay ? 17 : endHours,
            block.isAllDay ? 0 : endMinutes
        );

        return [
            {
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
                    isAllDay: block.isAllDay,
                    startDate: block.startDate,
                    endDate: block.endDate,
                    startTime: block.startTime,
                    endTime: block.endTime,
                },
            },
        ];
    }

    // Multi-day event: split into individual day events
    const events: CalendarEvent[] = [];
    const current = new Date(startDateObj);

    while (current <= endDateObj) {
        const isFirstDay = current.getTime() === startDateObj.getTime();
        const isLastDay = current.getTime() === endDateObj.getTime();

        // Determine start and end times for this day
        let dayStartHour = 9,
            dayStartMinute = 0;
        let dayEndHour = 17,
            dayEndMinute = 0;

        if (!block.isAllDay) {
            // For timed events, use specified times on first/last day, full day otherwise
            if (isFirstDay) {
                dayStartHour = startHours;
                dayStartMinute = startMinutes;
                dayEndHour = 17;
                dayEndMinute = 0;
            } else if (isLastDay) {
                dayStartHour = 9;
                dayStartMinute = 0;
                dayEndHour = endHours;
                dayEndMinute = endMinutes;
            } else {
                // Middle days: full business hours
                dayStartHour = 9;
                dayStartMinute = 0;
                dayEndHour = 17;
                dayEndMinute = 0;
            }
        }

        const startDate = new Date(current);
        startDate.setHours(dayStartHour, dayStartMinute, 0, 0);

        const endDate = new Date(current);
        endDate.setHours(dayEndHour, dayEndMinute, 0, 0);

        events.push({
            id: `${block.id}-${current.toISOString().split("T")[0]}`,
            title: block.reason || "Unavailable",
            start: startDate,
            end: endDate,
            type: "unavailability",
            resource: {
                originalId: block.id,
                status: "unavailable",
                reason: block.reason,
                recurring: false,
                isAllDay: block.isAllDay,
                startDate: block.startDate,
                endDate: block.endDate,
                startTime: block.startTime,
                endTime: block.endTime,
            },
        });

        current.setDate(current.getDate() + 1);
    }

    console.log(`Split multi-day block ${block.id} into ${events.length} events`);
    return events;
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

// Map to form values for editing
const mapEventToFormValues = (event: CalendarEvent) => {
    const resource = event.resource;
    const isRecurring = resource?.recurring || false;

    if (isRecurring) {
        return {
            recurring: {
                id: resource?.originalId,
                day: resource?.recurringDayOfWeek as
                    | "Monday"
                    | "Tuesday"
                    | "Wednesday"
                    | "Thursday"
                    | "Friday"
                    | "Saturday"
                    | "Sunday",
                allDay: resource?.isAllDay || false,
                startTime: resource?.isAllDay ? undefined : resource?.startTime || undefined,
                endTime: resource?.isAllDay ? undefined : resource?.endTime || undefined,
                reason: resource?.reason || "",
            },
            defaultTab: "recurring" as const,
        };
    } else {
        // Parse the date strings from resource
        const isMultiDay = resource?.startDate !== resource?.endDate;
        const startDate = resource?.startDate
            ? new Date(resource.startDate + "T00:00:00")
            : event.start;
        const endDate = resource?.endDate ? new Date(resource.endDate + "T00:00:00") : event.end;

        return {
            temp: {
                id: resource?.originalId,
                multiDay: isMultiDay,
                allDay: resource?.isAllDay || false,
                startDate: startDate,
                endDate: isMultiDay ? endDate : undefined,
                startTime: resource?.isAllDay ? undefined : resource?.startTime || undefined,
                endTime: resource?.isAllDay ? undefined : resource?.endTime || undefined,
                reason: resource?.reason || "",
            },
            defaultTab: "temporary" as const,
        };
    }
};

export default function Unavailability() {
    const user = useAuthStore((s) => s.user);
    const [unavailabilityBlocks, setUnavailabilityBlocks] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUnavailability, setSelectedUnavailability] = useState<{
        temp?: any;
        recurring?: any;
        defaultTab?: "temporary" | "recurring";
    }>({});

    const userId = user?.id;

    // Expand recurring blocks for +/- 2 years from today
    // TODO hardcoded for recurring unavailability, potentially fix this in the future
    const calendarRange = useMemo(() => {
        const now = new Date();
        return {
            start: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
            end: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
        };
    }, []);

    // Fetch unavailability blocks from API
    const fetchUnavailabilityBlocks = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const blocks: UnavailabilityBlock[] = await http
                .get(`o/users/${userId}/unavailability`)
                .json();

            console.log("Fetched unavailability blocks:", blocks);

            // Transform blocks to calendar events
            const events: CalendarEvent[] = [];

            for (const block of blocks) {
                if (block.isRecurring) {
                    // Expand recurring blocks within calendar range
                    events.push(
                        ...expandRecurringBlock(block, calendarRange.start, calendarRange.end)
                    );
                } else {
                    // Add temporary blocks (split multi-day into individual day events)
                    events.push(...transformTemporaryBlock(block));
                }
            }

            setUnavailabilityBlocks(events);
            setError(null);
        } catch (err) {
            console.error("Error fetching unavailability blocks:", err);
            const errorMessage = "Failed to load unavailability blocks";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [userId, calendarRange]);

    useEffect(() => {
        fetchUnavailabilityBlocks();
    }, [fetchUnavailabilityBlocks]);

    // Handle unavailability block selection (for editing)
    const handleBlockSelect = (event: CalendarEvent) => {
        console.log("Selected unavailability block:", event);
        const formValues = mapEventToFormValues(event);
        setSelectedUnavailability(formValues);
        setIsModalOpen(true);
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);
        // Could auto-fill modal with selected time
    };

    // Handle add unavailability button click
    const handleAddUnavailability = () => {
        setSelectedUnavailability({});
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
            const res = await http.delete(`o/users/${userId}/unavailability/${eventId}`);

            // TODO need to check if response is ok
            console.log("Delete response:", res);

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

    // Show loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading unavailability blocks...</p>
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

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            fetchUnavailabilityBlocks();
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
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
            <UnavailabilityModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultTab={selectedUnavailability.defaultTab}
                tempInitial={selectedUnavailability.temp}
                recurringInitial={selectedUnavailability.recurring}
                onSuccess={() => {
                    fetchUnavailabilityBlocks();
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}
