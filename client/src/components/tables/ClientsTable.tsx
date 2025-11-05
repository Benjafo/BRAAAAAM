import { DataTable } from "@/components/dataTable";
import ky from "ky";
import { useState } from "react";
import type { ClientFormValues } from "../form/clientForm";
import ClientModal from "../modals/clientModal";
import { useParams } from "@tanstack/react-router";

type Client = {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    phoneIsCell: boolean;
    email: string | null;
    gender: string;
    birthMonth: number | null;
    birthYear: number;
    contactPreference: string;
    livesAlone: boolean;
    isActive: boolean;
    address: {
        id: string;
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        state: string;
        zip: string;
    };
};

// Helper function to map API Client to form values
// ai made this
function mapClientToFormValues(client: Client): Partial<ClientFormValues> & { id: string } {
    return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        clientEmail: client.email || "",
        primaryPhoneNumber: client.phone?.replace("+1", "") || "",
        primaryPhoneIsCellPhone: client.phoneIsCell,
        birthMonth: client.birthMonth ? client.birthMonth.toString().padStart(2, "0") : "",
        birthYear: String(client.birthYear),
        clientGender: client.gender as "Male" | "Female" | "Other",
        contactPref:
            client.contactPreference.charAt(0).toUpperCase() + client.contactPreference.slice(1),
        livingAlone: client.livesAlone ? "Lives alone" : "Does not live alone",
        homeAddress: client.address.addressLine1,
        homeAddress2: client.address.addressLine2 || "",
        // TODO: add birthMonth, birthYear, clientStatus, volunteeringStatus when available from API
        // isCellPhone and okToText also are not included
        // derived date fields for volunteer status are also not included
    };
}

export function ClientsTable() {
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [selectedClientData, setSelectedClientData] = useState<
        Partial<ClientFormValues> & { id?: string }
    >({});

    const fetchClients = async (params: Record<string, any>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        const { subdomain } = useParams({strict: false});
        const response = (await ky
            .get(`/o/${subdomain}/clients`, {
                headers: {
                    "x-org-subdomain": subdomain,
                },
            })
            .json()) as Client[];
        console.log("Fetched clients:", response);
        return {
            data: response,
            total: response.length,
        };
    };

    const handleCreateClient = () => {
        setSelectedClientData({});
        setIsClientModalOpen(true);
    };

    const handleEditClient = (client: Client) => {
        setSelectedClientData(mapClientToFormValues(client));
        setIsClientModalOpen(true);
    };

    return (
        <>
            <DataTable
                fetchData={fetchClients}
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
                        header: "Address",
                        accessorFn: (row) => row.address.addressLine1,
                        id: "address",
                    },
                    {
                        header: "City",
                        accessorFn: (row) => row.address.city,
                        id: "city",
                    },
                    {
                        header: "Zip Code",
                        accessorFn: (row) => row.address.zip,
                        id: "zip",
                    },
                    {
                        header: "Status",
                        accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
                        id: "status",
                    },
                ]}
                onRowClick={handleEditClient}
                actionButton={{
                    label: "Create Client",
                    onClick: handleCreateClient,
                }}
            />
            <ClientModal
                open={isClientModalOpen}
                onOpenChange={setIsClientModalOpen}
                defaultValues={selectedClientData}
            />
        </>
    );
}
