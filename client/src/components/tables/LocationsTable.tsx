import { DataTable } from "@/components/common/dataTable";
import LocationModal from "@/components/modals/locationModal";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";

type Location = {
    id: string;
    aliasName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    addressValidated: boolean;
    createdAt: string;
    updatedAt: string;
};

export function LocationsTable() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const hasUpdatePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.SETTINGS_UPDATE));
    const fetchLocations = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });
        const response = await http
            .get(`o/settings/locations?${searchParams}`)
            .json<{ page: number; pageSize: number; total: number; results: Location[] }>();

        return {
            data: response.results,
            total: response.total,
        };
    };

    const defaultValues = selectedLocation
        ? {
              id: selectedLocation.id,
              locationName: selectedLocation.aliasName,
              address: selectedLocation.addressLine1,
              address2: selectedLocation.addressLine2,
              city: selectedLocation.city,
              state: selectedLocation.state,
              zip: selectedLocation.zip,
              country: selectedLocation.country,
          }
        : {};

    const handleEditLocation = (location: Location) => {
        setSelectedLocation(location);
        setIsModalOpen(true);
    };

    const handleCreateLocation = () => {
        setSelectedLocation(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLocation(null);
    };

    return (
        <>
            <DataTable
                fetchData={fetchLocations}
                columns={[
                    { header: "Name", accessorKey: "aliasName" },
                    { header: "Address", accessorKey: "addressLine1" },
                    { header: "Address 2", accessorKey: "addressLine2" },
                    { header: "City", accessorKey: "city" },
                    { header: "State", accessorKey: "state" },
                    { header: "Zip Code", accessorKey: "zip" },
                ]}
                onRowClick={handleEditLocation}
                actionButton={
                    hasUpdatePermission
                        ? {
                              label: "New Location Alias",
                              onClick: handleCreateLocation,
                          }
                        : null
                }
            />

            <LocationModal
                open={isModalOpen}
                onOpenChange={handleCloseModal}
                defaultValues={defaultValues}
            />
        </>
    );
}
