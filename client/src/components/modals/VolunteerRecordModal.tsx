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

type VolunteerRecordModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recordId: string | null;
    onSuccess?: () => void;
};

export default function VolunteerRecordModal({
    open,
    onOpenChange,
    recordId,
    onSuccess,
}: VolunteerRecordModalProps) {
    const [defaultValues, setDefaultValues] = useState<Partial<VolunteerRecordFormValues> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingRecord, setIsFetchingRecord] = useState(false);

    const isEditing = Boolean(recordId);
    const modalTitle = isEditing ? "Edit Volunteer Record" : "Report Hours & Miles";
    const successMessage = isEditing ? "Record Updated" : "Record Created";

    // Fetch existing record data if editing
    useEffect(() => {
        if (open && isEditing && recordId) {
            setIsFetchingRecord(true);
            http.get(`o/volunteer-records/${recordId}`)
                .json<{
                    id: string;
                    date: string;
                    hours: string;
                    miles: number | null;
                    description: string;
                }>()
                .then((record) => {
                    setDefaultValues({
                        date: new Date(record.date),
                        hours: parseFloat(record.hours),
                        miles: record.miles,
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
    }, [open, isEditing, recordId]);

    async function handleSubmit(values: VolunteerRecordFormValues) {
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
                    .put(`o/volunteer-records/${recordId}`, {
                        json: requestBody,
                    })
                    .json();
            } else {
                await http
                    .post(`o/volunteer-records`, {
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
