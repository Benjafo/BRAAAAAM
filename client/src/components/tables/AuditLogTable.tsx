import { DataTable } from "@/components/dataTable";
import { http } from "@/services/auth/serviceResolver";

type AuditLogEntry = {
    audit_logs: {
        id: string;
        userId: string | null;
        objectId: string | null;
        objectType: string | null;
        actionType: string;
        actionMessage: string | null;
        actionDetails: Record<string, any>;
        createdAt: string;
    }
    users: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
    }
};

// const API_AUDIT_LOG_ENDPOINT = `http://localhost:3000/dummy/audit-log`; //TODO fix this
export function AuditLogTable() {
    const fetchAuditLogEntries = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });
        const response = await http.get(`o/audit-logs`, {
            searchParams: searchParams
        }).json<AuditLogEntry[]>();
        // const response = await fetch(`${API_AUDIT_LOG_ENDPOINT}?${searchParams}`);
        // const res = await response.json();

        const realResponse = response.map((entry) => ({
            ...entry.audit_logs,
            userName: entry.users ? `${entry.users.firstName ?? ""} ${entry.users.lastName ?? ""}`.trim() : null,
            actionDetails: JSON.stringify(entry.audit_logs.actionDetails, null, 2),
        }));

        return {
            data: realResponse,
            total: realResponse.length,
        };
    };

    const handleEditAuditLogEntry = (auditLogEntry: AuditLogEntry) => {
        console.log("Audit log entry selected:", auditLogEntry);
    };

    return (
        <DataTable
            fetchData={fetchAuditLogEntries as any}
            columns={[
                // { header: "User", accessorKey: "user" },
                // { header: "Date & Time", accessorKey: "timestamp" },
                // { header: "Event Details", accessorKey: "eventDetails" },
                // { header: "ID", accessorKey: "id" },
                { header: "User", accessorKey: "userName" },
                // { header: "User ID", accessorKey: "userId" },
                { header: "Object ID", accessorKey: "objectId" },
                { header: "Object Type", accessorKey: "objectType" },
                { header: "Action Type", accessorKey: "actionType" },
                { header: "Action Message", accessorKey: "actionMessage" },
                { header: "Action Details", accessorKey: "actionDetails" },
                { header: "Created At", accessorKey: "createdAt" },
            ]}
            onRowClick={handleEditAuditLogEntry}
        />
    );
}
