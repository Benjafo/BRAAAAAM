import { DataTable } from "@/components/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { UserFormValues } from "../form/userForm";
import NewUserModal from "../modals/userModal";
// import { useUsers } from "@/hooks/org/useUsers";
// import { toast } from "sonner";
import type { TableUser } from "@/types/org/users";

// type User = {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     contactPreference: string | null;
//     birthYear: number | null;
//     birthMonth: number | null;
//     emergencyContactName: string | null;
//     emergencyContactPhone: string | null;
//     emergencyContactRelationship: string | null;
//     isActive: boolean;
//     isDriver: boolean;
//     roleId: string | null;
//     roleName: string | null;
//     address: {
//         id: string;
//         addressLine1: string;
//         addressLine2?: string | null;
//         city: string;
//         state: string;
//         zip: string;
//     };
// };

// Helper function to map API User to form values
// derived from the mapClientToFormValues from ai
function mapUserToFormValues(user: TableUser): Partial<UserFormValues> & { id: string } {
    return {
        id: user.id, // Include ID for edit detection
        firstName: user.firstName,
        lastName: user.lastName,
        clientEmail: user.email || "",
        primaryPhoneNumber: user.phone?.replace("+1", "") || "",
        primaryPhoneIsCellPhone: user.phoneIsCell || false,
        okToTextPrimaryPhone: user.okToTextPrimary || false,
        secondaryPhoneNumber: user.secondaryPhone?.replace("+1", "") || "",
        secondaryPhoneIsCellPhone: user.secondaryPhoneIsCell || false,
        okToTextSecondaryPhone: user.okToTextSecondary || false,
        contactPreference:
            (user.contactPreference &&
                ((user.contactPreference.charAt(0).toUpperCase() +
                    user.contactPreference.slice(1)) as "Phone" | "Email")) ||
            "Phone",
        birthMonth: user.birthMonth ? user.birthMonth.toString().padStart(2, "0") : "",
        birthYear: user.birthYear ? String(user.birthYear) : "",
        emergencyContactName: user.emergencyContactName || "",
        emergencyContactPhone: user.emergencyContactPhone?.replace("+1", "") || "",
        emergencyContactRelationship: user.emergencyContactRelationship || "",
        volunteeringStatus: user.isActive ? "Active" : (user.temporaryInactiveUntil ? "On leave" : "Inactive"),
        onLeaveUntil: user.temporaryInactiveUntil ? new Date(user.temporaryInactiveUntil) : undefined,
        userRole: user.roleId || "",
        canAccommodateMobilityEquipment: user.canAccommodateMobilityEquipment as any || [],
        vehicleType: user.vehicleType as any || "",
        vehicleColor: user.vehicleColor || "",
        townPreferences: user.townPreferences || "",
        destinationLimitations: user.destinationLimitations || "",
        canAccommodateOxygen: user.canAccommodateOxygen || false,
        canAccommodateServiceAnimal: user.canAccommodateServiceAnimal || false,
        canAccommodateAdditionalRider: user.canAccommodateAdditionalRider || false,
        streetAddress: user.address?.addressLine1 || "",
        streetAddress2: user.address?.addressLine2 || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        zipCode: user.address?.zip || "",
        customFields: user.customFields || {},
    };
}

export function UsersTable() {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState<
        Partial<UserFormValues> & { id?: string }
    >({});
    const [refreshKey, setRefreshKey] = useState(0);
    const hasCreatePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.USERS_CREATE));
    const hasEditPermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.USERS_UPDATE));
    const hasReadPermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.USERS_READ));

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    // const { isPending, isError, data: users, error } = useUsers({})
    /** @TODO extract fetch logic outside of datatable */

    const fetchUsers = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        /** @TODO fix passing in url params */

        // if(isError && !isPending) {
        //     toast.error('Failed to fetch users', {
        //         description: error.message
        //     });

        //     if(import.meta.env.DEV) {
        //         console.error(error)
        //     }
        // }

        // return {
        //     data: users ?? [],
        //     total: users?.length ?? 0
        // }

        type TableUserResponse = {
            page: number;
            pageSize: number;
            results: TableUser[];
            total: number;
        };

        const response = await http.get(`o/users?${searchParams}`).json<TableUserResponse>();
        console.log("Fetched users:", response);

        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateUser = () => {
        setSelectedUserData({});
        setIsViewMode(false);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: TableUser) => {
        setSelectedUserData(mapUserToFormValues(user));
        setIsViewMode(!hasEditPermission); // View mode if no edit permission
        setIsUserModalOpen(true);
    };

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchUsers}
                columns={[
                    {
                        header: "Name",
                        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
                        id: "name",
                    },
                    {
                        header: "Phone",
                        accessorKey: "phone",
                        cell: ({ getValue }) => getValue() || "N/A",
                    },
                    {
                        header: "Email",
                        accessorKey: "email",
                    },
                    {
                        header: "Address",
                        accessorFn: (row) => row.address?.addressLine1 || "N/A",
                        id: "address",
                    },
                    {
                        header: "City",
                        accessorFn: (row) => row.address?.city || "N/A",
                        id: "city",
                    },
                    {
                        header: "Zip Code",
                        accessorFn: (row) => row.address?.zip || "N/A",
                        id: "zip",
                    },
                    {
                        header: "Role",
                        accessorFn: (row) => row.roleName || "No Role",
                        id: "role",
                    },
                ]}
                onRowClick={hasReadPermission ? handleEditUser : undefined}
                actionButton={
                    hasCreatePermission
                        ? {
                              label: "Create User",
                              onClick: handleCreateUser,
                          }
                        : undefined
                }
            />
            <NewUserModal
                open={isUserModalOpen}
                onOpenChange={setIsUserModalOpen}
                defaultValues={selectedUserData}
                onSuccess={handleRefresh}
                viewMode={isViewMode}
            />
        </>
    );
}
