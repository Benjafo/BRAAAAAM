import moment from "moment";
import { useCallback, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Views, type Event } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

// Availability status types
type AvailabilityStatus = "scheduled" | "unassigned" | "cancelled" | "completed" | "withdrawn";
// | "unavailable";
// | "available" ignore for now

interface CalendarEvent extends Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    resource?: {
        status: AvailabilityStatus;
        details?: string;
        driver?: string;
        location?: string;
    };
}
("////////////////////////////////////////////////////////////////////Sample Data///////////////////////////////////////////////////////////////////////////////////////////////////////////////////");
// Sample events data matching your calendar images
const sampleEvents: CalendarEvent[] = [
    // Sunday  - Available blocks
    {
        id: 1,
        title: "Scheduled",
        start: new Date(2025, 8, 27, 9, 0), // Sep 27, 2025, 9:00 AM
        end: new Date(2025, 8, 27, 11, 0), // Sep 27, 2025, 11:00 AM
        resource: { status: "scheduled", details: "9 - 11 AM" },
    },
    {
        id: 2,
        title: "Scheduled",
        start: new Date(2025, 8, 27, 11, 0), // Sep 27, 2025, 11:00 AM
        end: new Date(2025, 8, 27, 12, 0), // Sep 27, 2025, 12:00 PM
        resource: { status: "scheduled", details: "11 - 12 AM" },
    },
    {
        id: 3,
        title: "Cancelled",
        start: new Date(2025, 8, 25, 13, 0), // Sep 27, 2025, 1:00 PM
        end: new Date(2025, 8, 25, 14, 0), // Sep 27, 2025, 2:00 PM
        resource: { status: "cancelled", details: "1 - 2 PM" },
    },
    {
        id: 4,
        title: "Unassigned",
        start: new Date(2025, 8, 25, 15, 0), // Sep 27, 2025, 3:00 PM
        end: new Date(2025, 8, 25, 16, 0), // Sep 27, 2025, 4:00 PM
        resource: { status: "unassigned", details: "3 - 4 PM" },
    },
    {
        id: 5,
        title: "Unassigned",
        start: new Date(2025, 8, 25, 18, 0), // Sep 27, 2025, 6:00 PM
        end: new Date(2025, 8, 25, 19, 0), // Sep 27, 2025, 7:00 PM
        resource: { status: "unassigned", details: "6 - 7 PM" },
    },

    // Tuesday Aug 26 - Scheduled block
    {
        id: 6,
        title: "Completed",
        start: new Date(2025, 8, 26, 11, 0), // Aug 26, 2025, 11:00 AM
        end: new Date(2025, 8, 26, 12, 0), // Aug 26, 2025, 12:00 PM
        resource: { status: "completed", details: "11 - 12 AM" },
    },

    // Wednesday Aug 27 - Multiple availability blocks
    {
        id: 7,
        title: "Completed",
        start: new Date(2025, 8, 24, 11, 0), // Aug 27, 2025, 11:00 AM
        end: new Date(2025, 8, 24, 12, 0), // Aug 27, 2025, 12:00 PM
        resource: { status: "completed", details: "11 - 12 AM" },
    },
    {
        id: 8,
        title: "Scheduled",
        start: new Date(2025, 8, 26, 15, 0), // Aug 27, 2025, 3:00 PM
        end: new Date(2025, 8, 26, 18, 0), // Aug 27, 2025, 6:00 PM
        resource: { status: "scheduled", details: "3 - 5 AM" },
    },

    // Thursday Aug 28 - Withdrawn block
    {
        id: 9,
        title: "Withrawn",
        start: new Date(2025, 8, 29, 12, 0), // Aug 28, 2025, 12:00 PM
        end: new Date(2025, 8, 29, 13, 0), // Aug 28, 2025, 1:00 PM
        resource: { status: "withdrawn", details: "12 - 1 PM" },
    },

    // Friday Aug 29 - Multiple available blocks
    {
        id: 10,
        title: "Withdrawn",
        start: new Date(2025, 8, 29, 9, 0), // Aug 29, 2025, 9:00 AM
        end: new Date(2025, 8, 29, 11, 0), // Aug 29, 2025, 11:00 AM
        resource: { status: "withdrawn", details: "9 - 11 AM" },
    },
    {
        id: 11,
        title: "Scheduled",
        start: new Date(2025, 8, 29, 13, 0), // Aug 29, 2025, 1:00 PM
        end: new Date(2025, 8, 29, 14, 0), // Aug 29, 2025, 2:00 PM
        resource: { status: "scheduled", details: "1 - 2 AM" },
    },
    {
        id: 12,
        title: "Unassigned",
        start: new Date(2025, 8, 29, 16, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 8, 29, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "unassigned", details: "4 - 5 AM" },
    },
    {
        id: 13,
        title: "Unassigned",
        start: new Date(2025, 8, 30, 16, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 8, 30, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "unassigned", details: "4 - 5 PM" },
    },
    {
        id: 14,
        title: "Scheduled",
        start: new Date(2025, 9, 4, 16, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 4, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "4 - 5 PM" },
    },
    {
        id: 15,
        title: "Scheduled",
        start: new Date(2025, 9, 6, 13, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 6, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "1 - 5 PM" },
    },
    {
        id: 16,
        title: "Scheduled",
        start: new Date(2025, 9, 13, 9, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 13, 10, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "9 - 10 AM" },
    },
    {
        id: 17,
        title: "Scheduled",
        start: new Date(2025, 9, 13, 11, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 13, 12, 30), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "11 - 12:30 PM" },
    },
    {
        id: 18,
        title: "Scheduled",
        start: new Date(2025, 9, 13, 13, 30), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 13, 14, 30), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "1:30 - 2:30 PM" },
    },
    {
        id: 19,
        title: "Scheduled",
        start: new Date(2025, 9, 14, 14, 30), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 14, 15, 30), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "2:30 - 3:30 PM" },
    },
    {
        id: 20,
        title: "Cancelled",
        start: new Date(2025, 9, 14, 18, 30), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 14, 19, 30), // Aug 29, 2025, 5:00 PM
        resource: { status: "cancelled", details: "6:30 - 7:30 PM" },
    },
    {
        id: 21,
        title: "Scheduled",
        start: new Date(2025, 9, 15, 10, 30), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 15, 11, 30), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "10:30 - 11:30 AM" },
    },
    {
        id: 22,
        title: "Scheduled",
        start: new Date(2025, 9, 15, 15, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 15, 18, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "3:00 - 6:00 PM" },
    },
    {
        id: 23,
        title: "Withdrawn",
        start: new Date(2025, 9, 16, 12, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 16, 14, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "withdrawn", details: "12:00 - 2:00 PM" },
    },
    {
        id: 24,
        title: "Scheduled",
        start: new Date(2025, 9, 17, 9, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 17, 10, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "9:00 - 10:00 AM" },
    },
    {
        id: 25,
        title: "Scheduled",
        start: new Date(2025, 9, 17, 16, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 17, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "4:00 - 5:00 PM" },
    },
    {
        id: 26,
        title: "Scheduled",
        start: new Date(2025, 9, 18, 13, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 18, 14, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "1:00 - 2:00 PM" },
    },
];
("/////////////////////////////////////////////////////////////////////////Buttons////////////////////////////////////////////////////////////////////////////////////////////////////////////////");
// Custom Button component
const Button = ({
    children,
    className = "",
    variant = "default",
    disabled = false,
    ...props
}: any) => (
    <button
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            disabled
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : variant === "secondary"
                  ? "bg-gray-600 text-white hover:bg-gray-500"
                  : variant === "ghost"
                    ? "bg-transparent text-gray-300 hover:bg-gray-700 border border-gray-600"
                    : "bg-blue-600 text-white hover:bg-blue-500"
        } ${className}`}
        disabled={disabled}
        {...props}
    >
        {children}
    </button>
);

// Tab Button component
const TabButton = ({ active, onClick, children }: any) => (
    <button
        className={`px-4 py-2 rounded-none text-sm font-medium border border-gray-500 last:border-r-0 focus:outline-none focus:ring-0 ${
            active
                ? "bg-gray-600 text-white shadow"
                : "text-gray-300 hover:text-white hover:bg-black focus:bg-black focus:text-white active:bg-black active:text-white"
        }`}
        onClick={onClick}
    >
        {children}
    </button>
);
("///////////////////////////////////////////////////////////////////Big Calendar ///////////////////////////////////////////////////////////////////////////////////////////////////////////////");
export default function ReactBigCalendar() {
    const [currentView, setCurrentView] = useState(Views.WEEK);
    const [currentDate, setCurrentDate] = useState(new Date()); // Aug 25, 2025
    const [currentPage, setCurrentPage] = useState<"availability" | "schedule">("availability");

    // Custom event style getter
    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const status = event.resource?.status || "available";

        return {
            className: status,
        };
    }, []);

    const slotStyleGetter = useCallback((date: Date) => {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // Business hours: Mon-Fri 8 AM to 8 PM, Saturday 10:30 AM to 4 PM
        let isBusinessHours = false;
        let isBusinessDay = false;

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Monday to Friday: 8 AM to 8 PM
            isBusinessDay = true;
            isBusinessHours = hour >= 8 && hour < 20;
        } else if (dayOfWeek === 6) {
            // Saturday: 10:30 AM to 4 PM
            isBusinessDay = true;
            const timeInMinutes = hour * 60 + minute;
            const startTime = 10 * 60 + 30; // 10:30 AM
            const endTime = 16 * 60; // 4:00 PM
            isBusinessHours = timeInMinutes >= startTime && timeInMinutes < endTime;
        }

        // Company is closed on Sunday and outside business hours
        let backgroundColor = "#2a2a2a"; // default closed color

        if (isBusinessDay && isBusinessHours) {
            backgroundColor = "#000000";
        }

        if (dayOfWeek === 0) {
            return {
                style: {
                    backgroundColor: "#2a2a2a", // Sundays are closed
                    minHeight: "60px",
                    borderBottom: "1px solid #444444",
                },
            };
        }

        // Weekdays and Saturday: business hours are black, otherwise gray
        return {
            style: {
                backgroundColor: isBusinessHours ? "#000000" : "#2a2a2a",
                minHeight: "60px",
                borderBottom: "1px solid #444444",
            },
        };
    }, []);

    // Custom day style getter for Month view
    const dayPropGetter = useCallback(
        (date: Date) => {
            const dayOfWeek = date.getDay(); // 0 = Sunday
            const isOffRangeMonth = date.getMonth() !== currentDate.getMonth();

            // In Month view: off-range days should be black regardless of weekday
            if (currentView === Views.MONTH && isOffRangeMonth) {
                return {
                    style: {
                        backgroundColor: "#2a2a2a",
                    },
                };
            }

            // In-range Sundays use slightly lighter dark gray
            if (dayOfWeek === 0) {
                return {
                    style: {
                        backgroundColor: "#2a2a2a",
                    },
                };
            }
            return {};
        },
        [currentDate, currentView]
    );

    // Custom formats
    const formats = useMemo(
        () => ({
            dayHeaderFormat: (date: Date, culture?: string, localizer?: any) => {
                return localizer.format(date, "ddd DD", culture);
            },
            timeGutterFormat: (date: Date, culture?: string, localizer?: any) => {
                return localizer.format(date, "h A", culture);
            },
            eventTimeRangeFormat: ({ start, end }: any, culture?: string, localizer?: any) => {
                return `${localizer.format(start, "h:mm A", culture)} - ${localizer.format(end, "h:mm A", culture)}`;
            },
            agendaTimeFormat: (date: Date, culture?: string, localizer?: any) => {
                return localizer.format(date, "h:mm A", culture);
            },
        }),
        []
    );

    // Navigation handlers
    const handleNavigate = useCallback((newDate: Date) => {
        setCurrentDate(newDate);
    }, []);

    const handleViewChange = useCallback((view: any) => {
        setCurrentView(view);
    }, []);

    // Custom event component
    const EventComponent = ({ event }: { event: CalendarEvent }) => (
        <div className="text-xs leading-tight">
            <div className="font-medium">{event.title}</div>
            {event.resource?.details && (
                <div className="mt-0.5 text-xs opacity-90">{event.resource.details}</div>
            )}
        </div>
    );

    ("------------------------------------------------------------------------------------------Styles-----------------------------------------------------------------------------------------------------");
    // Custom CSS styles for dark themed colors
    const customStyles = `
    .rbc-calendar {
      background-color: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      height: 100%;
      border: none;
    }
    
    .rbc-header {
      background-color: #000000;
      border-bottom: none; /* remove bottom border */
      border-right: none; /* remove right border */
      color: #ffffff;
      font-weight: 500;
      padding: 8px 4px;
      text-align: center;
      font-size: 13px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .rbc-header:last-child {
      border-right: none;
    }

    /* Force specific borders in week view - top and left only black, rest gray */
    .rbc-time-view *,
    .rbc-time-view .rbc-time-header *,
    .rbc-time-view .rbc-time-header-gutter *,
    .rbc-time-view .rbc-time-gutter *,
    .rbc-time-view .rbc-header * {
      border-color: #444444 !important; /* default gray for most borders */
    }
    
    /* Top border below day headers - black */
    .rbc-time-view .rbc-time-header {
      border-bottom: 1px solid #000000 !important;
    }
    
    .rbc-time-view .rbc-time-header .rbc-row {
      border-bottom: 1px solid #000000 !important;
    }
    
    /* Left border (right of time column) - black */
    .rbc-time-view .rbc-time-header-gutter {
      border-right: 1px solid #000000 !important;
      border-bottom: 1px solid #000000 !important;
    }
    
    .rbc-time-view .rbc-time-gutter {
      border-right: 1px solid #000000 !important;
    }
    
    /* Force day separator borders to black - multiple selectors */
    .rbc-time-view .rbc-header,
    .rbc-time-view .rbc-time-header .rbc-header,
    .rbc-time-view .rbc-time-header .rbc-row .rbc-header {
      border-bottom: 1px solid #000000 !important;
      border-right: 1px solid #000000 !important;
      border-color: #000000 !important;
    }
    
    /* Override any remaining gray borders between headers */
    .rbc-time-view .rbc-header + .rbc-header {
      border-left: 1px solid #000000 !important;
    }
    
    /* Force all header borders to black */
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(1),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(2),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(3),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(4),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(5),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(6),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(7) {
      border-right: 1px solid #000000 !important;
      border-bottom: 1px solid #000000 !important;
    }
    
    .rbc-time-view {
      background-color: #000000;
      border: none;
    }
    
    .rbc-time-gutter {
      background-color: #000000;
      border-right: none; /* remove right border */
      width: 60px;
    }
    
    .rbc-time-gutter .rbc-timeslot-group {
      border-bottom: 1px solid #444444;
      min-height: 60px;
      background-color: #000000 !important;
    }
    
    .rbc-time-slot {
      border-top: none;
      min-height: 60px;
      

    }
    
    .rbc-day-slot {
      border-left: 1px solid #444444;

      min-height: 60px;

    }
    
    .rbc-day-slot:first-child {
      border-left: none;
    }
    
    .rbc-timeslot-group {
      border-bottom: 1px solid #444444;
      min-height: 60px;
    }
    
    .rbc-today {
      background-color: #1a1a1a;
    }
    
    .rbc-time-header-gutter {
      background-color: #000000;
      border-bottom: none; /* remove bottom border */
      border-right: none; /* remove right border */
      width: 60px;
    }
    
    .rbc-time-content  > .rbc-day-slot:first-child .rbc-time-slot{
      border-top: none;
      background-color: #2a2a2a !important;
    }

    /* Week view: make Sunday header match others (black) */
    .rbc-time-view .rbc-time-header .rbc-row .rbc-header:nth-child(1) {
      background-color: #000000 !important;
    }

    .rbc-day-slot.sunday .rbc-time-slot {
        background-color: #2a2a2a !important;
    }
    
    .rbc-time-gutter .rbc-time-slot {
      color: #ffffff;
      font-size: 11px;
      text-align: right;
      padding-right: 8px;
      border-bottom: 1px solid #444444;
      display: flex;
      align-items: flex-start;
      padding-top: 4px;
      background-color: #000000 !important;
    }

    /* Ensure time labels in the gutter stay on black */
    .rbc-time-gutter .rbc-label {
      background-color: #000000 !important;
      color: #ffffff;
    }
    
    .rbc-allday-cell {
      display: none;
    }
    
    .rbc-time-header-content {
      border-left: none;
    }
    
    .rbc-event {
      border: none !important;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
      padding: 8px 6px;
      margin: 2px;
      line-height: 1.2;
    }
    
    .rbc-event-content {
      font-size: 11px;
      line-height: 1.2;
    }
    
    .rbc-event.available {
      background-color: #86efac !important;
      color: #166534 !important;
    }
    
    .rbc-event.scheduled {
      background-color: #86efac !important;
      color: #166534 !important;
    }
    
    .rbc-event.withdrawn {
      background-color: #93c5fd !important;
      color: #1e40af !important;
    }
    
    .rbc-event.unavailable {
      background-color: #f8b4cb !important;
      color: #be185d !important;
    }
    
    .rbc-event.unassigned {
      background-color: #fde68a !important;
      color: #92400e !important;
    }
    
    .rbc-event.completed {
      background-color: #ffffff !important;
      color: #374151 !important;
    }
    
    .rbc-event.cancelled {
      background-color: #fbb6ce !important;
      color: #be185d !important;
    }
    
    .rbc-event-continues-after {
      border-bottom-right-radius: 0;
      border-top-right-radius: 0;
    }
    
    .rbc-event-continues-before {
      border-bottom-left-radius: 0;
      border-top-left-radius: 0;
    }
    
    .rbc-toolbar {
      display: none;
    }
    
    /* Force all navigation buttons to be black with no blue highlighting */
    button {
      background-color: #000000 !important;
      color: #ffffff !important;
      border-radius: 7px !important;
    }
    
    button:hover,
    button:focus,
    button:active {
      background-color: #000000 !important;
      color: #ffffff !important;
    }
    
    /* Active tabs should be dark gray */
    button.bg-black {
      background-color: #2a2a2a !important;
    }
    
    /* Override any blue highlighting */
    button:focus-visible {
      outline: none !important;
      box-shadow: none !important;
    }
    
    /* Specific override for Add Availability button */
    button.bg-gray-300 {
      background-color: #d1d5db !important;
      color: #000000 !important;
    }
    
    button.bg-gray-300:hover {
      background-color: #9ca3af !important;
      color: #000000 !important;
    }
    
    .rbc-time-slot:hover {
      background-color: #2a2a2a;
    }
    
    .rbc-current-time-indicator {
      background-color: #ef4444;
      height: 2px;
      z-index: 10;
    }
    
    .rbc-time-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .rbc-time-content::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    
    .rbc-time-content::-webkit-scrollbar-thumb {
      background: #4a4a4a;
      border-radius: 4px;
    }
    
    .rbc-time-content::-webkit-scrollbar-thumb:hover {
      background: #6a6a6a;
    }
    
    
    .rbc-time-view .rbc-time-gutter,
    .rbc-time-view .rbc-time-content > * {
      border-left: none;
    }

    .rbc-time-header {
      border-bottom: none; /* remove bottom border */
    }

    /* Month view: remove/lighten borders on weekday headers to black */
    .rbc-month-view .rbc-header {
      background-color: #000000;
      border-bottom: 1px solid #000000 !important;
      border-right: 1px solid #000000 !important;
    }
    .rbc-month-view .rbc-header + .rbc-header {
      border-left: 1px solid #000000 !important;
    }

    /* Month view: force off-range day backgrounds to black */
    .rbc-month-view .rbc-off-range-bg,
    .rbc-off-range-bg {
      background-color: #2a2a2a !important;
    }
    
    
    
  `;

    ("--------------------------------------------------------------------------------------------------HTML Struct------------------------------------------------------------------------------------------------");
    return (
        <div className="h-screen bg-black text-white">
            <style>{customStyles}</style>

            {/* Top Navigation Bar  */}
            <div className="bg-black border-b border-gray-600 px-4 py-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-white">
                            <span>{moment(currentDate).format("MMM DD, YYYY")}</span>
                        </div>

                        <div className="flex bg-gray-700 rounded overflow-hidden">
                            <TabButton
                                active={currentView === Views.DAY}
                                onClick={() => setCurrentView(Views.DAY)}
                            >
                                Day
                            </TabButton>
                            <TabButton
                                active={currentView === Views.WEEK}
                                onClick={() => setCurrentView(Views.WEEK)}
                            >
                                Week
                            </TabButton>
                            <TabButton
                                active={currentView === Views.MONTH}
                                onClick={() => setCurrentView(Views.MONTH)}
                            >
                                Month
                            </TabButton>
                        </div>

                        <div className="flex space-x-2">
                            <Button variant="ghost" className="text-xs">
                                Filters
                            </Button>
                            <Button variant="ghost" className="text-xs">
                                Print
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                const newDate = moment(currentDate)
                                    .subtract(
                                        1,
                                        currentView === Views.WEEK
                                            ? "week"
                                            : currentView === Views.DAY
                                              ? "day"
                                              : "month"
                                    )
                                    .toDate();
                                setCurrentDate(newDate);
                            }}
                            className="flex items-center space-x-1 text-xs"
                        >
                            <span>←</span>
                            <span>Previous</span>
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                const newDate = moment(currentDate)
                                    .add(
                                        1,
                                        currentView === Views.WEEK
                                            ? "week"
                                            : currentView === Views.DAY
                                              ? "day"
                                              : "month"
                                    )
                                    .toDate();
                                setCurrentDate(newDate);
                            }}
                            className="flex items-center space-x-1 text-xs"
                        >
                            <span>Next</span>
                            <span>→</span>
                        </Button>

                        <Button
                            className="bg-gray-300 text-black hover:bg-gray-400 px-4 py-1.5 rounded text-sm font-medium transition-colors"
                            style={{ color: "#000000" }}
                            onClick={() => {
                                console.log("Add Availability clicked");
                                // Handle add availability logic here
                            }}
                        >
                            Add Availability
                        </Button>
                    </div>
                </div>
            </div>

            {/* React Big Calendar  */}
            <div className="flex-1 bg-black" style={{ height: "calc(100vh - 80px)" }}>
                <Calendar
                    localizer={localizer}
                    events={sampleEvents}
                    startAccessor="start"
                    endAccessor="end"
                    view={currentView}
                    onView={handleViewChange}
                    date={currentDate}
                    onNavigate={handleNavigate}
                    eventPropGetter={eventStyleGetter}
                    slotPropGetter={slotStyleGetter}
                    dayPropGetter={dayPropGetter}
                    formats={formats}
                    components={{
                        event: EventComponent,
                    }}
                    min={new Date(1970, 1, 1, 7, 0, 0)} // 7 AM
                    max={new Date(1970, 1, 1, 21, 0, 0)} // 8 PM
                    step={60} // 1 hour steps
                    timeslots={1}
                    showMultiDayTimes={false}
                    toolbar={false}
                    popup={true}
                    views={[Views.DAY, Views.WEEK, Views.MONTH]}
                    defaultView={Views.WEEK}
                    scrollToTime={new Date(1970, 1, 1, 8, 0, 0)} // Auto scroll to 8 AM
                    onSelectEvent={(event) => {
                        console.log("Event clicked:", event);
                    }}
                    onSelectSlot={(slotInfo) => {
                        console.log("Slot selected:", slotInfo);
                        // Handle slot selection for creating new availability
                    }}
                    selectable
                />
            </div>
        </div>
    );
}
