import { DataTable } from "@/components/common/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSIONS } from "@/lib/permissions";
import type { Permission, Role } from "@/lib/types";
import { http } from "@/services/auth/serviceResolver";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RoleFormValues } from "../form/roleForm";
import RoleModal from "../modals/roleModal";

export function RolesTable() {
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedRoleData, setSelectedRoleData] = useState<
        Partial<RoleFormValues> & { id?: string }
    >({});
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
    const [tableKey, setTableKey] = useState(0); // For forcing table refresh
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const hasCreatePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.ROLES_CREATE));
    const hasEditPermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.ROLES_UPDATE));
    // TODO we should have a ROLES_DELETE permission
    const hasDeletePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.ROLES_UPDATE));

    const fetchRoles = async (params: Record<string, unknown>) => {
        console.log("Params: ", params);

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        const response = await http
            .get(`o/settings/roles?${searchParams}`)
            .json<{ results: Role[]; total: number; availablePermissions: Permission[] }>();

        // Store available permissions for the modal (only if not already set)
        if (response.availablePermissions && availablePermissions.length === 0) {
            setAvailablePermissions(response.availablePermissions);
        }

        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateRole = () => {
        setSelectedRoleData({});
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setSelectedRoleData({
            id: role.id,
        });
        setIsRoleModalOpen(true);
    };

    // Force table refresh by incrementing key
    const handleModalSuccess = () => {
        setTableKey((prev) => prev + 1);
    };

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roleToDelete) return;

        try {
            await http.delete(`o/settings/roles/${roleToDelete.id}`);
            toast.success("Role deleted successfully");
            setDeleteDialogOpen(false);
            setRoleToDelete(null);
            // Refresh table
            setTableKey((prev) => prev + 1);
        } catch (error: unknown) {
            console.error("Error deleting role:", error);

            // Handle specific error cases
            if (error && typeof error === "object" && "response" in error) {
                const errorData = await (error.response as Response).json().catch(() => ({}));
                if (errorData.error === "Cannot delete role assigned to users") {
                    toast.error(`Cannot delete role: assigned to ${errorData.userCount} user(s)`);
                } else {
                    toast.error(errorData.error || "Failed to delete role");
                }
            } else {
                toast.error("Failed to delete role");
            }
        }
    };

    return (
        <>
            <DataTable
                key={tableKey}
                fetchData={fetchRoles}
                columns={[
                    {
                        header: "Name",
                        accessorKey: "name",
                        id: "name",
                    },
                    {
                        header: "Description",
                        accessorKey: "description",
                        id: "description",
                        cell: ({ getValue }) => {
                            const description = getValue() as string;
                            return description.length > 80
                                ? `${description.substring(0, 80)}...`
                                : description;
                        },
                    },
                    {
                        header: "Permissions",
                        accessorKey: "permissionCount",
                        id: "permissionCount",
                        cell: ({ getValue }) => {
                            const count = getValue() as number;
                            return `${count} permission${count !== 1 ? "s" : ""}`;
                        },
                    },
                    {
                        header: "Created",
                        accessorKey: "createdAt",
                        id: "createdAt",
                        cell: ({ getValue }) => {
                            const date = getValue() as string;
                            return new Date(date).toLocaleDateString();
                        },
                    },
                ]}
                onRowClick={hasEditPermission ? handleEditRole : undefined}
                actionButton={
                    hasCreatePermission
                        ? {
                              label: "Create Role",
                              onClick: handleCreateRole,
                          }
                        : undefined
                }
                rowActions={
                    hasDeletePermission
                        ? (role: Role) => (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Open menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteClick(role);
                                          }}
                                          className="text-destructive focus:text-destructive"
                                      >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          )
                        : undefined
                }
            />

            {/* Edit/create role modal */}
            <RoleModal
                open={isRoleModalOpen}
                onOpenChange={setIsRoleModalOpen}
                defaultValues={selectedRoleData}
                availablePermissions={availablePermissions}
                onSuccess={handleModalSuccess}
            />

            {/* Confirm delete modal */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the role "{roleToDelete?.name}". This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
