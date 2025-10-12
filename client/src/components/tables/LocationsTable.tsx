import { DataTable } from "@/components/dataTable";

type Location = {
    name: string;
    address: string;
    city: string;
    zip: number;
};

const API_LOCATIONS_ENDPOINT = `http://localhost:3000/dummy/locations`; //TODO fix this

export function LocationsTable() {
    const fetchLocations = async (params: URLSearchParams) => {
        const response = await fetch(`${API_LOCATIONS_ENDPOINT}?${params}`);
        const res = await response.json();
        return res;
    };

    const handleEditLocation = (location: Location) => {
        console.log("Location selected:", location);
    };

    return (
        <DataTable
            fetchData={fetchLocations}
            columns={[
                { header: "Name", accessorKey: "name" },
                { header: "Address", accessorKey: "address" },
                { header: "City", accessorKey: "city" },
                { header: "Zip Code", accessorKey: "zip" },
            ]}
            onRowClick={handleEditLocation}
        />
    );
}
