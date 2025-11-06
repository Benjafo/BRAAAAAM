import { DataTable } from "@/components/dataTable";
import CustomFormModal from "@/components/modals/customFormModal";
import { type CustomForm } from "@/lib/types";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";

export default function CustomFormsTable() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const orgID = "braaaaam"; // TODO: Get from context

    const fetchForms = async (_params: Record<string, unknown>) => {
        const response = await http.get(`o/${orgID}/custom-forms`).json<CustomForm[]>();

        return {
            data: response,
            total: response.length,
        };
    };

    const handleCreate = () => {
        setSelectedForm(null);
        setIsModalOpen(true);
    };

    const handleRowClick = (form: CustomForm) => {
        setSelectedForm(form);
        setIsModalOpen(true);
    };

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchForms}
                columns={[
                    {
                        header: "Name",
                        accessorKey: "name",
                    },
                    {
                        header: "Description",
                        accessorKey: "description",
                        cell: ({ getValue }) => getValue() || "—",
                    },
                    {
                        header: "Applies To",
                        accessorKey: "targetEntity",
                        cell: ({ getValue }) => {
                            const value = getValue() as string;
                            return value.charAt(0).toUpperCase() + value.slice(1) + "s";
                        },
                    },
                    {
                        header: "Fields",
                        accessorKey: "fields",
                        cell: ({ getValue }) => {
                            const fields = getValue() as any[];
                            return fields?.length || 0;
                        },
                    },
                    {
                        header: "Status",
                        accessorKey: "isActive",
                        cell: ({ getValue }) => (getValue() ? "Active" : "Inactive"),
                    },
                ]}
                showSearch={true}
                actionButton={{
                    label: "New Custom Form",
                    onClick: handleCreate,
                }}
                onRowClick={handleRowClick}
            />

            <CustomFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultValues={selectedForm || undefined}
                onSuccess={() => setRefreshKey((k) => k + 1)}
            />
        </>
    );
}
