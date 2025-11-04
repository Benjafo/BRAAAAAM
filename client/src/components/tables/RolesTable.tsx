import { DataTable } from "@/components/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import type { Permission, Role } from "@/lib/types";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { RoleFormValues } from "../form/roleForm";
import RoleModal from "../modals/roleModal";
import { Badge } from "@/components/ui/badge";

export function RolesTable() {
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedRoleData, setSelectedRoleData] = useState<
        Partial<RoleFormValues> & { id?: string }
    >({});
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
    const [tableKey, setTableKey] = useState(0); // For forcing table refresh

    const hasCreatePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.ROLES_CREATE));

    const fetchRoles = async (_params: Record<string, any>) => {
        const orgID = "braaaaam";
        const response = (await http.get(`o/${orgID}/settings/roles`).json()) as {
            results: Role[];
            total: number;
            availablePermissions: Permission[];
        };

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
            // Modal will fetch full role details including permissions
        });
        setIsRoleModalOpen(true);
    };

    const handleModalSuccess = () => {
        // Force table refresh by incrementing key
        setTableKey((prev) => prev + 1);
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
                    },
                    {
                        header: "Description",
                        accessorKey: "description",
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
                        cell: ({ getValue }) => {
                            const count = getValue() as number;
                            return `${count} permission${count !== 1 ? "s" : ""}`;
                        },
                    },
                    {
                        header: "Type",
                        accessorKey: "isSystem",
                        cell: ({ getValue }) => {
                            const isSystem = getValue() as boolean;
                            return isSystem ? (
                                <Badge variant="secondary">System</Badge>
                            ) : (
                                <Badge variant="outline">Custom</Badge>
                            );
                        },
                    },
                    {
                        header: "Created",
                        accessorKey: "createdAt",
                        cell: ({ getValue }) => {
                            const date = getValue() as string;
                            return new Date(date).toLocaleDateString();
                        },
                    },
                ]}
                onRowClick={handleEditRole}
                actionButton={
                    hasCreatePermission
                        ? {
                              label: "Create Role",
                              onClick: handleCreateRole,
                          }
                        : undefined
                }
            />
            <RoleModal
                open={isRoleModalOpen}
                onOpenChange={setIsRoleModalOpen}
                defaultValues={selectedRoleData}
                availablePermissions={availablePermissions}
                onSuccess={handleModalSuccess}
            />
        </>
    );
}
