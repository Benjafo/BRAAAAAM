import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import moment from "moment";
import { useCallback, useState } from "react";
import { Calendar, momentLocalizer, Views, type Event, type View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "./components/ui/button";

const localizer = momentLocalizer(moment);

// Availability status types
type AvailabilityStatus = "scheduled" | "unassigned" | "cancelled" | "completed" | "withdrawn";

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

const sampleEvents: CalendarEvent[] = [
    // Sunday  - Available blocks
    {
        id: 1,
        title: "Scheduled",
        start: new Date(2025, 8, 27, 9, 0), // Sep 27, 2025, 9:00 AM
        end: new Date(2025, 8, 27, 11, 0), // Sep 27, 2025, 11:00 AM
        resource: { status: "scheduled", details: "9:00 - 11:00 AM" },
    },
    {
        id: 2,
        title: "Scheduled",
        start: new Date(2025, 8, 27, 11, 0), // Sep 27, 2025, 11:00 AM
        end: new Date(2025, 8, 27, 12, 15), // Sep 27, 2025, 12:00 PM
        resource: { status: "scheduled", details: "11:00 - 12:15 PM" },
    },
    {
        id: 3,
        title: "Cancelled",
        start: new Date(2025, 8, 25, 13, 0), // Sep 27, 2025, 1:00 PM
        end: new Date(2025, 8, 25, 14, 0), // Sep 27, 2025, 2:00 PM
        resource: { status: "cancelled", details: "1:00 - 2:00 PM" },
    },
    {
        id: 4,
        title: "Unassigned",
        start: new Date(2025, 8, 25, 15, 0), // Sep 27, 2025, 3:00 PM
        end: new Date(2025, 8, 25, 16, 0), // Sep 27, 2025, 4:00 PM
        resource: { status: "unassigned", details: "3:00 - 4:00 PM" },
    },
    {
        id: 5,
        title: "Unassigned",
        start: new Date(2025, 8, 25, 9, 0), // Sep 27, 2025, 9:00 AM
        end: new Date(2025, 8, 25, 13, 0), // Sep 27, 2025, 1:00 PM
        resource: { status: "unassigned", details: "9:00 AM - 1:00 PM" },
    },

    // Tuesday Aug 26 - Scheduled block
    {
        id: 6,
        title: "Completed",
        start: new Date(2025, 8, 26, 11, 0), // Aug 26, 2025, 11:00 AM
        end: new Date(2025, 8, 26, 12, 0), // Aug 26, 2025, 12:00 PM
        resource: { status: "completed", details: "11:00 AM - 12:00 PM" },
    },

    // Wednesday Aug 27 - Multiple availability blocks
    {
        id: 7,
        title: "Completed",
        start: new Date(2025, 8, 24, 11, 0), // Aug 27, 2025, 11:00 AM
        end: new Date(2025, 8, 24, 12, 0), // Aug 27, 2025, 12:00 PM
        resource: { status: "completed", details: "11:00 AM - 12:00 PM" },
    },
    {
        id: 8,
        title: "Scheduled",
        start: new Date(2025, 8, 26, 15, 0), // Aug 27, 2025, 3:00 PM
        end: new Date(2025, 8, 26, 17, 0), // Aug 27, 2025, 5:00 PM
        resource: { status: "scheduled", details: "3:00 - 5:00 PM" },
    },

    // Thursday Aug 28 - Withdrawn block
    {
        id: 9,
        title: "Withrawn",
        start: new Date(2025, 8, 29, 12, 0), // Aug 28, 2025, 12:00 PM
        end: new Date(2025, 8, 29, 15, 0), // Aug 28, 2025, 3:00 PM
        resource: { status: "withdrawn", details: "12:00 - 3:00 PM" },
    },

    // Friday Aug 29 - Multiple available blocks
    {
        id: 10,
        title: "Withdrawn",
        start: new Date(2025, 8, 29, 9, 0), // Aug 29, 2025, 9:00 AM
        end: new Date(2025, 8, 29, 11, 0), // Aug 29, 2025, 11:00 AM
        resource: { status: "withdrawn", details: "9:00 - 11:00 AM" },
    },
    {
        id: 11,
        title: "Scheduled",
        start: new Date(2025, 8, 29, 13, 0), // Aug 29, 2025, 1:00 PM
        end: new Date(2025, 8, 29, 14, 0), // Aug 29, 2025, 2:00 PM
        resource: { status: "scheduled", details: "1:00 - 2:00 PM" },
    },
    {
        id: 12,
        title: "Unassigned",
        start: new Date(2025, 8, 29, 16, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 8, 29, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "unassigned", details: "4:00 - 5:00 PM" },
    },
    {
        id: 13,
        title: "Unassigned",
        start: new Date(2025, 8, 30, 16, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 8, 30, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "unassigned", details: "4:00 - 5:00 PM" },
    },
    {
        id: 14,
        title: "Scheduled",
        start: new Date(2025, 9, 4, 16, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 4, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "4:00 - 5:00 PM" },
    },
    {
        id: 15,
        title: "Scheduled",
        start: new Date(2025, 9, 6, 13, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 6, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "1:00 - 5:00 PM" },
    },
    {
        id: 16,
        title: "Scheduled",
        start: new Date(2025, 9, 13, 9, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 13, 10, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "9:00 - 10:00 AM" },
    },
    {
        id: 17,
        title: "Scheduled",
        start: new Date(2025, 9, 13, 11, 0), // Aug 29, 2025, 4:00 PM
        end: new Date(2025, 9, 13, 12, 30), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "11:00 - 12:30 PM" },
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
        start: new Date(2025, 9, 14, 15, 30), // Aug 29, 2025, 3:30 PM
        end: new Date(2025, 9, 14, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "cancelled", details: "3:30 - 5:00 PM" },
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
        end: new Date(2025, 9, 15, 17, 0), // Aug 29, 2025, 5:00 PM
        resource: { status: "scheduled", details: "3:00 - 5:00 PM" },
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

export default function ReactBigCalendar() {
    const [currentView, setCurrentView] = useState<View>(Views.WEEK);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Day/week/month tabs
    const [activeTab, setActiveTab] = useState("month");
    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
    }, []);

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

        // Business hours: Mon-Fri 9 AM to 5 PM, Saturday 10:30 AM to 4 PM
        let isBusinessHours = false;

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Monday to Friday: 9 AM to 5 PM
            isBusinessHours = hour >= 9 && hour < 17;
        } else if (dayOfWeek === 6) {
            // Saturday: 10:30 AM to 4 PM
            const timeInMinutes = hour * 60 + minute;
            const startTime = 10 * 60 + 30; // 10:30 AM
            const endTime = 16 * 60; // 4:00 PM
            isBusinessHours = timeInMinutes >= startTime && timeInMinutes < endTime;
        }

        // Weekdays and Saturday: business hours are white, otherwise light gray
        return {
            style: {
                backgroundColor: isBusinessHours ? "#ffffff" : "#f3f4f6",
                minHeight: "60px",
                borderBottom: "1px solid #e5e7eb",
            },
        };
    }, []);

    // Custom day style getter for Month view
    const dayPropGetter = useCallback(
        (date: Date) => {
            const dayOfWeek = date.getDay(); // 0 = Sunday
            const isOffRangeMonth = date.getMonth() !== currentDate.getMonth();

            // In Month view: off-range days should be light grey regardless of weekday
            if (currentView === Views.MONTH && isOffRangeMonth) {
                return {
                    style: {
                        backgroundColor: "#f3f4f6",
                    },
                };
            }

            // In-range Sundays use light gray
            if (dayOfWeek === 0) {
                return {
                    style: {
                        backgroundColor: "#f3f4f6",
                    },
                };
            }
            return {};
        },
        [currentDate, currentView]
    );

    // Navigation handlers
    const handleNavigate = useCallback((newDate: Date) => {
        setCurrentDate(newDate);
    }, []);

    const handleViewChange = useCallback((view: View) => {
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

    // ("------------------------------------------------------------------------------------------Styles-----------------------------------------------------------------------------------------------------");
    // Custom CSS styles for light themed colors
    const customStyles = `
    .rbc-calendar {
      background-color: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      height: 100%;
      border: none;
    }
    
    .rbc-header {
      background-color: #ffffff;
      border-bottom: none; /* remove bottom border */
      border-right: none; /* remove right border */
      color: #000000;
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

    /* Force specific borders in week view - light grey borders */
    .rbc-time-view *,
    .rbc-time-view .rbc-time-header *,
    .rbc-time-view .rbc-time-header-gutter *,
    .rbc-time-view .rbc-time-gutter *,
    .rbc-time-view .rbc-header * {
      border-color: #e5e7eb !important; /* default light grey for most borders */
    }

    /* Top border below day headers - light grey */
    .rbc-time-view .rbc-time-header {
      border-bottom: 1px solid #d1d5db !important;
    }

    .rbc-time-view .rbc-time-header .rbc-row {
      border-bottom: 1px solid #d1d5db !important;
    }

    /* Left border (right of time column) - light grey */
    .rbc-time-view .rbc-time-header-gutter {
      border-right: 1px solid #d1d5db !important;
      border-bottom: 1px solid #d1d5db !important;
    }

    .rbc-time-view .rbc-time-gutter {
      border-right: 1px solid #d1d5db !important;
    }

    /* Force day separator borders to light grey - multiple selectors */
    .rbc-time-view .rbc-header,
    .rbc-time-view .rbc-time-header .rbc-header,
    .rbc-time-view .rbc-time-header .rbc-row .rbc-header {
      border-bottom: 1px solid #d1d5db !important;
      border-right: 1px solid #d1d5db !important;
      border-color: #d1d5db !important;
    }

    /* Override any remaining borders between headers */
    .rbc-time-view .rbc-header + .rbc-header {
      border-left: 1px solid #d1d5db !important;
    }

    /* Force all header borders to light grey */
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(1),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(2),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(3),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(4),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(5),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(6),
    .rbc-time-view .rbc-time-header .rbc-header:nth-child(7) {
      border-right: 1px solid #d1d5db !important;
      border-bottom: 1px solid #d1d5db !important;
    }

    .rbc-time-view {
      background-color: #ffffff;
      border: none;
    }

    .rbc-time-gutter {
      background-color: #ffffff;
      border-right: none; /* remove right border */
      width: 60px;
    }

    .rbc-time-gutter .rbc-timeslot-group {
      border-bottom: 1px solid #e5e7eb;
      min-height: 60px;
      background-color: #ffffff !important;
    }
    
    .rbc-time-slot {
      border-top: none;
      min-height: 60px;
      

    }
    
    .rbc-day-slot {
      border-left: 1px solid #e5e7eb;

      min-height: 60px;

    }

    .rbc-day-slot:first-child {
      border-left: none;
    }

    .rbc-timeslot-group {
      border-bottom: 1px solid #e5e7eb;
      min-height: 60px;
    }

    .rbc-today {
      background-color: #fef3c7;
    }

    .rbc-time-header-gutter {
      background-color: #ffffff;
      border-bottom: none; /* remove bottom border */
      border-right: none; /* remove right border */
      width: 60px;
    }

    .rbc-time-content  > .rbc-day-slot:first-child .rbc-time-slot{
      border-top: none;
      background-color: #f3f4f6 !important;
    }

    /* Week view: make Sunday header match others (white) */
    .rbc-time-view .rbc-time-header .rbc-row .rbc-header:nth-child(1) {
      background-color: #ffffff !important;
    }

    .rbc-day-slot.sunday .rbc-time-slot {
        background-color: #f3f4f6 !important;
    }

    .rbc-time-gutter .rbc-time-slot {
      color: #000000;
      font-size: 11px;
      text-align: right;
      padding-right: 8px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: flex-start;
      padding-top: 4px;
      background-color: #ffffff !important;
    }

    /* Ensure time labels in the gutter stay on white */
    .rbc-time-gutter .rbc-label {
      background-color: #ffffff !important;
      color: #000000;
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
      background-color: #e4e4e4ff !important;
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
      background-color: #e5e7eb;
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
      background: #f9fafb;
    }

    .rbc-time-content::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }

    .rbc-time-content::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
    
    
    .rbc-time-view .rbc-time-gutter,
    .rbc-time-view .rbc-time-content > * {
      border-left: none;
    }

    .rbc-time-header {
      border-bottom: none; /* remove bottom border */
    }

    /* Month view: light borders on weekday headers */
    .rbc-month-view .rbc-header {
      background-color: #ffffff;
      border-bottom: 1px solid #d1d5db !important;
      border-right: 1px solid #d1d5db !important;
    }
    .rbc-month-view .rbc-header + .rbc-header {
      border-left: 1px solid #d1d5db !important;
    }

    /* Month view: force off-range day backgrounds to light grey */
    .rbc-month-view .rbc-off-range-bg,
    .rbc-off-range-bg {
      background-color: #f3f4f6 !important;
    }
    
    
    
  `;

    // ("--------------------------------------------------------------------------------------------------HTML Struct------------------------------------------------------------------------------------------------");
    return (
        <div className="h-screen">
            <style>{customStyles}</style>

            {/* Top Navigation Bar  */}
            <div className="border-b border-gray-600 px-4 py-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span>{moment(currentDate).format("MMM DD, YYYY")}</span>
                        </div>

                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <div className="relative flex items-center">
                                <TabsList className="space-x-1">
                                    <TabsTrigger value="day">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentView(Views.DAY)}
                                        >
                                            Day
                                        </Button>
                                    </TabsTrigger>
                                    <TabsTrigger value="week">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentView(Views.WEEK)}
                                        >
                                            Week
                                        </Button>
                                    </TabsTrigger>
                                    <TabsTrigger value="month">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentView(Views.MONTH)}
                                        >
                                            Month
                                        </Button>
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </Tabs>

                        <div className="flex items-center space-x-1">
                            <Button variant="outline">Filters</Button>
                            <Button variant="outline">Print</Button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1">
                        <Button
                            variant="default"
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
                            className="flex items-center space-x-1"
                        >
                            <span>←</span>
                            <span>Previous</span>
                        </Button>

                        <Button
                            variant="default"
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
                            className="flex items-center space-x-1"
                        >
                            <span>Next</span>
                            <span>→</span>
                        </Button>

                        <Button
                            variant="outline"
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
            <div className="flex-1" style={{ height: "calc(100vh - 80px)" }}>
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
                    components={{
                        event: EventComponent,
                    }}
                    min={new Date(1970, 1, 1, 9, 0, 0)} // 9 AM
                    max={new Date(1970, 1, 1, 22, 0, 0)} // 8 PM
                    step={60} // 1 hour steps
                    timeslots={1}
                    showMultiDayTimes={false}
                    toolbar={false}
                    popup={true}
                    views={[Views.DAY, Views.WEEK, Views.MONTH]}
                    defaultView={Views.WEEK}
                    scrollToTime={new Date(1970, 1, 1, 8, 0, 0)} // Auto scroll to 8 AM
                    onSelectEvent={(event: Event) => {
                        console.log("Event clicked:", event);
                    }}
                    onSelectSlot={(slotInfo: unknown) => {
                        console.log("Slot selected:", slotInfo);
                        // Handle slot selection for creating new availability
                    }}
                    selectable
                />
            </div>
        </div>
    );
}
