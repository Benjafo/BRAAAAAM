import { DataTable } from "@/components/dataTable";

type AuditLogEntry = {
    user: string;
    timestamp: string;
    eventDetails: string;
};

const API_AUDIT_LOG_ENDPOINT = `http://localhost:3000/dummy/audit-log`; //TODO fix this

export function AuditLogTable() {
    const fetchAuditLogEntries = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });
        const response = await fetch(`${API_AUDIT_LOG_ENDPOINT}?${searchParams}`);
        const res = await response.json();
        return res;
    };

    const handleEditAuditLogEntry = (auditLogEntry: AuditLogEntry) => {
        console.log("Audit log entry selected:", auditLogEntry);
    };

    return (
        <DataTable
            fetchData={fetchAuditLogEntries}
            columns={[
                { header: "User", accessorKey: "user" },
                { header: "Date & Time", accessorKey: "timestamp" },
                { header: "Event Details", accessorKey: "eventDetails" },
            ]}
            onRowClick={handleEditAuditLogEntry}
        />
    );
}
