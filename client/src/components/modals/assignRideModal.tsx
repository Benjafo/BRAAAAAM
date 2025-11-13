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

            const response = await http
                .get(`o/appointments/${appointmentId}/matching-drivers`)
                .json<{ results: Driver[] }>();

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
            await http
                .put(`o/appointments/${appointmentId}`, {
                    json: {
                        driverId: driver.id,
                        status: "Scheduled",
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

    const handleNotifyDrivers = async () => {
        if (selectedDrivers.length === 0) return;

        setIsAssigning(true);

        try {
            const driverIds = selectedDrivers.map((driver) => driver.id);

            const response = await http
                .post(`o/appointments/${appointmentId}/notify-drivers`, {
                    json: {
                        driverIds,
                    },
                })
                .json<{ message: string; successCount: number; failureCount: number }>();

            if (response.failureCount > 0) {
                toast.warning(
                    `${response.successCount} driver(s) notified. ${response.failureCount} failed.`
                );
            } else {
                toast.success(response.message);
            }
        } catch (error) {
            console.error("Failed to notify drivers:", error);
            toast.error("Failed to send notifications. Please try again.");
        } finally {
            setIsAssigning(false);
        }
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
                        disabled={selectedDrivers.length === 0 || isAssigning}
                        onClick={handleNotifyDrivers}
                    >
                        Notify Drivers
                    </Button>
                    <Button
                        variant="default"
                        disabled={selectedDrivers.length !== 1 || isAssigning}
                        onClick={handleAssignDriver}
                    >
                        {isAssigning ? "Processing..." : "Assign Driver"}
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
