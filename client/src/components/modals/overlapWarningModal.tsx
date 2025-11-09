"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

type UnavailabilityConflict = {
    id: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    isAllDay: boolean;
    reason: string | null;
    isRecurring: boolean;
    recurringDayOfWeek: string | null;
};

type Props = {
    open: boolean;
    conflicts: UnavailabilityConflict[];
    onConfirm: () => void;
    onCancel: () => void;
};

export default function OverlapWarningModal({ open, conflicts, onConfirm, onCancel }: Props) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return null;
        // timeStr is in HH:MM format, convert to 12-hour format
        const [hours, minutes] = timeStr.split(":");
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle>Overlapping Unavailability Detected</DialogTitle>
                            <DialogDescription>
                                This unavailability overlaps with existing blocks
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="my-4">
                    <p className="text-sm text-muted-foreground mb-3">
                        The following unavailability {conflicts.length === 1 ? "block" : "blocks"}{" "}
                        will overlap with your new entry:
                    </p>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {conflicts.map((conflict) => (
                            <div
                                key={conflict.id}
                                className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                            >
                                {conflict.isRecurring ? (
                                    <div className="text-sm">
                                        <div className="font-medium text-amber-900">
                                            Every {conflict.recurringDayOfWeek}
                                        </div>
                                        <div className="text-amber-700">
                                            {conflict.isAllDay
                                                ? "All day"
                                                : `${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}`}
                                        </div>
                                        {conflict.reason && (
                                            <div className="text-xs text-amber-600 mt-1">
                                                {conflict.reason}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm">
                                        <div className="font-medium text-amber-900">
                                            {formatDate(conflict.startDate)}
                                            {conflict.startDate !== conflict.endDate &&
                                                ` - ${formatDate(conflict.endDate)}`}
                                        </div>
                                        <div className="text-amber-700">
                                            {conflict.isAllDay
                                                ? "All day"
                                                : `${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}`}
                                        </div>
                                        {conflict.reason && (
                                            <div className="text-xs text-amber-600 mt-1">
                                                {conflict.reason}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="flex flex-row justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700">
                        Create Anyway
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
