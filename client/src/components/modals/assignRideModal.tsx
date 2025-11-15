"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { http } from "@/services/auth/serviceResolver";
import * as React from "react";
import { toast } from "sonner";
import { DataTable } from "../dataTable";
import { ChevronDown, MoreVertical } from "lucide-react";
import DriverMatchDetailsModal from "./DriverMatchDetailsModal";

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
    matchScore: number;
    weeklyRideCount: number;
    maxRidesPerWeek: number | null;
    matchReasons: string[];
    scoreBreakdown: {
        total: number;
        baseScore: {
            loadBalancing: number;
            vehicleMatch: number;
            mobilityEquipment: number;
            specialAccommodations: number;
        };
        penalties: {
            unavailable: number;
            concurrentRide: number;
            overMaxRides: number;
        };
        warnings: {
            hasUnavailability: boolean;
            hasConcurrentRide: boolean;
            isOverMaxRides: boolean;
            hasVehicleMismatch: boolean;
        };
    };
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
    const [selectedDriverForDetails, setSelectedDriverForDetails] = React.useState<Driver | null>(null);
    const [matchDetailsOpen, setMatchDetailsOpen] = React.useState(false);

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

    const handleNotifyDrivers = async (priority: "normal" | "immediate") => {
        if (selectedDrivers.length === 0) return;

        setIsAssigning(true);

        try {
            const driverIds = selectedDrivers.map((driver) => driver.id);

            const response = await http
                .post(`o/appointments/${appointmentId}/notify-drivers`, {
                    json: {
                        driverIds,
                        priority,
                    },
                })
                .json<{ message: string; queuedCount?: number; successCount?: number }>();

            const successMessage =
                priority === "immediate"
                    ? response.message
                    : `${response.message} Emails will be sent at end of business day.`;

            toast.success(successMessage);
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="mr-2"
                                disabled={selectedDrivers.length === 0 || isAssigning}
                            >
                                {isAssigning ? "Processing..." : "Notify Drivers"}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleNotifyDrivers("normal")}>
                                Queue for End of Day
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotifyDrivers("immediate")}>
                                Send Immediately
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                        {
                            header: "Score",
                            accessorKey: "matchScore",
                            enableSorting: false,
                            cell: ({ row }) => (
                                <span className={`font-semibold ${
                                    row.original.matchScore >= 70 ? "text-green-600" :
                                    row.original.matchScore >= 40 ? "text-yellow-600" :
                                    row.original.matchScore >= 0 ? "text-orange-600" :
                                    "text-red-600"
                                }`}>
                                    {row.original.matchScore}
                                </span>
                            ),
                        },
                    ]}
                    rowActions={(driver) => (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedDriverForDetails(driver);
                                        setMatchDetailsOpen(true);
                                    }}
                                >
                                    View Match Details
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    showFilters={false}
                    usePagination={false}
                />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
            <DriverMatchDetailsModal
                open={matchDetailsOpen}
                onOpenChange={setMatchDetailsOpen}
                driver={selectedDriverForDetails}
            />
        </Dialog>
    );
}
