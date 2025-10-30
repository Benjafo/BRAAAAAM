/**
 * Schedule component - View all rides calendar
 * This component is used by admins and dispatchers to view and manage all rides
 */

import ky from "ky";
import { useEffect, useState } from "react";
import type { SlotInfo } from "react-big-calendar";
import type { BusinessHoursConfig, CalendarEvent } from "../../types/rides";
import type { RideFormValues } from "../form/rideForm";
import RideModal from "../modals/rideModal";
import BaseCalendar from "./BaseCalendar";

type Ride = {
    id: string;
    date: string;
    time: string;
    status: "Unassigned" | "Scheduled" | "Cancelled" | "Completed" | "Withdrawn";
    clientId: string;
    clientFirstName: string | null;
    clientLastName: string | null;
    driverId: string | null;
    dispatcherId: string;
    dispatcherFirstName: string | null;
    dispatcherLastName: string | null;
    tripPurpose: string | null;
    tripCount: number;
    pickupLocationId: string;
    pickupAddressLine1: string | null;
    pickupAddressLine2: string | null;
    pickupCity: string | null;
    pickupState: string | null;
    pickupZip: string | null;
    destinationLocationId: string;
    destinationAddressLine1: string | null;
    destinationAddressLine2: string | null;
    destinationCity: string | null;
    destinationState: string | null;
    destinationZip: string | null;
};

const ORG_ID = "braaaaam";
const API_RIDES_ENDPOINT = `/o/${ORG_ID}/appointments`;

// Transform API ride data to CalendarEvent format
// Edited by AI
const transformRidesToCalendarEvents = (rides: Ride[]): CalendarEvent[] => {
    return rides.map((ride) => {
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
        // Default to 60 minutes duration (can be adjusted based on tripCount or other logic)
        const durationMs = 60 * 60 * 1000; // 60 minutes
        const endDate = new Date(startDate.getTime() + durationMs);

        // Build client name from firstName and lastName
        const clientName = `${ride.clientFirstName || ""} ${ride.clientLastName || ""}`.trim();

        // Build dispatcher name
        const dispatcherName =
            `${ride.dispatcherFirstName || ""} ${ride.dispatcherLastName || ""}`.trim();

        // Driver name (null if no driver assigned)
        const driverName = ride.driverId ? dispatcherName : undefined;

        // Build destination address
        const destinationAddress = ride.destinationAddressLine1 || "Unknown destination";

        // Convert status to lowercase to match CalendarEvent type
        const status = ride.status.toLowerCase() as
            | "unassigned"
            | "scheduled"
            | "cancelled"
            | "completed"
            | "withdrawn";

        return {
            id: ride.id,
            title: clientName,
            start: startDate,
            end: endDate,
            type: "ride",
            resource: {
                status: status,
                clientName: clientName,
                driverName: driverName,
                purpose: ride.tripPurpose || "Transportation",
                details: `Ride to ${destinationAddress}`,
                driver: driverName,
                location: destinationAddress,
                dispatcherName: dispatcherName,
                originalRide: ride, // Store original ride data for form mapping
            },
        };
    });
};

// Map ride data to form values format (similar to RidesTable.tsx)
const mapRideToFormValues = (ride: Ride): Partial<RideFormValues> & { id?: string } => {
    return {
        id: ride.id,
        clientId: ride.clientId,
        clientName: ride.clientId, // the clientName is actually an ID for the select component
        clientStreetAddress: ride.pickupAddressLine1 || "",
        tripDate: new Date(ride.date),
        appointmentTime: ride.time,
        tripType: ride.tripCount === 2 ? "roundTrip" : "oneWay", // Convert tripCount to tripType
        destinationAddress: ride.destinationAddressLine1 || "",
        destinationAddress2: ride.destinationAddressLine2 || "",
        purposeOfTrip: ride.tripPurpose || "",
        assignedDriver: ride.driverId || undefined,
        rideStatus: ride.status,
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

export default function Schedule() {
    const [rides, setRides] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [selectedRideData, setSelectedRideData] = useState<
        Partial<RideFormValues> & { id?: string }
    >({});

    // Fetch rides from API
    useEffect(() => {
        const fetchRides = async () => {
            try {
                setLoading(true);

                const data = await ky
                    .get(`${API_RIDES_ENDPOINT}?pageSize=1000`, {
                        headers: {
                            "x-org-subdomain": ORG_ID,
                        },
                    })
                    .json<Ride[]>();

                setRides(transformRidesToCalendarEvents(data));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching rides:", err);
                setLoading(false);
            }
        };

        fetchRides();
    }, []);

    // Handle ride selection
    const handleRideSelect = (event: CalendarEvent) => {
        console.log("Selected ride:", event);
        const originalRide = event.resource?.originalRide as Ride;
        if (originalRide) {
            setSelectedRideData(mapRideToFormValues(originalRide));
            setIsRideModalOpen(true);
        }
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);
        const startTime = slotInfo.start.toLocaleTimeString();
        const endTime = slotInfo.end.toLocaleTimeString();
        alert(`Create new ride for:\nStart: ${startTime}\nEnd: ${endTime}`);
    };

    // Handle create ride button
    const handleCreateRide = () => {
        console.log("Create Ride button clicked");
        setSelectedRideData({});
        setIsRideModalOpen(true);
    };

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
            <RideModal
                open={isRideModalOpen}
                onOpenChange={setIsRideModalOpen}
                defaultValues={selectedRideData}
            />
        </div>
    );
}
