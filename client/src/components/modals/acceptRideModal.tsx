"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/components/stores/authStore";
import { http } from "@/services/auth/serviceResolver";
import { AlertTriangle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RideData = {
    id: string;
    clientName: string;
    date: string;
    time: string;
    pickupAddress: string;
    pickupAddress2?: string;
    pickupCity?: string;
    pickupState?: string;
    pickupZip?: string;
    destinationAddress: string;
    destinationAddress2?: string;
    destinationCity?: string;
    destinationState?: string;
    destinationZip?: string;
    tripPurpose?: string;
};

type AcceptRideModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rideData?: RideData;
    onAccept?: () => void;
};

type MobilityEquipment = "cane" | "crutches" | "lightweight_walker" | "rollator" | "other";
type VehicleType = "sedan" | "small_suv" | "medium_suv" | "large_suv" | "small_truck" | "large_truck";

type DriverProfile = {
    id: string;
    canAccommodateMobilityEquipment?: MobilityEquipment[];
    canAccommodateOxygen?: boolean;
    canAccommodateServiceAnimal?: boolean;
    canAccommodateAdditionalRider?: boolean;
    vehicleTypes?: VehicleType[];
    scoreBreakdown?: {
        warnings: {
            hasUnavailability: boolean;
            hasConcurrentRide: boolean;
            isOverMaxRides: boolean;
            hasVehicleMismatch: boolean;
        };
    };
    weeklyRideCount?: number;
    maxRidesPerWeek?: number;
};

type ClientInfo = {
    mobilityEquipment?: MobilityEquipment[];
    hasOxygen?: boolean;
    hasServiceAnimal?: boolean;
    vehicleTypes?: VehicleType[];
};

type AppointmentInfo = {
    hasAdditionalRider?: boolean;
};

type MatchingResponse = {
    results: DriverProfile[];
    client: ClientInfo;
    appointment: AppointmentInfo;
    currentDriverProfile: {
        id: string;
        canAccommodateMobilityEquipment?: MobilityEquipment[];
        canAccommodateOxygen?: boolean;
        canAccommodateServiceAnimal?: boolean;
        canAccommodateAdditionalRider?: boolean;
        vehicleTypes?: VehicleType[];
        maxRidesPerWeek?: number;
        scoreBreakdown?: {
            warnings: {
                hasUnavailability: boolean;
                hasConcurrentRide: boolean;
                isOverMaxRides: boolean;
                hasVehicleMismatch: boolean;
            };
        };
        weeklyRideCount?: number;
    } | null;
};

type Warning = {
    message: string;
    type: "critical" | "standard";
};

const MOBILITY_EQUIPMENT_LABELS: Record<MobilityEquipment, string> = {
    cane: "Cane",
    crutches: "Crutches",
    lightweight_walker: "Lightweight Walker",
    rollator: "Rollator",
    other: "Other Mobility Equipment",
};

