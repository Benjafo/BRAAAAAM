"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { http } from "@/services/auth/serviceResolver";
import * as React from "react";
import { toast } from "sonner";
import { DataTable } from "../dataTable";

type Driver = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contactPreference: string | null;
    isActive: boolean;
    roleId: string | null;
    roleName: string | null;
    address: {
        id: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | null;
};

type AssignRideModalProps = {
    appointmentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDriverAssigned?: () => void;
};

export default function AssignRideModal({
    appointmentId,
    open,
    onOpenChange,
    onDriverAssigned,
}: AssignRideModalProps) {
    const [selectedDrivers, setSelectedDrivers] = React.useState<Driver[]>([]);
    const [isAssigning, setIsAssigning] = React.useState(false);

    const fetchDrivers = React.useCallback(async () => {
        try {
            const orgId = "braaaaam";
            const response = (await http
                .get(`o/${orgId}/appointments/${appointmentId}/matching-drivers`, {
                    headers: {
                        "x-org-subdomain": orgId,
                    },
                })
                .json()) as { results: Driver[] };

            console.log("Fetched matching drivers:", response.results);

            return {
                data: response.results,
                total: response.results.length,
            };
        } catch (error) {
            console.error("Failed to fetch matching drivers:", error);
            toast.error("Failed to load matching drivers");
            return {
                data: [],
                total: 0,
            };
        }
    }, [appointmentId]);

    const handleAssignDriver = async () => {
        if (selectedDrivers.length !== 1) return;

        const driver = selectedDrivers[0];
        setIsAssigning(true);

        try {
            const orgId = "braaaaam";
            await http
                .put(`o/${orgId}/appointments/${appointmentId}`, {
                    json: {
                        driverId: driver.id,
                        status: "Scheduled",
                    },
                    headers: {
                        "x-org-subdomain": orgId,
                    },
                })
                .json();

            toast.success(`Driver ${driver.firstName} ${driver.lastName} assigned successfully`);
            onOpenChange(false);
            onDriverAssigned?.();
        } catch (error) {
            console.error("Failed to assign driver:", error);
            toast.error("Failed to assign driver. Please try again.");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleNotifyDrivers = () => {
        // TODO: Implement notification functionality
        toast.info("Notification feature coming soon");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>Suggested Drivers for This Ride</DialogTitle>
                    <p className="text-center text-sm mt-4">
                        The system suggests these drivers for the selected ride.
                        <br />
                        "Perfect matches" have been highlighted in green; all subsequent drivers are
                        displayed in order of how well they match this ride's constraints.
                    </p>
                </DialogHeader>
                <div className="flex flex-row justify-end">
                    <Button
                        variant="outline"
                        className="mr-2"
                        disabled={selectedDrivers.length === 0}
                        onClick={handleNotifyDrivers}
                    >
                        Notify Drivers
                    </Button>
                    <Button
                        variant="default"
                        disabled={selectedDrivers.length !== 1 || isAssigning}
                        onClick={handleAssignDriver}
                    >
                        {isAssigning ? "Assigning..." : "Assign Driver"}
                    </Button>
                </div>
                <DataTable
                    fetchData={fetchDrivers}
                    onRowSelectionChange={setSelectedDrivers}
                    columns={[
                        {
                            header: "Name",
                            accessorKey: "firstName",
                            enableSorting: false,
                            cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
                        },
                        // { header: "Email", accessorKey: "email", enableSorting: false },
                        // { header: "Phone", accessorKey: "phone", enableSorting: false },
                        // {
                        //     header: "Location",
                        //     accessorKey: "address",
                        //     enableSorting: false,
                        //     cell: ({ row }) =>
                        //         row.original.address
                        //             ? `${row.original.address.city}, ${row.original.address.state}`
                        //             : "N/A",
                        // },
                    ]}
                    showFilters={false}
                    usePagination={false}
                />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
