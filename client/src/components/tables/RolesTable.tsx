import { DataTable } from "@/components/dataTable";

type Role = {
    name: string;
};

const API_ROLES_ENDPOINT = `http://localhost:3000/dummy/roles`; //TODO fix this

export function RolesTable() {
    const fetchRoles = async (params: URLSearchParams) => {
        const response = await fetch(`${API_ROLES_ENDPOINT}?${params}`);
        const res = await response.json();
        return res;
    };

    const handleEditRole = (role: Role) => {
        console.log("Role selected:", role);
    };

    return (
        <DataTable
            fetchData={fetchRoles}
            columns={[{ header: "Name", accessorKey: "name" }]}
            onRowClick={handleEditRole}
            showFilters={false}
        />
    );
}
