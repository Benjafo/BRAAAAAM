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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserFormValues } from "../form/userForm";
import UserForm from "../form/userForm";
import type { Role } from "@/lib/types";

// type Role = {
//     id: string;
//     name: string;
//     roleKey: string;
//     description: string;
// };

type NewUserModalProps = {
    defaultValues?: Partial<UserFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    viewMode?: boolean;
};

export default function NewUserModal({
    defaultValues = {},
    open,
    onOpenChange,
    onSuccess,
    viewMode = false,
}: NewUserModalProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);

    // Determine if we're editing based on whether ID is present
    const isEditing = Boolean(defaultValues.id);
    const modalTitle = viewMode ? "View User" : isEditing ? "Edit User" : "New User";
    const successMessage = isEditing ? "User Updated" : "New User Created";

    console.log("Default Values:", defaultValues);

    // Fetch roles when modal opens
    useEffect(() => {
        if (open && roles.length === 0) {
            const fetchRoles = async () => {
                setIsLoadingRoles(true);
                try {
                    const response = await http.get(`o/settings/roles`).json<{ results: Role[] }>();
                    setRoles(response.results);
                } catch (error) {
                    console.error("Failed to fetch roles:", error);
                    toast.error("Failed to load roles");
                } finally {
                    setIsLoadingRoles(false);
                }
            };
            fetchRoles();
            console.log("Loaded roles:", roles);
        }
    }, [open, roles.length]);

    async function handleSubmit(values: UserFormValues) {
        try {
            // Determine if user is a driver based on selected role
            const selectedRole = roles.find((role) => role.id === values.userRole);
            const isDriver = selectedRole?.isDriverRole ?? false;

            console.log("Submitting with role:", {
                roleId: values.userRole,
                roleName: selectedRole?.name,
                roleKey: selectedRole?.roleKey,
            });

            console.log("Vehicle type: ", values.vehicleType);

            // Map form values to API structure
            const requestBody = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.clientEmail,
                phone: `+1${values.primaryPhoneNumber}`,
                contactPreference: values.contactPreference.toLowerCase(),
                birthMonth: values.birthMonth ? values.birthMonth : null,
                birthYear: values.birthYear ? values.birthYear : null,
                emergencyContactName: values.emergencyContactName || null,
                emergencyContactPhone: values.emergencyContactPhone
                    ? `+1${values.emergencyContactPhone}`
                    : null,
                emergencyContactRelationship: values.emergencyContactRelationship || null,
                isActive: values.volunteeringStatus === "Active",
                roleId: values.userRole, // Now sending roleId instead of role name
                isDriver, // Determined from role selection
                canAccommodateMobilityEquipment: values.canAccommodateMobilityEquipment || [],
                vehicleType: values.vehicleType || null,
                canAccommodateOxygen: values.canAccommodateOxygen || false,
                canAccommodateServiceAnimal: values.canAccommodateServiceAnimal || false,
                canAccommodateAdditionalRider: values.canAccommodateAdditionalRider || false,
                customFields: values.customFields,
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
                await http
                    .put(`o/users/${defaultValues.id}`, {
                        json: requestBody,
                    })
                    .json();
            } else {
                await http
                    .post(`o/users`, {
                        json: requestBody,
                    })
                    .json();
            }

            toast.success(successMessage);
            onSuccess?.();
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
                <UserForm
                    onSubmit={handleSubmit}
                    defaultValues={defaultValues}
                    availableRoles={roles}
                    isLoadingRoles={isLoadingRoles}
                    viewMode={viewMode}
                />
                <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {viewMode ? "Close" : "Cancel"}
                    </Button>
                    {!viewMode && (
                        <Button type="submit" form="new-user-form">
                            Save
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
