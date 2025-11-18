import { DataTable } from "@/components/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { RideFormValues } from "../form/rideForm";
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
    milesDriven: number | null;
    actualDurationMinutes: number | null;
    notes: string | null;
    donationType: "Check" | "Cash" | "unopenedEnvelope" | null;
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

const mapRideToFormValues = (ride: Ride): Partial<RideFormValues> & { id?: string } => {
    return {
        id: ride.id,
        clientId: ride.clientId,
        clientName: ride.clientId, // the clientName is actually an ID for the select component
        clientStreetAddress: ride.pickupAddressLine1 || "",
        clientCity: ride.pickupCity || "",
        clientState: ride.pickupState || "",
        clientZip: ride.pickupZip || "",
        dispatcherName: `${ride.dispatcherFirstName} ${ride.dispatcherLastName}`,
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
        // Completion fields
        tripDistance: ride.milesDriven ?? undefined,
        tripDuration: ride.actualDurationMinutes ? ride.actualDurationMinutes / 60 : undefined,
        donationType: ride.donationType ?? undefined,
        donationAmount: ride.donationAmount ?? undefined,
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
}: {
    isUnassignedRidesOnly?: boolean;
    hideActionButton?: boolean;
}) {
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [selectedRideData, setSelectedRideData] = useState<
        Partial<RideFormValues> & { id?: string }
    >({});
    const [refreshKey, setRefreshKey] = useState(0);
    const hasCreatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_APPOINTMENTS_CREATE)
    );
    const hasEditPermission = useAuthStore(
        (s) =>
            s.hasPermission(PERMISSIONS.OWN_APPOINTMENTS_UPDATE) ||
            s.hasPermission(PERMISSIONS.ALL_APPOINTMENTS_UPDATE)
    );

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
        const mappedData = mapRideToFormValues(ride);
        console.log("Mapped form values:", mappedData);
        setSelectedRideData(mappedData);
        setIsRideModalOpen(true);
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
            />
            <RideModal
                open={isRideModalOpen}
                onOpenChange={setIsRideModalOpen}
                defaultValues={selectedRideData}
                onSuccess={handleRefresh}
            />
        </>
    );
}
