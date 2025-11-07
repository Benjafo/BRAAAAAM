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
        customFields: ride.customFields || {},
        // Note: additionalRider fields not yet in database schema
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
        s.hasPermission(PERMISSIONS.APPOINTMENTS_CREATE)
    );
    const hasEditPermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.APPOINTMENTS_UPDATE));

    // hacky fix to force refresh for the custom fields
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchRides = async (params: Record<string, unknown>) => {
        console.log("Params: ", params);

        // const searchParams = new URLSearchParams();
        // Object.entries(params).forEach(([key, value]) => {
        //     if (value !== undefined && value !== null) {
        //         searchParams.set(key, String(value));
        //     }
        // });

        const orgID = "braaaaam";
        const response = (await http
            .get(`o/${orgID}/appointments`, {
                headers: {
                    "x-org-subdomain": orgID,
                },
            })
            .json()) as { results: Ride[]; total: number };
        console.log("Fetched rides:", response);

        // TODO this should be server side
        if (isUnassignedRidesOnly) {
            const unassignedRides = response.results.filter((ride) => ride.status === "Unassigned");
            return {
                data: unassignedRides,
                total: unassignedRides.length,
            };
        }

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
                    { header: "Date", accessorKey: "date" },
                    { header: "Time", accessorKey: "time" },
                    {
                        header: "Client",
                        accessorFn: (row) => `${row.clientFirstName} ${row.clientLastName}`,
                    },
                    { header: "Destination", accessorFn: (row) => row.destinationAddressLine1 },
                    {
                        header: "Driver",
                        accessorFn: (row) =>
                            row.driverFirstName && row.driverLastName
                                ? `${row.driverFirstName} ${row.driverLastName}`
                                : "Unassigned",
                    },
                    {
                        header: "Dispatcher",
                        accessorFn: (row) => `${row.dispatcherFirstName} ${row.dispatcherLastName}`,
                    },
                    { header: "Status", accessorKey: "status" },
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
