import { DataTable } from "@/components/common/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import VolunteerRecordModal from "../modals/VolunteerRecordModal";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type VolunteerRecord = {
    id: string;
    userId: string;
    date: string;
    hours: string;
    miles: number | null;
    description: string;
    createdAt: string;
    updatedAt: string;
    volunteer: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
};

export function VolunteerRecordsTable() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const hasCreatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.OWN_VOLUNTEER_RECORDS_CREATE)
    );
    const hasOwnUpdatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.OWN_VOLUNTEER_RECORDS_UPDATE)
    );
    const hasAllUpdatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_VOLUNTEER_RECORDS_UPDATE)
    );
    const hasOwnDeletePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.OWN_VOLUNTEER_RECORDS_DELETE)
    );
    const hasAllDeletePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_VOLUNTEER_RECORDS_DELETE)
    );
    const hasAllReadPermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_VOLUNTEER_RECORDS_READ)
    );

    const currentUserId = useAuthStore((s) => s.user?.id);

    // Check if user has any update permission (for onRowClick)
    const hasAnyUpdatePermission = hasOwnUpdatePermission || hasAllUpdatePermission;
    // Check if user has any delete permission (for rowActions)
    const hasAnyDeletePermission = hasOwnDeletePermission || hasAllDeletePermission;

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchVolunteerRecords = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        const response = await http
            .get(`o/volunteer-records?${searchParams}`)
            .json<{ results: VolunteerRecord[]; total: number }>();

        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateRecord = () => {
        setSelectedRecordId(null);
        setIsModalOpen(true);
    };

    const handleEditRecord = (record: VolunteerRecord) => {
        setSelectedRecordId(record.id);
        setIsModalOpen(true);
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (!confirm("Are you sure you want to delete this record?")) {
            return;
        }

        try {
            await http.delete(`o/volunteer-records/${recordId}`);
            toast.success("Record deleted successfully");
            handleRefresh();
        } catch (error) {
            console.error("Failed to delete record:", error);
            toast.error("Failed to delete record. Please try again.");
        }
    };

    const canEditRecord = (record: VolunteerRecord) => {
        return (
            hasAllUpdatePermission ||
            (hasOwnUpdatePermission && record.volunteer?.id === currentUserId)
        );
    };

    const canDeleteRecord = (record: VolunteerRecord) => {
        return (
            hasAllDeletePermission ||
            (hasOwnDeletePermission && record.volunteer?.id === currentUserId)
        );
    };

    // TODO fix any type errors here - this was the only way I could get this file to build
    // Define columns based on permissions
    const columns = [
        {
            header: "Date",
            accessorKey: "date",
            id: "date",
            cell: ({ getValue }: any) => {
                const date = new Date(getValue() as string);
                return date.toLocaleDateString();
            },
        },
        // Show volunteer name only if user has ALL permission
        ...(hasAllReadPermission
            ? [
                  {
                      header: "Volunteer",
                      accessorFn: (row: VolunteerRecord) =>
                          row.volunteer
                              ? `${row.volunteer.firstName} ${row.volunteer.lastName}`
                              : "Unknown",
                      id: "volunteer",
                  },
              ]
            : []),
        {
            header: "Hours",
            accessorKey: "hours",
            id: "hours",
            cell: ({ getValue }: any) => {
                const hours = parseFloat(getValue() as string);
                return hours.toFixed(2);
            },
        },
        {
            header: "Miles",
            accessorKey: "miles",
            id: "miles",
            cell: ({ getValue }: any) => {
                const miles = getValue() as number | null;
                return miles !== null ? miles.toString() : "—";
            },
        },
        {
            header: "Description",
            accessorKey: "description",
            id: "description",
            cell: ({ getValue }: any) => {
                const description = getValue() as string | null;
                if (!description) return "—";
                return description.length > 50 ? `${description.substring(0, 50)}...` : description;
            },
        },
    ];

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchVolunteerRecords}
                columns={columns}
                actionButton={
                    hasCreatePermission
                        ? {
                              label: "Report Hours & Miles",
                              onClick: handleCreateRecord,
                          }
                        : undefined
                }
                searchPlaceholder="Search records..."
                selectable={false}
                onRowClick={
                    hasAnyUpdatePermission
                        ? (record: VolunteerRecord) => {
                              if (canEditRecord(record)) {
                                  handleEditRecord(record);
                              }
                          }
                        : undefined
                }
                rowActions={
                    hasAnyDeletePermission
                        ? (record: VolunteerRecord) => {
                              const canDelete = canDeleteRecord(record);

                              if (!canDelete) {
                                  return null;
                              }

                              return (
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
                                                  handleDeleteRecord(record.id);
                                              }}
                                              className="text-destructive"
                                          >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              );
                          }
                        : undefined
                }
            />
            <VolunteerRecordModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                recordId={selectedRecordId}
                onSuccess={handleRefresh}
            />
        </>
    );
}
