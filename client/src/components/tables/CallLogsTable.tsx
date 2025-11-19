import { DataTable } from "@/components/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CallLogFormValues } from "../form/CallLogForm";
import CallLogModal from "../modals/callLogModal";
import { Button } from "../ui/button";

type CallLog = {
    id: string;
    date: string;
    time: string | null;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    callType: string;
    message: string | null;
    notes: string | null;
    createdByUserId: string;
    createdByUserName: string;
    createdAt: string;
    updatedAt: string;
};

function mapCallLogToFormValues(callLog: CallLog): Partial<CallLogFormValues> & { id: string } {
    return {
        id: callLog.id,
        date: callLog.date,
        time: callLog.time || "",
        firstName: callLog.firstName,
        lastName: callLog.lastName,
        phoneNumber: callLog.phoneNumber?.replace("+1", "") || "",
        callType: callLog.callType,
        message: callLog.message || "",
        notes: callLog.notes || "",
    };
}

export function CallLogsTable() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCallLog, setSelectedCallLog] = useState<
        Partial<CallLogFormValues> & { id?: string }
    >({});
    const [refreshKey, setRefreshKey] = useState(0);

    const hasCreatePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.CALL_LOGS_CREATE));
    const hasUpdatePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.CALL_LOGS_UPDATE));
    const hasDeletePermission = useAuthStore((s) => s.hasPermission(PERMISSIONS.CALL_LOGS_DELETE));

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchCallLogs = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        const response = await http
            .get(`o/call-logs?${searchParams}`)
            .json<{ data: CallLog[]; total: number }>();

        return {
            data: response.data,
            total: response.total,
        };
    };

    const handleCreate = () => {
        setSelectedCallLog({});
        setIsModalOpen(true);
    };

    const handleEdit = (callLog: CallLog) => {
        if (hasUpdatePermission) {
            setSelectedCallLog(mapCallLogToFormValues(callLog));
            setIsModalOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete this call log?`)) {
            return;
        }

        try {
            await http.delete(`o/call-logs/${id}`);
            toast.success("Call log deleted successfully");
            handleRefresh();
        } catch (error) {
            console.error("Failed to delete call log:", error);
            toast.error("Failed to delete call log");
        }
    };

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchCallLogs}
                columns={[
                    {
                        header: "Date",
                        accessorKey: "date",
                        cell: ({ getValue }) => {
                            const date = getValue() as string;
                            return new Date(date).toLocaleDateString();
                        },
                    },
                    {
                        header: "Time",
                        accessorKey: "time",
                        cell: ({ getValue }) => {
                            const time = getValue() as string | null;
                            return time || "N/A";
                        },
                    },
                    {
                        header: "Caller Name",
                        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
                        id: "callerName",
                    },
                    {
                        header: "Phone Number",
                        accessorKey: "phoneNumber",
                    },
                    {
                        header: "Call Type",
                        accessorKey: "callType",
                    },
                ]}
                onRowClick={hasUpdatePermission ? handleEdit : undefined}
                rowActions={
                    hasDeletePermission
                        ? (callLog: CallLog) => (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Open menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDelete(callLog.id);
                                          }}
                                          className="text-destructive"
                                      >
                                          Delete
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          )
                        : undefined
                }
                actionButton={
                    hasCreatePermission
                        ? {
                              label: "Create Call Log",
                              onClick: handleCreate,
                          }
                        : undefined
                }
            />
            <CallLogModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultValues={selectedCallLog}
                onSuccess={handleRefresh}
            />
        </>
    );
}
