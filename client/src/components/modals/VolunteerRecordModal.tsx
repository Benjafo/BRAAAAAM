"use client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { http } from "@/services/auth/serviceResolver";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { VolunteerRecordForm, type VolunteerRecordFormValues } from "../form/VolunteerRecordForm";
import { useAuthStore } from "../stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { DriverSelector } from "../common/driverSelector";

type VolunteerRecordModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recordId: string | null;
    targetUserId?: string;
    targetUserName?: string;
    onSuccess?: () => void;
};

export default function VolunteerRecordModal({
    open,
    onOpenChange,
    recordId,
    targetUserId,
    targetUserName,
    onSuccess,
}: VolunteerRecordModalProps) {
    const [defaultValues, setDefaultValues] = useState<Partial<VolunteerRecordFormValues> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingRecord, setIsFetchingRecord] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(targetUserId || null);
    const [selectedDriverName, setSelectedDriverName] = useState<string | null>(targetUserName || null);

    const currentUserId = useAuthStore((s) => s.user)?.id;
    const hasAllVolunteerCreate = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_VOLUNTEER_RECORDS_CREATE)
    );
    const hasAllVolunteerRead = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_VOLUNTEER_RECORDS_READ)
    );

    const isEditing = Boolean(recordId);
    const modalTitle = isEditing ? "Edit Volunteer Record" : "Report Hours & Miles";
    const successMessage = isEditing ? "Record Updated" : "Record Created";

    // Determine which userId to use: targetUserId > selectedDriverId > currentUserId
    const userId = targetUserId || selectedDriverId || currentUserId;

    // Show driver selector if user has permission and not editing and no targetUserId provided
    const showDriverSelector = hasAllVolunteerCreate && !isEditing && !targetUserId;

    // Fetch existing record data if editing
    useEffect(() => {
        if (open && isEditing && recordId && userId) {
            setIsFetchingRecord(true);
            http.get(`o/users/${userId}/volunteer-records/${recordId}`)
                .json<{
                    id: string;
                    date: string;
                    hours: string;
                    miles: number | null;
                    description: string;
                }>()
                .then((record) => {
                    setDefaultValues({
                        date: new Date(record.date + "T00:00:00"),
                        hours: parseFloat(record.hours),
                        miles: record.miles !== null ? parseFloat(record.miles as any) : null,
                        description: record.description,
                    });
                })
                .catch((error) => {
                    console.error("Failed to fetch volunteer record:", error);
                    toast.error("Failed to load record data");
                })
                .finally(() => {
                    setIsFetchingRecord(false);
                });
        } else if (open && !isEditing) {
            // Reset to default values for new record
            setDefaultValues({
                date: new Date(),
                hours: 0,
                miles: null,
                description: "",
            });
        }
    }, [open, isEditing, recordId, userId]);

    async function handleSubmit(values: VolunteerRecordFormValues) {
        // Validate driver selection for users with ALL_VOLUNTEER_RECORDS_CREATE permission
        if (showDriverSelector && !selectedDriverId) {
            toast.error("Please select a volunteer.");
            return;
        }

        if (!userId) {
            toast.error("User not authenticated, please log in again.");
            return;
        }

        setIsLoading(true);
        try {
            // Format date as YYYY-MM-DD
            const formattedDate = values.date.toISOString().split("T")[0];

            const requestBody = {
                date: formattedDate,
                hours: values.hours,
                miles: values.miles,
                description: values.description,
            };

            // Make API call based on editing status
            if (isEditing && recordId) {
                await http
                    .put(`o/users/${userId}/volunteer-records/${recordId}`, {
                        json: requestBody,
                    })
                    .json();
            } else {
                await http
                    .post(`o/users/${userId}/volunteer-records`, {
                        json: requestBody,
                    })
                    .json();
            }

            toast.success(successMessage);
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save volunteer record:", error);
            toast.error("Failed to save record. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleCancel() {
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>

                {/* Show driver selector for admins/dispatchers when creating */}
                {showDriverSelector && (
                    <div className="mb-4">
                        <DriverSelector
                            value={selectedDriverId}
                            onChange={(driverId, driverName) => {
                                setSelectedDriverId(driverId);
                                setSelectedDriverName(driverName);
                            }}
                            required
                        />
                    </div>
                )}

                {/* Show driver name when editing (read-only) for admins/dispatchers */}
                {isEditing && hasAllVolunteerRead && (targetUserName || selectedDriverName) && (
                    <div className="mb-4 p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">Volunteer</p>
                        <p className="font-medium">{targetUserName || selectedDriverName}</p>
                    </div>
                )}

                {isFetchingRecord ? (
                    <div className="py-8 text-center text-muted-foreground">
                        Loading record data...
                    </div>
                ) : (
                    <VolunteerRecordForm
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        defaultValues={defaultValues}
                        isLoading={isLoading}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
