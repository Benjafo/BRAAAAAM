/**
 * UnassignedRides component - View only unassigned rides in calendar
 * This component is used by dispatchers to view and assign unassigned rides
 */

import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useEffect, useState } from "react";
import type { SlotInfo } from "react-big-calendar";
import type { BusinessHoursConfig, CalendarEvent } from "../../types/rides";
import type { RideFormValues } from "../form/rideForm";
import AcceptRideModal from "../modals/acceptRideModal";
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
    tripType: "roundTrip" | "oneWayFrom" | "oneWayTo";
    // Completion fields
    milesDriven: number | null;
    estimatedDurationMinutes: number | null;
    actualDurationMinutes: number | null;
    notes: string | null;
    donationType: "Check" | "Cash" | "unopenedEnvelope" | "None" | null;
    donationAmount: number | null;
    // Additional rider fields
    hasAdditionalRider: boolean | null;
    additionalRiderFirstName: string | null;
    additionalRiderLastName: string | null;
    relationshipToClient: string | null;
    // Locations
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
    customFields?: Record<string, any>;
};

// Transform API ride data to CalendarEvent format
// AI helped here
const transformRidesToCalendarEvents = (rides: Ride[]): CalendarEvent[] => {
    return rides.map((ride) => {
        // Parse date and time
        const [year, month, day] = ride.date.split("-").map(Number);
        const [time, period] = ride.time.split(" ");
        const parts = time.split(":").map(Number);
        let hours: number = parts[0];
        const minutes: number = parts[1];

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
                driverName: undefined, // No driver for unassigned rides
                purpose: ride.tripPurpose || "Transportation",
                details: `Ride to ${destinationAddress}`,
                driver: undefined,
                location: destinationAddress,
                dispatcherName: dispatcherName,
                originalRide: ride, // Store original ride data for form mapping
            },
        };
    });
};

// Map ride data to form values format
const mapRideToFormValues = (ride: Ride): Partial<RideFormValues> & { id?: string } => {
    // Build dispatcher name from first and last name
    const dispatcherName = `${ride.dispatcherFirstName || ""} ${ride.dispatcherLastName || ""}`.trim();

    return {
        id: ride.id,
        clientId: ride.clientId,
        clientName: ride.clientId, // the clientName is actually an ID for the select component
        clientStreetAddress: ride.pickupAddressLine1 || "",
        clientStreetAddress2: ride.pickupAddressLine2 || "",
        clientCity: ride.pickupCity || "",
        clientState: ride.pickupState || "",
        clientZip: ride.pickupZip || "",
        tripDate: new Date(ride.date),
        appointmentTime: ride.time,
        tripType: ride.tripType,
        destinationAddress: ride.destinationAddressLine1 || "",
        destinationCity: ride.destinationCity || "",
        destinationState: ride.destinationState || "",
        destinationZip: ride.destinationZip || "",
        destinationAddress2: ride.destinationAddressLine2 || "",
        purposeOfTrip: ride.tripPurpose || "",
        assignedDriver: ride.driverId || undefined,
        rideStatus: ride.status,
        dispatcherName: dispatcherName,
        estimatedDuration: ride.estimatedDurationMinutes ? Number(ride.estimatedDurationMinutes) / 60 : undefined,
        // Completion fields
        tripDistance: ride.milesDriven ? Number(ride.milesDriven) : undefined,
        tripDuration: ride.actualDurationMinutes ? Number(ride.actualDurationMinutes) / 60 : undefined,
        donationType: ride.donationType && ride.donationType !== "None" ? ride.donationType : undefined,
        donationAmount: ride.donationAmount ? Number(ride.donationAmount) : undefined,
        // Additional rider fields
        additionalRider: ride.hasAdditionalRider ? "Yes" : "No",
        additionalRiderFirstName: ride.additionalRiderFirstName || "",
        additionalRiderLastName: ride.additionalRiderLastName || "",
        relationshipToClient: ride.relationshipToClient || "",
        customFields: ride.customFields || {},
    };
};

