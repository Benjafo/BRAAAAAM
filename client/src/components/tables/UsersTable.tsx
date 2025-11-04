import { DataTable } from "@/components/dataTable";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { UserFormValues } from "../form/userForm";
import NewUserModal from "../modals/userModal";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contactPreference: string | null;
    birthYear: number | null;
    birthMonth: number | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelationship: string | null;
    isActive: boolean;
    isDriver: boolean;
    address: {
        id: string;
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        state: string;
        zip: string;
    };
};

// Helper function to map API User to form values
// derived from the mapClientToFormValues from ai
function mapUserToFormValues(user: User): Partial<UserFormValues> & { id: string } {
    return {
        id: user.id, // Include ID for edit detection
        firstName: user.firstName,
        lastName: user.lastName,
        clientEmail: user.email || "",
        primaryPhoneNumber: user.phone?.replace("+1", "") || "",
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
        volunteeringStatus: user.isActive ? "Active" : "Inactive",
        userRole: user.isDriver ? "Driver" : "Dispatcher",
        streetAddress: user.address?.addressLine1 || "",
        streetAddress2: user.address?.addressLine2 || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        zipCode: user.address?.zip || "",
        // TODO: add other fields from api?? not 100% but im pretty sure some are missing
    };
}

export function UsersTable() {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState<
        Partial<UserFormValues> & { id?: string }
    >({});

    const fetchUsers = async (params: Record<string, any>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        const orgID = "braaaaam";
        const response = (await http
            .get(`o/${orgID}/users`, {
                headers: {
                    "x-org-subdomain": orgID,
                },
            })
            .json()) as { results: User[]; total: number };
        console.log("Fetched users:", response);
        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateUser = () => {
        setSelectedUserData({});
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUserData(mapUserToFormValues(user));
        setIsUserModalOpen(true);
    };

    return (
        <>
            <DataTable
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
                        accessorFn: (row) => (row.isDriver ? "Driver" : "Dispatcher"),
                        id: "role",
                    },
                ]}
                onRowClick={handleEditUser}
                actionButton={{
                    label: "Create User",
                    onClick: handleCreateUser,
                }}
            />
            <NewUserModal
                open={isUserModalOpen}
                onOpenChange={setIsUserModalOpen}
                defaultValues={selectedUserData}
            />
        </>
    );
}
