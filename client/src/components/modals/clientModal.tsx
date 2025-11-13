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
import type { ClientFormValues } from "../form/clientForm";
import ClientForm from "../form/clientForm";

type NewClientModalProps = {
    defaultValues?: Partial<ClientFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    viewMode?: boolean;
};
export default function ClientModal({
    defaultValues = {},
    open,
    onOpenChange,
    onSuccess,
    viewMode = false,
}: NewClientModalProps) {
    const isEditing = Boolean(defaultValues.id);
    const modalTitle = viewMode ? "View Client" : isEditing ? "Edit Client" : "New Client";
    const successMessage = isEditing ? "Client Updated" : "New Client Created";

    console.log("Default Values:", defaultValues);

    async function handleSubmit(values: ClientFormValues) {
        try {

            // Map form values to API structure
            const requestBody = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.clientEmail || null,
                phone: `+1${values.primaryPhoneNumber}`,
                phoneIsCell: values.primaryPhoneIsCellPhone,
                gender: values.clientGender,
                birthMonth: values.birthMonth ? parseInt(values.birthMonth, 10) : null,
                birthYear: parseInt(values.birthYear, 10),
                contactPreference: values.contactPref.toLowerCase(),
                livesAlone: values.livingAlone === "Lives alone",
                emergencyContactName: values.emergencyContactName || null,
                emergencyContactPhone: values.emergencyContactPhone
                    ? `+1${values.emergencyContactPhone}`
                    : null,
                emergencyContactRelationship: values.emergencyContactRelationship || null,
                notes: values.notes || null,
                pickupInstructions: values.pickupInstructions || null,
                mobilityEquipment: values.mobilityEquipment || [],
                mobilityEquipmentOther: values.mobilityEquipmentOther || null,
                vehicleTypes: values.vehicleTypes || [],
                hasOxygen: values.hasOxygen || false,
                hasServiceAnimal: values.hasServiceAnimal || false,
                serviceAnimalDescription: values.serviceAnimalDescription || null,
                otherLimitations: values.otherLimitations || [],
                otherLimitationsOther: values.otherLimitationsOther || null,
                customFields: values.customFields,
                address: {
                    addressLine1: values.homeAddress,
                    addressLine2: values.homeAddress2 || null,
                    city: values.city,
                    state: values.state,
                    zip: values.zipCode,
                    country: "USA",
                },
            };

            // Make API call based on editing status
            if (isEditing) {
                await http
                    .put(`o/clients/${defaultValues.id}`, {
                        json: requestBody,
                    })
                    .json();
            } else {
                await http
                    .post(`o/clients`, {
                        json: requestBody,
                    })
                    .json();
            }

            toast.success(successMessage);
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save client:", error);
            toast.error("Failed to save client. Please try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>

                <ClientForm onSubmit={handleSubmit} defaultValues={defaultValues} viewMode={viewMode} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {viewMode ? "Close" : "Cancel"}
                    </Button>
                    {!viewMode && (
                        <Button type="submit" form="new-client-form">
                            Save
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
