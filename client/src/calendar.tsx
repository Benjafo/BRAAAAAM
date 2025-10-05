import React, { useState, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, Views, type Event } from "react-big-calendar";
import moment from "moment";
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
        className={`px-4 py-2 rounded-none text-sm font-medium border-r border-gray-600 last:border-r-0 ${
            active
                ? "bg-gray-600 text-white shadow"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
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
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        const isBusinessHours = hour >= 8 && hour < 20; // 8 AM to 8 PM - have to confirm time with PM
        const isBusinessDay = dayOfWeek !== 0; // Not Sunday (0 = Sunday) nat sandey

        // Company is open only during business hours AND not on Sunday
        let backgroundColor = "#4a4a4a";

        if (isBusinessDay && isBusinessHours) {
            backgroundColor = "#000000";
        }
        // const isOpen = isBusinessHours && isBusinessDay;

        if (dayOfWeek === 0) {
            return {
                style: {
                    backgroundColor: "#4a4a4a", // gray
                    minHeight: "60px",
                    borderBottom: "1px solid #444444",
                },
            };
        }

        // Weekdays: business hours are black, otherwise gray
        return {
            style: {
                backgroundColor: isBusinessHours ? "#000000" : "#4a4a4a",
                minHeight: "60px",
                borderBottom: "1px solid #444444",
            },
        };
    }, []);

    // Custom day style getter for Month view
    const dayPropGetter = useCallback((date: Date) => {
        const dayOfWeek = date.getDay(); // 0 = Sunday

        if (dayOfWeek === 0) {
            return {
                style: {
                    backgroundColor: "#4a4a4a", // gray out Sundays
                },
            };
        }
        return {};
    }, []);

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
      background-color: #2a2a2a;
      border-bottom: 1px solid #444444;
      border-right: 1px solid #444444;
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
    
    .rbc-time-view {
      background-color: #000000;
      border: none;
    }
    
    .rbc-time-gutter {
      background-color: #000000;
      border-right: 1px solid #444444;
      width: 60px;
    }
    
    .rbc-time-gutter .rbc-timeslot-group {
      border-bottom: 1px solid #444444;
      min-height: 60px;
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
      background-color: #2a2a2a;
      border-bottom: 1px solid #444444;
      border-right: 1px solid #444444;
      width: 60px;
    }
    
    .rbc-time-content  > .rbc-day-slot:first-child .rbc-time-slot{
      border-top: none;
      background-color: #2a2a2a !important;
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
      background-color: #000000;
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
      border-bottom: 1px solid #444444;
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
                            <span>📅</span>
                            <span>{moment(currentDate).format("MMM DD, YYYY")}</span>
                        </div>

                        <div className="flex bg-gray-700 rounded overflow-hidden">
                            <button className="px-3 py-1 text-xs bg-gray-600 text-white">
                                List View
                            </button>
                            <button className="px-3 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-600">
                                Calendar View
                            </button>
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
