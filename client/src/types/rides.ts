import type { Event, SlotInfo } from "react-big-calendar";

export interface CalendarEvent extends Event {
    id: string | number;
    title: string;
    start: Date;
    end: Date;
    type?: "ride" | "unavailability" | string;
    resource?: {
        status?: string;
        details?: string;
        driver?: string;
        location?: string;
        [key: string]: unknown;
    };
}

export interface TimeBlock {
    start: string; // "09:00" format (24-hour)
    end: string; // "17:00" format (24-hour)
}

export interface BusinessHoursConfig {
    monday?: TimeBlock[];
    tuesday?: TimeBlock[];
    wednesday?: TimeBlock[];
    thursday?: TimeBlock[];
    friday?: TimeBlock[];
    saturday?: TimeBlock[];
    sunday?: TimeBlock[];
}

export interface BaseCalendarProps {
    // Required data
    events: CalendarEvent[];

    // Optional configuration
    businessHours?: BusinessHoursConfig;

    // Event handlers
    onEventSelect?: (event: CalendarEvent) => void;
    onSlotSelect?: (slotInfo: SlotInfo) => void;

    // UI customization
    actionButton?: {
        label: string;
        onClick: () => void;
    } | null;

    // Styling
    eventStyleGetter?: (event: CalendarEvent) => object;
}

// Availability status types (for event coloring)
export type AvailabilityStatus =
    | "scheduled"
    | "unassigned"
    | "cancelled"
    | "completed"
    | "withdrawn";
