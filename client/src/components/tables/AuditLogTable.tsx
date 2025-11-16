import { DataTable } from "@/components/dataTable";
import AuditLogModal from "@/components/modals/auditLogModal";
import { http } from "@/services/auth/serviceResolver";
import type { AuditLogEntry, AuditLogModalEntry } from "@/types/org/auditlog";
import { useState } from "react";

export function AuditLogTable() {
    const [selectedEntry, setSelectedEntry] = useState<AuditLogModalEntry | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAuditLogEntries = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });
        const response = await http
            .get(`o/audit-logs`, {
                searchParams: searchParams,
            })
            .json<AuditLogEntry[]>();

        const fullResponse = response.map((entry) => {
            // Parse timestamp
            const timestamp = new Date(entry.audit_logs.createdAt);
            const date = timestamp.toISOString().split("T")[0];
            const time = timestamp.toTimeString().split(" ")[0];

            // Format action type
            const actionParts = entry.audit_logs.actionType.split(".");
            const action = actionParts[actionParts.length - 1];
            const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);

            // Format object type
            const objectType = entry.audit_logs.objectType;
            const formattedObjectType =
                objectType && objectType.charAt(0).toUpperCase() + objectType.slice(1);

            return {
                ...entry.audit_logs,
                userName: entry.users
                    ? `${entry.users.firstName ?? ""} ${entry.users.lastName ?? ""}`.trim()
                    : null,
                actionDetails: JSON.stringify(entry.audit_logs.actionDetails, null, 2),
                date,
                time,
                formattedObjectType,
                formattedAction,
            };
        });

        return {
            data: fullResponse,
            total: fullResponse.length,
        };
    };

    const handleEditAuditLogEntry = (auditLogEntry: AuditLogModalEntry) => {
        setSelectedEntry(auditLogEntry);
        setIsModalOpen(true);
    };

    return (
        <>
            <DataTable
                fetchData={fetchAuditLogEntries as any}
                columns={[
                    { header: "Date", accessorKey: "date" },
                    { header: "Time", accessorKey: "time" },
                    { header: "User", accessorKey: "userName" },
                    { header: "Object Type", accessorKey: "formattedObjectType" },
                    { header: "Action", accessorKey: "formattedAction" },
                    { header: "Action Message", accessorKey: "actionMessage" },
                ]}
                onRowClick={handleEditAuditLogEntry}
            />

            <AuditLogModal
                auditLogEntry={selectedEntry}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    );
}
