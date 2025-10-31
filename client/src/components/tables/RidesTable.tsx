import { DataTable } from "@/components/dataTable";
import ky from "ky";
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
        // Note: additionalRider fields not yet in database schema
    };
};

export function RidesTable({ isUnassignedRidesOnly }: { isUnassignedRidesOnly?: boolean }) {
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [selectedRideData, setSelectedRideData] = useState<
        Partial<RideFormValues> & { id?: string }
    >({});

    const fetchRides = async (_params: Record<string, any>) => {
        // const searchParams = new URLSearchParams();
        // Object.entries(params).forEach(([key, value]) => {
        //     if (value !== undefined && value !== null) {
        //         searchParams.set(key, String(value));
        //     }
        // });

        const orgID = "braaaaam";
        const response = (await ky
            .get(`/o/${orgID}/appointments`, {
                headers: {
                    "x-org-subdomain": orgID,
                },
            })
            .json()) as Ride[];
        console.log("Fetched rides:", response);

        // TODO this should be server side
        if (isUnassignedRidesOnly) {
            return {
                data: response.filter((ride) => ride.status === "Unassigned"),
                total: response.filter((ride) => ride.status === "Unassigned").length,
            };
        }

        return {
            data: response,
            total: response.length,
        };
    };

    const handleCreateRide = () => {
        setSelectedRideData({});
        setIsRideModalOpen(true);
    };

    const handleEditRide = (ride: Ride) => {
        console.log("Ride selected:", ride);
        console.log("Selected ride data:", selectedRideData);
        setSelectedRideData(mapRideToFormValues(ride));
        setIsRideModalOpen(true);
    };

    return (
        <>
            <DataTable
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
                        header: "Dispatcher",
                        accessorFn: (row) => `${row.dispatcherFirstName} ${row.dispatcherLastName}`,
                    },
                    { header: "Status", accessorKey: "status" },
                ]}
                onRowClick={handleEditRide}
                actionButton={{
                    label: "Create Ride",
                    onClick: handleCreateRide,
                }}
            />
            <RideModal
                open={isRideModalOpen}
                onOpenChange={setIsRideModalOpen}
                defaultValues={selectedRideData}
            />
        </>
    );
}
