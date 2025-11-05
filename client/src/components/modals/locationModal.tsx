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
import type { LocationFormValues } from "../form/locationForm";
import NewLocationForm from "../form/locationForm";
import ky from "ky";

type NewLocationModalProps = {
    defaultValues?: Partial<LocationFormValues>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function NewLocationModal({
    defaultValues = {},
    open,
    onOpenChange,
}: NewLocationModalProps) {
    // Determine if we're editing based on whether address is populated (AI worked on this)
    const isEditing = defaultValues.locationName !== undefined;
    const modalTitle = isEditing ? "Edit Location" : "New Location";
    const successMessage = isEditing ? "Location Updated" : "New Location Created";

    async function handleSubmit(values: LocationFormValues) {
        try {
            console.log("Form values:", values);

            const orgID = window.location.href.split("//")[1].split(/[..]/)[0];

            // Map form values to API structure
            const requestBody = {
                aliasName: values.locationName,
                addressLine1: values.newAddress,
                addressLine2: values.newAddress2,
            };

            console.log("Sending to API:", requestBody);

            // Make API call with form data
            const response = await ky
                .post(`/o/${orgID}/settings/locations`, {
                    json: requestBody,
                })
                .json();

            console.log("API response:", response);
            toast.success(successMessage);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to create location:", error);
            toast.error("Failed to save location. Please try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[388px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                <NewLocationForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-location-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