// Business hours configuration
const businessHours: BusinessHoursConfig = {
    monday: [{ start: "09:00", end: "17:00" }],
    tuesday: [{ start: "09:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "17:00" }],
    thursday: [{ start: "09:00", end: "17:00" }],
    friday: [{ start: "09:00", end: "17:00" }],
    saturday: [],
    sunday: [],
};

interface UnassignedRidesProps {
    viewToggle?: {
        activeView: string;
        onChange: (view: string) => void;
    };
}

export default function UnassignedRides({ viewToggle }: UnassignedRidesProps) {
    const [rides, setRides] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [isAcceptRideModalOpen, setIsAcceptRideModalOpen] = useState(false);
    const [selectedRideData, setSelectedRideData] = useState<
        Partial<RideFormValues> & { id?: string }
    >({});
    const [acceptRideData, setAcceptRideData] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const hasAllPermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_APPOINTMENTS_READ)
    );
    const hasOwnPermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.OWN_APPOINTMENTS_READ)
    );

    // Fetch unassigned rides from API
    useEffect(() => {
        const fetchUnassignedRides = async () => {
            try {
                setLoading(true);

                const data = await http
                    .get(`o/appointments?pageSize=1000`)
                    .json<{ results: Ride[] }>();

                // Filter for unassigned rides only
                // TODO: should be server-side
                const unassignedRides = data.results.filter(
                    (ride: Ride) => ride.status === "Unassigned"
                );
                const transformedRides = transformRidesToCalendarEvents(unassignedRides);
                setRides(transformedRides);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching unassigned rides:", err);
                setLoading(false);
            }
        };

        fetchUnassignedRides();
    }, [refreshKey]);

    // Handle ride selection - for assigning driver
    const handleRideSelect = (event: CalendarEvent) => {
        console.log("Selected unassigned ride:", event);
        const originalRide = event.resource?.originalRide as Ride;
        if (!originalRide) return;

        const handlesOwnRides = hasOwnPermission && !hasAllPermission;

        if (handlesOwnRides) {
            // Driver - show accept modal (all rides here are unassigned)
            setAcceptRideData({
                id: originalRide.id,
                clientName: `${originalRide.clientFirstName || ""} ${originalRide.clientLastName || ""}`.trim(),
                date: originalRide.date,
                time: originalRide.time,
                pickupAddress: originalRide.pickupAddressLine1 || "Unknown",
                pickupAddress2: originalRide.pickupAddressLine2 || undefined,
                pickupCity: originalRide.pickupCity || undefined,
                pickupState: originalRide.pickupState || undefined,
                pickupZip: originalRide.pickupZip || undefined,
                destinationAddress: originalRide.destinationAddressLine1 || "Unknown",
                destinationAddress2: originalRide.destinationAddressLine2 || undefined,
                destinationCity: originalRide.destinationCity || undefined,
                destinationState: originalRide.destinationState || undefined,
                destinationZip: originalRide.destinationZip || undefined,
                tripPurpose: originalRide.tripPurpose || undefined,
            });
            setIsAcceptRideModalOpen(true);
        } else {
            // Dispatcher/Admin - show editable modal
            setSelectedRideData(mapRideToFormValues(originalRide));
            setIsRideModalOpen(true);
        }
    };

    // Handle slot selection
    const handleSlotSelect = (slotInfo: SlotInfo) => {
        console.log("Selected time slot:", slotInfo);
        const startTime = slotInfo.start.toLocaleTimeString();
        const endTime = slotInfo.end.toLocaleTimeString();
        alert(`Create new unassigned ride for:\nStart: ${startTime}\nEnd: ${endTime}`);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading unassigned rides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <BaseCalendar
                events={rides}
                businessHours={businessHours}
                onEventSelect={handleRideSelect}
                onSlotSelect={handleSlotSelect}
                viewToggle={viewToggle}
            />
            <RideModal
                open={isRideModalOpen}
                onOpenChange={setIsRideModalOpen}
                defaultValues={selectedRideData}
                onSuccess={handleRefresh}
            />
            <AcceptRideModal
                open={isAcceptRideModalOpen}
                onOpenChange={setIsAcceptRideModalOpen}
                rideData={acceptRideData}
                onAccept={handleRefresh}
            />
        </div>
    );
}
