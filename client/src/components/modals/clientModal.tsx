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
import type { ClientFormValues } from "../form/clientForm";
import ClientForm from "../form/clientForm";
import ky from "ky";

type NewClientModalProps = {
    defaultValues?: Partial<ClientFormValues>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};
export default function ClientModal({
    defaultValues = {},
    open,
    onOpenChange,
}: NewClientModalProps) {
    // Determine if we're editing based on whether firstName is populated (AI made this)
    const isEditing = Boolean(defaultValues.firstName);
    const modalTitle = isEditing ? "Edit Client" : "New Client";
    const successMessage = isEditing ? "Client Updated" : "New Client Created";

    async function handleSubmit(values: ClientFormValues) {
        // TODO: API logic for new client information sent
        try {
            console.log("Form values:", values);

            const orgID = window.location.href.split("//")[1].split(/[..]/)[0];

            // Map form values to API structure
            const requestBody = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.clientEmail,
                phone: values.primaryPhoneNumber,
                gender: values.clientGender,
                contactPreference: values.primaryContactPref,
                livesAlone: values.livingAlone === "Does not live alone",
                addressLocation:
                    values.homeAddress + (values.homeAddress2 ? `, ${values.homeAddress2}` : ""),
            };

            console.log("Sending to API:", requestBody);

            // Make API call with form data
            const response = await ky
                .post(`/o/${orgID}/clients`, {
                    json: requestBody,
                })
                .json();

            console.log("API response:", response);
            toast.success(successMessage);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to create client:", error);
            toast.error("Failed to save client. Please try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>

                <ClientForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-client-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
