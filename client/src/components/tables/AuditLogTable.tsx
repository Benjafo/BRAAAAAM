import { DataTable } from "@/components/dataTable";

type AuditLogEntry = {
    user: string;
    timestamp: string;
    eventDetails: string;
};

const API_AUDIT_LOG_ENDPOINT = `${import.meta.env.BASE_URL}/dummy/audit-log`; //TODO fix this

export function AuditLogTable() {
    const fetchAuditLogEntries = async (params: URLSearchParams) => {
        const response = await fetch(`${API_AUDIT_LOG_ENDPOINT}?${params}`);
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
