import { DataTable } from "@/components/dataTable";

type Ride = {
    date: string;
    time: string;
    clientName: string;
    destinationAddress: string;
    dispatcherName: string;
    status: "unassigned" | "scheduled" | "cancelled" | "completed" | "withdrawn";
};

const API_RIDES_ENDPOINT = `http://localhost:3000/dummy/rides`; //TODO fix this

export function RidesTable() {
    const fetchRides = async (params: Record<string, any>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });
        const response = await fetch(`${API_RIDES_ENDPOINT}?${searchParams}`);
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
