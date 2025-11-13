"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type RideData = {
    id: string;
    clientName: string;
    date: string;
    time: string;
    pickupAddress: string;
    destinationAddress: string;
    tripPurpose?: string;
};

type AcceptRideModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rideData?: RideData;
    onAccept?: () => void;
};

export default function AcceptRideModal({
    open,
    onOpenChange,
    rideData,
    onAccept,
}: AcceptRideModalProps) {
    async function handleSubmit(): Promise<void> {
        // TODO: API logic for accepting ride
        console.log("Accept ride clicked for:", rideData?.id);
        toast.success("Ride has been accepted.");
        onAccept?.();
        onOpenChange(false);
    }

    if (!rideData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>Accept Ride</DialogTitle>
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
                        <p className="text-base">{rideData.pickupAddress}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">
                            Destination Address
                        </h3>
                        <p className="text-base">{rideData.destinationAddress}</p>
                    </div>

                    {rideData.tripPurpose && (
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground">
                                Trip Purpose
                            </h3>
                            <p className="text-base">{rideData.tripPurpose}</p>
                        </div>
                    )}

                    <div className="bg-muted p-4 rounded-md mt-6">
                        <p className="text-sm text-muted-foreground">
                            By accepting this ride, you confirm that you are available to provide
                            transportation for this client at the scheduled date and time.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-row justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSubmit}>
                        Accept Ride
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
