import { DataTable } from "@/components/dataTable";

type Ride = {
    date: string;
    time: string;
    clientName: string;
    destinationAddress: string;
    dispatcherName: string;
    status: "unassigned" | "scheduled" | "cancelled" | "completed" | "withdrawn";
};

const API_RIDES_ENDPOINT = `${import.meta.env.BASE_URL}/dummy/rides`; //TODO fix this

export function RidesTable() {
    const fetchRides = async (params: URLSearchParams) => {
        const response = await fetch(`${API_RIDES_ENDPOINT}?${params}`);
        const res = await response.json();
        return res;
    };

    const handleEditRide = (ride: Ride) => {
        console.log("Ride selected:", ride);
    };

    return (
        <DataTable
            fetchData={fetchRides}
            columns={[
                { header: "Date", accessorKey: "date" },
                { header: "Time", accessorKey: "time" },
                { header: "Client", accessorKey: "clientName" },
                { header: "Destination", accessorKey: "destinationAddress" },
                { header: "Dispatcher", accessorKey: "dispatcherName" },
                { header: "Status", accessorKey: "status" },
            ]}
            onRowClick={handleEditRide}
        />
    );
}
