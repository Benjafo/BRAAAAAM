import { DataTable } from "@/components/dataTable";

type Client = {
    name: string;
    phoneNumber: string;
    address: string;
    city: string;
    zip: number;
    status: "active" | "inactive";
};

const API_CLIENTS_ENDPOINT = `http://localhost:3000/dummy/clients`; //TODO fix this

export function ClientsTable() {
    const fetchClients = async (params: Record<string, any>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });
        const response = await fetch(`${API_CLIENTS_ENDPOINT}?${searchParams}`);
        const res = await response.json();
        return res;
    };

    const handleEditClient = (client: Client) => {
        console.log("Client selected:", client);
    };

    return (
        <DataTable
            fetchData={fetchClients}
            columns={[
                { header: "Name", accessorKey: "name" },
                { header: "Phone", accessorKey: "phoneNumber" },
                { header: "Address", accessorKey: "address" },
                { header: "City", accessorKey: "city" },
                { header: "Zip Code", accessorKey: "zip" },
                { header: "Status", accessorKey: "status" },
            ]}
            onRowClick={handleEditClient}
        />
    );
}
