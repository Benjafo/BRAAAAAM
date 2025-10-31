"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ky from "ky";
import { toast } from "sonner";
import type { UserFormValues } from "../form/userForm";
import NewUserForm from "../form/userForm";

type NewUserModalProps = {
    defaultValues?: Partial<UserFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function NewUserModal({
    defaultValues = {},
    open,
    onOpenChange,
}: NewUserModalProps) {
    // Determine if we're editing based on whether ID is present
    const isEditing = Boolean(defaultValues.id);
    const modalTitle = isEditing ? "Edit User" : "New User";
    const successMessage = isEditing ? "User Updated" : "New User Created";

    async function handleSubmit(values: UserFormValues) {
        try {
            const orgID = "braaaaam";

            // Map form values to API structure
            const requestBody = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.clientEmail,
                phone: `+1${values.primaryPhoneNumber}`,
                contactPreference: values.contactPreference.toLowerCase(),
                isActive: values.volunteeringStatus === "Active",
                isDriver: values.userRole === "Driver",
                address: {
                    addressLine1: values.streetAddress,
                    addressLine2: values.streetAddress2 || null,
                    city: values.city,
                    state: values.state,
                    zip: values.zipCode,
                    country: "USA",
                },
            };

            // Make API call - PUT for edit, POST for create
            if (isEditing) {
                await ky
                    .put(`/o/${orgID}/users/${defaultValues.id}`, {
                        json: requestBody,
                        headers: {
                            "x-org-subdomain": orgID,
                        },
                    })
                    .json();
            } else {
                await ky
                    .post(`/o/${orgID}/users`, {
                        json: requestBody,
                        headers: {
                            "x-org-subdomain": orgID,
                        },
                    })
                    .json();
            }

            toast.success(successMessage);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save user:", error);
            toast.error("Failed to save user. Please try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[692px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                <NewUserForm onSubmit={handleSubmit} defaultValues={defaultValues} />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-user-form">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
