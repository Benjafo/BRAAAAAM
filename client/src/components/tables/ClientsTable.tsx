import { DataTable } from "@/components/common/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { parseLocalDate } from "@/lib/utils";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { ClientFormValues } from "../form/clientForm";
import ClientModal from "../modals/clientModal";

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
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelationship: string | null;
    notes: string | null;
    pickupInstructions: string | null;
    mobilityEquipment?: string[] | null;
    mobilityEquipmentOther?: string | null;
    vehicleTypes?: string[] | null;
    hasOxygen?: boolean | null;
    hasServiceAnimal?: boolean | null;
    serviceAnimalDescription?: string | null;
    otherLimitations?: string[] | null;
    otherLimitationsOther?: string | null;
    customFields?: Record<string, any>;
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
function mapClientToFormValues(
    client: Client & {
        okToTextPrimary?: boolean;
        okToTextSecondary?: boolean;
        secondaryPhone?: string | null;
        secondaryPhoneIsCell?: boolean;
        isPermanent?: boolean;
        inactiveSince?: string | null;
    }
): Partial<ClientFormValues> & { id: string } {
    return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        clientEmail: client.email || "",
        primaryPhoneNumber: client.phone?.replace("+1", "") || "",
        primaryPhoneIsCellPhone: client.phoneIsCell,
        okToTextPrimaryPhone: client.okToTextPrimary || false,
        secondaryPhoneNumber: client.secondaryPhone?.replace("+1", "") || "",
        secondaryPhoneIsCellPhone: client.secondaryPhoneIsCell || false,
        okToTextSecondaryPhone: client.okToTextSecondary || false,
        birthMonth: client.birthMonth ? client.birthMonth.toString().padStart(2, "0") : "",
        birthYear: String(client.birthYear),
        clientGender: client.gender as "Male" | "Female" | "Other",
        contactPref:
            client.contactPreference.charAt(0).toUpperCase() + client.contactPreference.slice(1),
        livingAlone: client.livesAlone ? "Lives alone" : "Does not live alone",
        emergencyContactName: client.emergencyContactName || "",
        emergencyContactPhone: client.emergencyContactPhone?.replace("+1", "") || "",
        emergencyContactRelationship: client.emergencyContactRelationship || "",
        notes: client.notes || "",
        pickupInstructions: client.pickupInstructions || "",
        mobilityEquipment: (client.mobilityEquipment as any) || [],
        mobilityEquipmentOther: client.mobilityEquipmentOther || "",
        vehicleTypes: (client.vehicleTypes as any) || [],
        hasOxygen: client.hasOxygen || false,
        hasServiceAnimal: client.hasServiceAnimal || false,
        serviceAnimalDescription: client.serviceAnimalDescription || "",
        otherLimitations: (client.otherLimitations as any) || [],
        otherLimitationsOther: client.otherLimitationsOther || "",
        homeAddress: client.address.addressLine1,
        homeAddress2: client.address.addressLine2 || "",
        city: client.address.city,
        state: client.address.state,
        zipCode: client.address.zip,
        customFields: client.customFields || {},
        clientStatus: client.isPermanent ? "Permanent client" : "Temporary client",
        status: client.isActive ? "Active" : "Inactive",
        inactiveSince: parseLocalDate(client.inactiveSince),
    };
}

export function ClientsTable() {
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [selectedClientData, setSelectedClientData] = useState<
        Partial<ClientFormValues> & { id?: string }
    >({});
    const [refreshKey, setRefreshKey] = useState(0);
    const hasCreatePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.CLIENTS_CREATE));
    const hasEditPermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.CLIENTS_UPDATE));
    const hasReadPermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.CLIENTS_READ));

    // hacky fix to force refresh for the custom fields
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchClients = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        const response = await http
            .get(`o/clients?${searchParams}`)
            .json<{ results: Client[]; total: number }>();
        console.log("Fetched clients:", response);

        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateClient = () => {
        setSelectedClientData({});
        setIsViewMode(false);
        setIsClientModalOpen(true);
    };

    const handleEditClient = (client: Client) => {
        setSelectedClientData(mapClientToFormValues(client));
        setIsViewMode(!hasEditPermission); // View mode if no edit permission
        setIsClientModalOpen(true);
    };

    return (
        <>
            <DataTable
                key={refreshKey}
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
                onRowClick={hasReadPermission ? handleEditClient : undefined}
                actionButton={
                    hasCreatePermission
                        ? {
                              label: "Create Client",
                              onClick: handleCreateClient,
                          }
                        : undefined
                }
            />
            <ClientModal
                open={isClientModalOpen}
                onOpenChange={setIsClientModalOpen}
                defaultValues={selectedClientData}
                onSuccess={handleRefresh}
                viewMode={isViewMode}
            />
        </>
    );
}
