"use client";

import RoleForm, { type RoleFormValues } from "@/components/form/roleForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Permission, RoleDetail } from "@/lib/types";
import { http } from "@/services/auth/serviceResolver";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RoleModalProps = {
    defaultValues?: Partial<RoleFormValues> & { id?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availablePermissions: Permission[];
    onSuccess?: () => void;
};

export default function RoleModal({
    open,
    onOpenChange,
    defaultValues,
    availablePermissions,
    onSuccess,
}: RoleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [roleDetails, setRoleDetails] = useState<RoleDetail | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = !!defaultValues?.id;

    // Fetch role details when editing
    useEffect(() => {
        async function fetchRoleDetails() {
            if (!isEditing || !defaultValues?.id) return;

            setIsLoading(true);
            try {
                const response = await http
                    .get(`o/settings/roles/${defaultValues.id}`)
                    .json<RoleDetail>();

                setRoleDetails(response);
            } catch (error) {
                console.error("Error fetching role details:", error);
                toast.error("Failed to load role details");
            } finally {
                setIsLoading(false);
            }
        }

        if (open) {
            fetchRoleDetails();
        } else {
            // Reset state when modal closes
            setRoleDetails(null);
        }
    }, [open, isEditing, defaultValues?.id]);

    // Prepare form default values
    const formDefaultValues: Partial<RoleFormValues> =
        isEditing && roleDetails
            ? {
                  roleName: roleDetails.roleName,
                  description: roleDetails.description,
                  isDriverRole: roleDetails.isDriverRole,
                  permissionIds: roleDetails.permissionIds,
              }
            : {
                  roleName: "",
                  description: "",
                  isDriverRole: false,
                  permissionIds: [],
              };

    async function handleSubmit(values: RoleFormValues) {
        setIsSubmitting(true);
        try {

            const requestBody = {
                roleName: values.roleName,
                description: values.description,
                isDriverRole: values.isDriverRole,
                permissionIds: values.permissionIds,
            };

            if (isEditing && defaultValues?.id) {
                // Update existing role
                await http
                    .put(`o/settings/roles/${defaultValues.id}`, {
                        json: requestBody,
                    })
                    .json();
                toast.success("Role updated successfully");
            } else {
                // Create new role
                await http
                    .post(`o/settings/roles`, {
                        json: requestBody,
                    })
                    .json();
                toast.success("Role created successfully");
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error saving role:", error);
            toast.error(isEditing ? "Failed to update role" : "Failed to create role");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto scroll-smooth p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>
                        {isEditing ? "Edit Role" : "Create New Role"}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">Loading role details...</p>
                    </div>
                ) : (
                    <>
                        <RoleForm
                            defaultValues={formDefaultValues}
                            onSubmit={handleSubmit}
                            availablePermissions={availablePermissions}
                        />

                        <DialogFooter className="flex flex-row justify-end gap-3 mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="role-form"
                                disabled={isSubmitting || isLoading}
                            >
                                {isSubmitting
                                    ? "Saving..."
                                    : isEditing
                                      ? "Save Changes"
                                      : "Create Role"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
