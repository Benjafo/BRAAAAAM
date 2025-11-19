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
import { toast } from "sonner";
import CallLogForm, { type CallLogFormValues } from "../form/CallLogForm";

type CallLogModalProps = {
    defaultValues?: Partial<CallLogFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
};

export default function CallLogModal({
    defaultValues = {},
    open,
    onOpenChange,
    onSuccess,
}: CallLogModalProps) {
    const isEditing = defaultValues.id !== undefined;
    const modalTitle = isEditing ? "Edit Call Log" : "New Call Log";
    const successMessage = isEditing ? "Call Log Updated" : "Call Log Created";

    async function handleSubmit(values: CallLogFormValues) {
        try {
            console.log("Form values:", values);

            // Normalize phone number: strip all non-digits and prepend +1
            const normalizedPhone = `+1${values.phoneNumber.replace(/\D/g, "")}`;

            const requestBody = {
                date: values.date,
                time: values.time || null,
                firstName: values.firstName,
                lastName: values.lastName,
                phoneNumber: normalizedPhone,
                callType: values.callType,
                message: values.message || null,
                notes: values.notes || null,
            };

            console.log("Sending to API:", requestBody);

            if (defaultValues.id) {
                // Edit mode - PUT request
                await http.put(`o/call-logs/${defaultValues.id}`, {
                    json: requestBody,
                }).json();
            } else {
                // Create mode - POST request
                await http.post("o/call-logs", {
                    json: requestBody,
                }).json();
            }

            toast.success(successMessage);
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Failed to save call log:", error);
            toast.error("Failed to save call log. Please try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[500px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                <CallLogForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="call-log-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
