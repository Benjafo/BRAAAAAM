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
import ky from "ky";
import type { UserFormValues } from "../form/userForm";
import NewUserForm from "../form/userForm";

type NewUserModalProps = {
    defaultValues?: Partial<UserFormValues>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function NewUserModal({
    defaultValues = {},
    open,
    onOpenChange,
}: NewUserModalProps) {
    // Determine if we're editing based on whether address is populated (AI worked on this)
    const isEditing = Boolean(defaultValues.firstName);
    const modalTitle = isEditing ? "Edit User" : "New User";
    const successMessage = isEditing ? "User Updated" : "New User Created";

    async function handleSubmit(values: UserFormValues) {
        // TODO: API logic for new/edit location form values
        try {
            console.log("Form values:", values);

            const orgID = window.location.href.split("//")[1].split(/[..]/)[0];

            // Map form values to API structure
            const requestBody = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.clientEmail,
                phone: values.primaryPhoneNumber,
                contactPreference: values.contactPreference,
                isActive: values.volunteeringStatus === "Active",
                isDriver: values.userRole === "Driver",
            };

            console.log("Sending to API:", requestBody);

            // Make API call with form data
            const response = await ky
                .post(`/o/${orgID}/users`, {
                    json: requestBody,
                })
                .json();

            console.log("API response:", response);
            toast.success(successMessage);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to create user:", error);
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
