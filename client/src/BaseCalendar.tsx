import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import moment from "moment";
import { useCallback, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Views, type SlotInfo, type View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "./components/ui/button";
import type { BaseCalendarProps, CalendarEvent, TimeBlock } from "./types/calendar";

const localizer = momentLocalizer(moment);

export default function BaseCalendar({
    events = [],
    businessHours,
    onEventSelect,
    onSlotSelect,
    actionButton,
    eventStyleGetter: customEventStyleGetter,
}: BaseCalendarProps) {
    const [currentView, setCurrentView] = useState<View>(Views.WEEK);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Day/week/month tabs
    const [activeTab, setActiveTab] = useState("month");
    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
    }, []);

    // Calculate min and max times from business hours
    // (ai generated)
    const { minTime, maxTime } = useMemo(() => {
        if (!businessHours) {
            // Default to 9 AM - 6 PM if no business hours configured
            return {
                minTime: new Date(1970, 1, 1, 9, 0, 0),
                maxTime: new Date(1970, 1, 1, 18, 0, 0),
            };
        }

        let earliestStart = 24 * 60; // Start with max minutes (midnight next day)
        let latestEnd = 0; // Start with min minutes (midnight)

        const dayNames: (keyof Omit<typeof businessHours, "timezone">)[] = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ];

        // Find the earliest start and latest end across all days
        dayNames.forEach((day) => {
            const dayConfig = businessHours[day];
            if (dayConfig && dayConfig.length > 0) {
                dayConfig.forEach((block) => {
                    const [startHour, startMin] = block.start.split(":").map(Number);
                    const [endHour, endMin] = block.end.split(":").map(Number);

                    const startMinutes = startHour * 60 + startMin;
                    const endMinutes = endHour * 60 + endMin;

                    earliestStart = Math.min(earliestStart, startMinutes);
                    latestEnd = Math.max(latestEnd, endMinutes);
                });
            }
        });

        // If no business hours found, use defaults
        if (earliestStart === 24 * 60 || latestEnd === 0) {
            return {
                minTime: new Date(1970, 1, 1, 9, 0, 0),
                maxTime: new Date(1970, 1, 1, 18, 0, 0),
            };
        }

        // Add some padding (30 minutes before earliest, 30 minutes after latest)
        const paddedStart = Math.max(0, earliestStart - 30);
        const paddedEnd = Math.min(24 * 60, latestEnd + 30);

        return {
            minTime: new Date(1970, 1, 1, Math.floor(paddedStart / 60), paddedStart % 60, 0),
            maxTime: new Date(1970, 1, 1, Math.floor(paddedEnd / 60), paddedEnd % 60, 0),
        };
    }, [businessHours]);

    // Check if a time falls within business hours
    // (ai generated)
    const isWithinBusinessHours = useCallback(
        (date: Date) => {
            if (!businessHours) return false; // No hours are valid if config is missing

            const dayOfWeek = date.getDay();
            const dayNames: (keyof typeof businessHours)[] = [
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
            ];
            const dayConfig = businessHours[dayNames[dayOfWeek]];

            if (!dayConfig || dayConfig.length === 0) return false; // Closed day or no blocks

            const hour = date.getHours();
            const minute = date.getMinutes();
            const timeInMinutes = hour * 60 + minute;

            // Check if time falls within any of the blocks for this day
            return dayConfig.some((block: TimeBlock) => {
                const [startHour, startMin] = block.start.split(":").map(Number);
                const [endHour, endMin] = block.end.split(":").map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
            });
        },
        [businessHours]
    );

    // Custom event style getter - use provided one or default
    const eventStyleGetter = useCallback(
        (event: CalendarEvent) => {
            if (customEventStyleGetter) {
                return customEventStyleGetter(event);
            }

            // Default style based on status
            const status = event.resource?.status || "available";
            return {
                className: status,
            };
        },
        [customEventStyleGetter]
    );

    // Slot style getter - colors based on business hours
    const slotStyleGetter = useCallback(
        (date: Date) => {
            const isBusinessHours = isWithinBusinessHours(date);

            return {
                style: {
                    backgroundColor: isBusinessHours ? "#ffffff" : "#f3f4f6",
                    minHeight: "60px",
                    borderBottom: "1px solid #e5e7eb",
                },
            };
        },
        [isWithinBusinessHours]
    );

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

            // Check if any business hours exist for this day
            if (businessHours) {
                const dayNames: (keyof typeof businessHours)[] = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                ];
                const dayConfig = businessHours[dayNames[dayOfWeek]];

                // If no business hours for this day, use light gray
                if (!dayConfig || dayConfig.length === 0) {
                    return {
                        style: {
                            backgroundColor: "#f3f4f6",
                        },
                    };
                }
            } else if (dayOfWeek === 0) {
                // Default behavior if no business hours config: Sundays are light gray
                return {
                    style: {
                        backgroundColor: "#f3f4f6",
                    },
                };
            }

            return {};
        },
        [currentDate, currentView, businessHours]
    );

    // Navigation handlers
    const handleNavigate = useCallback((newDate: Date) => {
        setCurrentDate(newDate);
    }, []);

    const handleViewChange = useCallback((view: View) => {
        setCurrentView(view);
    }, []);

    // Event selection handler
    const handleEventSelect = useCallback(
        (event: CalendarEvent) => {
            if (onEventSelect) {
                onEventSelect(event);
            }
        },
        [onEventSelect]
    );

    // Slot selection handler
    const handleSlotSelect = useCallback(
        (slotInfo: SlotInfo) => {
            if (onSlotSelect) {
                onSlotSelect(slotInfo);
            }
        },
        [onSlotSelect]
    );

    // Custom event component that changes based on view
    const EventComponent = ({ event }: { event: CalendarEvent }) => {
        const isMonthView = currentView === Views.MONTH;
        const clientName = event.resource?.clientName || event.title;
        const driverName = event.resource?.driverName || event.resource?.driver;
        const purpose = event.resource?.purpose || event.resource?.details;

        if (isMonthView) {
            // Month view: single line with client and driver
            return (
                <div className="text-xs leading-tight truncate px-1">
                    <span className="font-medium">{clientName}</span>
                    {driverName && <span> • {driverName}</span>}
                </div>
            );
        }

        // Week/Day view: multi-line with all details
        return (
            <div className="text-xs leading-tight px-1 py-1">
                <div className="font-medium truncate">{clientName}</div>
                {driverName && <div className="text-xs">{driverName}</div>}
                {purpose && <div className="text-xs mt-1">{purpose}</div>}
            </div>
        );
    };

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

                        {actionButton && (
                            <Button variant="outline" onClick={actionButton.onClick}>
                                {actionButton.label}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* React Big Calendar  */}
            <div className="flex-1" style={{ height: "calc(100vh - 80px)" }}>
                <Calendar
                    localizer={localizer}
                    events={events}
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
                    min={minTime}
                    max={maxTime}
                    step={30}
                    timeslots={1}
                    showMultiDayTimes={false}
                    toolbar={false}
                    popup={true}
                    views={[Views.DAY, Views.WEEK, Views.MONTH]}
                    defaultView={Views.WEEK}
                    scrollToTime={minTime}
                    onSelectEvent={handleEventSelect}
                    onSelectSlot={handleSlotSelect}
                    selectable
                />
            </div>
        </div>
    );
}
