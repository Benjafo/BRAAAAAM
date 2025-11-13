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
import type { LocationFormValues } from "../form/locationForm";
import NewLocationForm from "../form/locationForm";

type NewLocationModalProps = {
    defaultValues?: Partial<LocationFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function LocationModal({
    defaultValues = {},
    open,
    onOpenChange,
}: NewLocationModalProps) {
    // Determine if we're editing based on whether id is present
    const isEditing = defaultValues.id !== undefined;
    const modalTitle = isEditing ? "Edit Location" : "New Location";
    const successMessage = isEditing ? "Location Updated" : "New Location Created";

    async function handleSubmit(values: LocationFormValues) {
        try {
            console.log("Form values:", values);

            // Map form values to API structure
            const requestBody = {
                aliasName: values.locationName,
                addressLine1: values.address,
                addressLine2: values.address2,
                city: values.city,
                state: values.state,
                zip: values.zip,
                country: values.country || "USA",
            };

            console.log("Sending to API:", requestBody);

            // Determine if editing or creating
            let response;
            if (defaultValues.id) {
                // Edit mode - PUT request
                response = await http
                    .put(`o/settings/locations/${defaultValues.id}`, {
                        json: requestBody,
                    })
                    .json();
            } else {
                // Create mode - POST request
                response = await http
                    .post(`o/settings/locations`, {
                        json: requestBody,
                    })
                    .json();
            }

            console.log("API response:", response);
            toast.success(successMessage);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save location:", error);
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
