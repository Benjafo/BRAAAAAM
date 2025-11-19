import { DataTable } from "@/components/dataTable";
// import { useAuthStore } from "@/components/stores/authStore";
// import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { OrganizationValues } from "../form/organizationForm";
import NewOrganizationModal from "../modals/organizationModal";

type Organization = {
    id: string;
    name: string;
    subdomain: string;
    logoPath: string | null;
    pocEmail: string;
    pocPhone: string | null;
    createdAt: string;
    isActive: boolean;
};

export function OrganizationsTable() {
    const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);
    const [selectedOrganizationData, setSelectedOrganizationData] = useState<
        Partial<OrganizationValues>
    >({});
    // const hasCreatePermission = useAuthStore((s) =>
    //     s.hasPermission(PERMISSIONS.ORGANIZATIONS_CREATE)
    // );
    // const hasEditPermission = useAuthStore((s) =>
    //     s.hasPermission(PERMISSIONS.ORGANIZATIONS_UPDATE)
    // );

    const fetchOrganizations = async (params: Record<string, unknown>) => {
        console.log("Params: ", params);

        const response = (await http.get(`s/organizations`).json()) as {
            results: Organization[];
            total: number;
        };
        console.log(response);

        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateOrganization = () => {
        setSelectedOrganizationData({});
        setIsOrganizationModalOpen(true);
    };

    return (
        <>
            <DataTable
                fetchData={fetchOrganizations}
                showSearch={false}
                showFilters={false}
                usePagination={false}
                columns={[
                    {
                        header: "Name",
                        accessorKey: "name",
                    },
                    {
                        header: "Subdomain",
                        accessorKey: "subdomain",
                    },
                    {
                        header: "Phone",
                        accessorKey: "pocPhone",
                    },
                    {
                        header: "Email",
                        accessorKey: "pocEmail",
                    },
                    {
                        header: "Status",
                        accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
                        id: "status",
                    },
                ]}
                // onRowClick={handleEditOrganization}
                actionButton={{
                    label: "Create Organization",
                    onClick: handleCreateOrganization,
                }}
            />
            <NewOrganizationModal
                open={isOrganizationModalOpen}
                onOpenChange={setIsOrganizationModalOpen}
                defaultValues={selectedOrganizationData}
            />
        </>
    );
}
