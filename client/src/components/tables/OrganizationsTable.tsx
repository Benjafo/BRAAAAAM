import { DataTable } from "@/components/dataTable";
import ky from "ky";
import { useState } from "react";
import type { OrganizationFormValues } from "../form/organizationForm";
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

const mapOrganizationToFormValues = (
    organization: Organization
): Partial<OrganizationFormValues> & { id: string } => {
    return {
        id: organization.id,
        orgName: organization.name,
        email: organization.pocEmail,
        phoneGeneral: organization.pocPhone?.replace(/^\+1/, "") || "",
        status: organization.isActive ? "Active" : "Inactive",
        orgCreationDate: organization.createdAt ? new Date(organization.createdAt) : new Date(),
    };
};

export function OrganizationsTable() {
    const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);
    const [selectedOrganizationData, setSelectedOrganizationData] = useState<
        Partial<OrganizationFormValues> & { id?: string }
    >({});

    const fetchOrganizations = async (_params: Record<string, any>) => {
        const response = (await ky.get(`/s/organizations`).json()) as {
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

    const handleEditOrganization = (organization: Organization) => {
        console.log(`Selected organization data: ${selectedOrganizationData}`);
        setSelectedOrganizationData(mapOrganizationToFormValues(organization));
        setIsOrganizationModalOpen(true);
    };

    return (
        <>
            <DataTable
                fetchData={fetchOrganizations}
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
                onRowClick={handleEditOrganization}
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
