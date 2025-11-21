import { DataTable } from "@/components/dataTable";
// import { useAuthStore } from "@/components/stores/authStore";
// import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { OrganizationValues } from "../form/organizationForm";
import NewOrganizationModal from "../modals/organizationModal";
import { useNavigate } from "@tanstack/react-router";
import { useLogout } from "@/hooks/useAuth";

type Organization = {
    id: string;
    name: string;
    subdomain: string;
    // logoPath: string | null;
    pocName: string;
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

    const navigate = useNavigate();
    const logout = useLogout();

    const fetchOrganizations = async (params: Record<string, unknown>) => {
        console.log("Params: ", params);

        const response = (await http.get(`s/organizations`).json()) as {
            results: Organization[];
            total: number;
        };
        console.log(response);

        // const organizations = response.results.map((org) => ({
        //     ...org,
        //     // Format createdAt date
        //     link
        // }));

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
                caption={(<h3 className="text-3xl font-bold mb-5 text-foreground">Organizations</h3>)}
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
                        header: "Contact Name",
                        accessorKey: "pocName"
                    },
                    {
                        header: "Contact Phone",
                        accessorKey: "pocPhone",
                    },
                    {
                        header: "Contact Email",
                        accessorKey: "pocEmail",
                    },
                    {
                        header: "Created At",
                        accessorFn: (row) => (new Date(row.createdAt).toLocaleDateString())
                    },
                    {
                        header: "Status",
                        accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
                        id: "status",
                    },
                ]}
                onRowClick={(row) => {
                    logout.mutate(undefined, {
                        onSettled: () => {
                            navigate({ to: "/{-$subdomain}/sign-in", params: { subdomain: row.subdomain }, });
                        },
                    });
                }}
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