export default function AcceptRideModal({
    open,
    onOpenChange,
    rideData,
    onAccept,
}: AcceptRideModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingWarnings, setLoadingWarnings] = useState(false);
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [criticalConfirmed, setCriticalConfirmed] = useState(false);
    const currentUserId = useAuthStore((s) => s.user?.id);

    // Fetch warnings when modal opens
    useEffect(() => {
        if (!open || !rideData?.id || !currentUserId) {
            setWarnings([]);
            setCriticalConfirmed(false);
            return;
        }

        const fetchWarnings = async () => {
            setLoadingWarnings(true);
            try {
                const response = await http
                    .get(`o/appointments/${rideData.id}/matching-drivers`)
                    .json<MatchingResponse>();

                const currentDriver = response.results.find((d) => d.id === String(currentUserId));
                const detectedWarnings: Warning[] = [];
                const client = response.client;
                const appointment = response.appointment;
                const userProfile = response.currentDriverProfile;

                // If no current driver profile, they might not be a driver
                if (!userProfile) {
                    detectedWarnings.push({
                        type: "critical",
                        message: "Unable to verify your driver profile. Please ensure you are registered as a driver.",
                    });
                } else {
                    // Check critical warnings (hard requirements) if not in top results
                    if (!currentDriver) {
                        // Check each hard requirement
                        if (client.hasOxygen && !userProfile.canAccommodateOxygen) {
                            detectedWarnings.push({
                                type: "critical",
                                message: "Client requires oxygen accommodation - your profile is not marked as able to accommodate oxygen equipment",
                            });
                        }

                        if (client.hasServiceAnimal && !userProfile.canAccommodateServiceAnimal) {
                            detectedWarnings.push({
                                type: "critical",
                                message: "Client has a service animal - your profile is not marked as able to accommodate service animals",
                            });
                        }

                        if (appointment.hasAdditionalRider && !userProfile.canAccommodateAdditionalRider) {
                            detectedWarnings.push({
                                type: "critical",
                                message: "This ride includes an additional rider - your profile is not marked as able to accommodate additional riders",
                            });
                        }

                        // Check mobility equipment
                        const clientEquipment = client.mobilityEquipment || [];
                        const driverEquipment = userProfile.canAccommodateMobilityEquipment || [];
                        const missingEquipment = clientEquipment.filter(
                            (eq) => !driverEquipment.includes(eq)
                        );

                        if (missingEquipment.length > 0) {
                            const equipmentLabels = missingEquipment
                                .map((eq) => MOBILITY_EQUIPMENT_LABELS[eq])
                                .join(", ");
                            detectedWarnings.push({
                                type: "critical",
                                message: `Client uses mobility equipment you haven't marked as able to accommodate: ${equipmentLabels}`,
                            });
                        }
                    }

                    // Check standard warnings from score breakdown
                    // Use currentDriver if available, otherwise use userProfile
                    const breakdown = currentDriver?.scoreBreakdown || userProfile.scoreBreakdown;

                    if (breakdown?.warnings.hasUnavailability) {
                        detectedWarnings.push({
                            type: "standard",
                            message: "You are marked as unavailable during this appointment time",
                        });
                    }

                    if (breakdown?.warnings.hasConcurrentRide) {
                        detectedWarnings.push({
                            type: "standard",
                            message: "You have another ride scheduled at this time",
                        });
                    }

                    if (breakdown?.warnings.isOverMaxRides) {
                        const count = currentDriver?.weeklyRideCount || userProfile.weeklyRideCount || 0;
                        const max = currentDriver?.maxRidesPerWeek || userProfile.maxRidesPerWeek || 0;
                        detectedWarnings.push({
                            type: "standard",
                            message: `Accepting this ride would exceed your weekly ride limit (${count}/${max})`,
                        });
                    }

                    if (breakdown?.warnings.hasVehicleMismatch) {
                        detectedWarnings.push({
                            type: "standard",
                            message: "Your vehicle type doesn't match the client's preference",
                        });
                    }
                }

                setWarnings(detectedWarnings);
            } catch (error) {
                console.error("Error fetching warnings:", error);
                // Don't block acceptance if warning fetch fails
                setWarnings([]);
            } finally {
                setLoadingWarnings(false);
            }
        };

        fetchWarnings();
    }, [open, rideData?.id, currentUserId]);

    async function handleSubmit(): Promise<void> {
        if (!rideData?.id) return;

        setIsLoading(true);
        try {
            await http.post(`o/appointments/${rideData.id}/accept`).json();
            toast.success("Ride has been accepted!");
            onAccept?.();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error accepting ride:", error);
            const errorMessage = error?.response?.data?.message || "Failed to accept ride. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    if (!rideData) return null;

    const criticalWarnings = warnings.filter((w) => w.type === "critical");
    const standardWarnings = warnings.filter((w) => w.type === "standard");
    const hasCriticalWarnings = criticalWarnings.length > 0;
    const canAccept = !hasCriticalWarnings || criticalConfirmed;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>Would You Like to Accept this Ride?</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Client</h3>
                        <p className="text-base">{rideData.clientName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground">Date</h3>
                            <p className="text-base">{rideData.date}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground">Time</h3>
                            <p className="text-base">{rideData.time}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">
                            Pickup Address
                        </h3>
                        <div className="text-base">
                            <p>{rideData.pickupAddress}</p>
                            {rideData.pickupAddress2 && <p>{rideData.pickupAddress2}</p>}
                            {(rideData.pickupCity || rideData.pickupState || rideData.pickupZip) && (
                                <p>
                                    {rideData.pickupCity}
                                    {rideData.pickupCity && (rideData.pickupState || rideData.pickupZip) && ", "}
                                    {rideData.pickupState}
                                    {rideData.pickupState && rideData.pickupZip && " "}
                                    {rideData.pickupZip}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">
                            Destination Address
                        </h3>
                        <div className="text-base">
                            <p>{rideData.destinationAddress}</p>
                            {rideData.destinationAddress2 && <p>{rideData.destinationAddress2}</p>}
                            {(rideData.destinationCity || rideData.destinationState || rideData.destinationZip) && (
                                <p>
                                    {rideData.destinationCity}
                                    {rideData.destinationCity && (rideData.destinationState || rideData.destinationZip) && ", "}
                                    {rideData.destinationState}
                                    {rideData.destinationState && rideData.destinationZip && " "}
                                    {rideData.destinationZip}
                                </p>
                            )}
                        </div>
                    </div>

                    {rideData.tripPurpose && (
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground">
                                Trip Purpose
                            </h3>
                            <p className="text-base">{rideData.tripPurpose}</p>
                        </div>
                    )}

                    {/* Critical Warnings Section */}
                    {loadingWarnings && (
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">Checking ride compatibility...</p>
                        </div>
                    )}

                    {!loadingWarnings && criticalWarnings.length > 0 && (
                        <div className="border-2 border-red-500 bg-red-50 rounded-lg p-4">
                            <div className="flex items-start gap-2 mb-3">
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-900 text-base">
                                        Critical Warnings
                                    </h4>
                                    <p className="text-sm text-red-800 mt-1">
                                        Your profile indicates you may not meet critical requirements for this ride:
                                    </p>
                                </div>
                            </div>
                            <ul className="space-y-2 ml-7">
                                {criticalWarnings.map((warning, idx) => (
                                    <li key={idx} className="text-sm text-red-900">
                                        • {warning.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Standard Warnings Section */}
                    {!loadingWarnings && standardWarnings.length > 0 && (
                        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                            <div className="flex items-start gap-2 mb-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-900">Warnings</h4>
                                </div>
                            </div>
                            <ul className="space-y-1 ml-7">
                                {standardWarnings.map((warning, idx) => (
                                    <li key={idx} className="text-sm text-yellow-800">
                                        • {warning.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Confirmation Checkbox for Critical Warnings */}
                    {!loadingWarnings && hasCriticalWarnings && (
                        <div className="border border-red-300 bg-red-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="critical-confirm"
                                    checked={criticalConfirmed}
                                    onCheckedChange={(checked) => setCriticalConfirmed(checked === true)}
                                />
                                <label
                                    htmlFor="critical-confirm"
                                    className="text-sm text-red-900 cursor-pointer leading-tight"
                                >
                                    I understand the critical warnings above and confirm that I can safely accommodate this ride
                                </label>
                            </div>
                        </div>
                    )}

                    {!loadingWarnings && warnings.length === 0 && (
                        <div className="bg-muted p-4 rounded-md mt-6">
                            <p className="text-sm text-muted-foreground">
                                By accepting this ride, you confirm that you are available to provide
                                transportation for this client at the scheduled date and time.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-row justify-end gap-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isLoading || loadingWarnings || !canAccept}
                    >
                        {isLoading ? "Accepting..." : "Accept Ride"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
