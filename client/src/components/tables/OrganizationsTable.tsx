import { DataTable } from "@/components/dataTable";
import { useState } from "react";
import type { OrganizationFormValues } from "../form/organizationForm";
import NewOrganizationModal from "../modals/organizationModal";

type Organization = {
    name: string;
    primaryContact: string;
    phone: string;
    email: string;
};

const ORGANIZATIONS: Organization[] = [
    {
        name: "Webster Wasps",
        primaryContact: "Deb Reilley",
        phone: "9876543210",
        email: "deb@reilley.com",
    },
];

const mapOrganizationToFormValues = (organization: Organization) => {
    return {
        name: organization.name,
        primaryContact: organization.primaryContact,
        phone: organization.phone,
        email: organization.email,
    };
};

export function OrganizationsTable() {
    const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);
    const [selectedOrganizationData, setSelectedOrganizationData] = useState<
        Partial<OrganizationFormValues> & { id?: string }
    >({});

    //TODO replace hardcoded data with api call
    const fetchOrganizations = async (_params: Record<string, any>) => {
        return {
            data: ORGANIZATIONS,
            total: ORGANIZATIONS.length,
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
                        header: "Primary Contact",
                        accessorKey: "primaryContact",
                    },
                    {
                        header: "Phone",
                        accessorKey: "phone",
                    },
                    {
                        header: "Email",
                        accessorKey: "email",
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
            />
        </>
    );
}
