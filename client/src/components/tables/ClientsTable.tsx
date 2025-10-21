import { DataTable } from "@/components/dataTable";

type Client = {
    name: string;
    phoneNumber: string;
    address: string;
    city: string;
    zip: number;
    status: "active" | "inactive";
};

const API_CLIENTS_ENDPOINT = `${import.meta.env.BASE_URL}/dummy/clients`; //TODO fix this

export function ClientsTable() {
    const fetchClients = async (params: URLSearchParams) => {
        const response = await fetch(`${API_CLIENTS_ENDPOINT}?${params}`);
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
