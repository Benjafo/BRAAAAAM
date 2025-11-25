import { DataTable } from "@/components/common/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { parseLocalDate } from "@/lib/utils";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { RideFormValues } from "../form/rideForm";
import AcceptRideModal from "../modals/acceptRideModal";
import RideModal from "../modals/rideModal";

type Ride = {
    id: string;
    date: string;
    time: string;
    status: "Unassigned" | "Scheduled" | "Cancelled" | "Completed" | "Withdrawn";
    clientId: string;
    clientFirstName: string | null;
    clientLastName: string | null;
    driverId: string | null;
    driverFirstName: string | null;
    driverLastName: string | null;
    dispatcherId: string;
    dispatcherFirstName: string | null;
    dispatcherLastName: string | null;
    tripPurpose: string | null;
    tripType: "roundTrip" | "oneWayFrom" | "oneWayTo";
    // Completion fields
    estimatedDurationMinutes: number | null;
    milesDriven: number | null;
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
    createdAt: string;
};

const mapRideToFormValues = (
    ride: Ride
): Partial<RideFormValues> & {
    id?: string;
    clientFirstName?: string;
    clientLastName?: string;
    pickupAddressLine1?: string;
    pickupAddressLine2?: string;
    pickupCity?: string;
    pickupState?: string;
    pickupZip?: string;
} => {
    return {
        id: ride.id,
        clientId: ride.clientId,
        clientName: ride.clientId, // the clientName is actually an ID for the select component
        clientFirstName: ride.clientFirstName || undefined,
        clientLastName: ride.clientLastName || undefined,
        clientStreetAddress: ride.pickupAddressLine1 || "",
        clientStreetAddress2: ride.pickupAddressLine2 || "",
        clientCity: ride.pickupCity || "",
        clientState: ride.pickupState || "",
        pickupAddressLine1: ride.pickupAddressLine1 || undefined,
        pickupAddressLine2: ride.pickupAddressLine2 || undefined,
        pickupCity: ride.pickupCity || undefined,
        pickupState: ride.pickupState || undefined,
        pickupZip: ride.pickupZip || undefined,
        clientZip: ride.pickupZip || "",
        tripDate: parseLocalDate(ride.date) || new Date(),
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
        dispatcherName: `${ride.dispatcherFirstName || ""} ${ride.dispatcherLastName || ""}`.trim(),
        estimatedDuration: ride.estimatedDurationMinutes
            ? Number(ride.estimatedDurationMinutes) / 60
            : undefined,
        // Completion fields
        tripDistance: ride.milesDriven ? Number(ride.milesDriven) : undefined,
        tripDuration: ride.actualDurationMinutes
            ? Number(ride.actualDurationMinutes) / 60
            : undefined,
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

export function RidesTable({
    isUnassignedRidesOnly,
    hideActionButton,
    viewToggle,
}: {
    isUnassignedRidesOnly?: boolean;
    hideActionButton?: boolean;
    viewToggle?: {
        activeView: string;
        onChange: (view: string) => void;
    };
}) {
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [selectedRideData, setSelectedRideData] = useState<
        Partial<RideFormValues> & { id?: string }
    >({});
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAcceptRideModalOpen, setIsAcceptRideModalOpen] = useState(false);
    const [acceptRideData, setAcceptRideData] = useState<any>(null);

    // const user = useAuthStore((s) => s.user);
    const hasCreatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_APPOINTMENTS_CREATE)
    );
    const hasOwnPermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.OWN_APPOINTMENTS_UPDATE)
    );
    const hasAllPermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_APPOINTMENTS_UPDATE)
    );
    const hasEditPermission = hasOwnPermission || hasAllPermission;

    // hacky fix to force refresh for the custom fields
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchRides = async (params: Record<string, unknown>) => {
        console.log("Params: ", params);

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        // Add status filter for unassigned rides
        if (isUnassignedRidesOnly) {
            searchParams.set("status", "Unassigned");
        }

        const response = await http
            .get(`o/appointments?${searchParams}`)
            .json<{ results: Ride[]; total: number }>();

        console.log("Fetched rides:", response);

        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateRide = () => {
        setSelectedRideData({});
        setIsRideModalOpen(true);
    };

    const handleEditRide = (ride: Ride) => {
        console.log("Ride selected:", ride);

        const handlesOwnRides = hasOwnPermission && !hasAllPermission;

        // If driver clicking unassigned ride, show accept modal
        if (handlesOwnRides && ride.driverId === null) {
            setAcceptRideData({
                id: ride.id,
                clientName: `${ride.clientFirstName || ""} ${ride.clientLastName || ""}`.trim(),
                date: ride.date,
                time: ride.time,
                pickupAddress: ride.pickupAddressLine1 || "Unknown",
                pickupAddress2: ride.pickupAddressLine2 || undefined,
                pickupCity: ride.pickupCity || undefined,
                pickupState: ride.pickupState || undefined,
                pickupZip: ride.pickupZip || undefined,
                destinationAddress: ride.destinationAddressLine1 || "Unknown",
                destinationAddress2: ride.destinationAddressLine2 || undefined,
                destinationCity: ride.destinationCity || undefined,
                destinationState: ride.destinationState || undefined,
                destinationZip: ride.destinationZip || undefined,
                tripPurpose: ride.tripPurpose || undefined,
            });
            setIsAcceptRideModalOpen(true);
        } else {
            // Otherwise show regular edit modal
            const mappedData = mapRideToFormValues(ride);
            console.log("Mapped form values:", mappedData);
            setSelectedRideData(mappedData);
            setIsRideModalOpen(true);
        }
    };

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchRides}
                columns={[
                    { header: "Appointment Date", accessorKey: "date", id: "date" },
                    { header: "Appointment Time", accessorKey: "time", id: "time" },
                    {
                        header: "Client",
                        accessorFn: (row) => `${row.clientFirstName} ${row.clientLastName}`,
                        id: "client",
                    },
                    {
                        header: "Destination",
                        accessorFn: (row) => row.destinationAddressLine1,
                        id: "destination",
                    },
                    {
                        header: "Driver",
                        accessorFn: (row) =>
                            row.driverFirstName && row.driverLastName
                                ? `${row.driverFirstName} ${row.driverLastName}`
                                : "Unassigned",
                        id: "driver",
                    },
                    {
                        header: "Dispatcher",
                        accessorFn: (row) => `${row.dispatcherFirstName} ${row.dispatcherLastName}`,
                        id: "dispatcher",
                    },
                    { header: "Status", accessorKey: "status", id: "status" },
                    {
                        header: "Created At",
                        accessorFn: (row) =>
                            row.createdAt
                                ? new Date(row.createdAt).toISOString().split("T")[0]
                                : "",
                        id: "createdAt",
                    },
                ]}
                onRowClick={hasEditPermission ? handleEditRide : undefined}
                actionButton={
                    !hideActionButton && hasCreatePermission
                        ? {
                              label: "Create Ride",
                              onClick: handleCreateRide,
                          }
                        : undefined
                }
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
        </>
    );
}
