import { DataTable } from "@/components/dataTable";

type User = {
    name: string;
    phoneNumber: string;
    email: string;
    address: string;
    city: string;
    zip: number;
    role: "driver" | "dispatcher" | "admin";
};

const API_USERS_ENDPOINT = `http://localhost:3000/dummy/users`; //TODO fix this

export function UsersTable() {
    const fetchUsers = async (params: Record<string, any>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });
        const response = await fetch(`${API_USERS_ENDPOINT}?${searchParams}`);
        const res = await response.json();
        return res;
    };

    const handleEditUser = (user: User) => {
        console.log("User selected:", user);
    };

    return (
        <DataTable
            fetchData={fetchUsers}
            columns={[
                { header: "Name", accessorKey: "name" },
                { header: "Phone", accessorKey: "phoneNumber" },
                { header: "Email", accessorKey: "email" },
                { header: "Address", accessorKey: "address" },
                { header: "City", accessorKey: "city" },
                { header: "Zip Code", accessorKey: "zip" },
                { header: "Role", accessorKey: "role" },
            ]}
            onRowClick={handleEditUser}
        />
    );
}
