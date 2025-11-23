import { DataTable } from "@/components/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { RecurringUnavailabilityFormValues } from "../form/recurringUnavailabilityForm";
import type { TempUnavailabilityFormValues } from "../form/tempUnavailabilityForm";
import UnavailabilityModal from "../modals/unavailablilityModal";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

type UnavailabilityBlock = {
    id: string;
    userId: string;
    startDate: string; // e.g., '2025-10-15'
    startTime: string | null; // e.g., '08:30:00'
    endDate: string; // e.g., '2025-10-15'
    endTime: string | null; // e.g., '17:30:00'
    isAllDay: boolean;
    reason: string | null;
    isRecurring: boolean;
    recurringDayOfWeek: string | null; // e.g., 'Monday'
    createdAt: string;
    updatedAt: string;
    userFirstName?: string; // Only present when fetching all unavailability
    userLastName?: string; // Only present when fetching all unavailability
    userEmail?: string; // Only present when fetching all unavailability
};

// Helper function to format date
const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Helper function to format time
const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
};

// Helper function to get day of week from date
const getDayOfWeek = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "long" });
};

// Map unavailability block to form values
function mapBlockToFormValues(block: UnavailabilityBlock): {
    temp?: Partial<TempUnavailabilityFormValues> & { id: string };
    recurring?: Partial<RecurringUnavailabilityFormValues> & { id: string };
    defaultTab: "temporary" | "recurring";
} {
    if (block.isRecurring) {
        return {
            recurring: {
                id: block.id,
                day: block.recurringDayOfWeek as
                    | "Monday"
                    | "Tuesday"
                    | "Wednesday"
                    | "Thursday"
                    | "Friday"
                    | "Saturday"
                    | "Sunday",
                allDay: block.isAllDay,
                startTime: block.startTime || undefined,
                endTime: block.endTime || undefined,
                reason: block.reason || "",
            },
            defaultTab: "recurring",
        };
    } else {
        const isMultiDay = block.startDate !== block.endDate;
        const startDate = new Date(block.startDate + "T00:00:00");
        const endDate = new Date(block.endDate + "T00:00:00");

        return {
            temp: {
                id: block.id,
                multiDay: isMultiDay,
                allDay: block.isAllDay,
                startDate: startDate,
                endDate: isMultiDay ? endDate : undefined,
                startTime: block.startTime || undefined,
                endTime: block.endTime || undefined,
                reason: block.reason || "",
            },
            defaultTab: "temporary",
        };
    }
}

export function UnavailabilityTable() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUnavailability, setSelectedUnavailability] = useState<{
        temp?: Partial<TempUnavailabilityFormValues> & { id?: string };
        recurring?: Partial<RecurringUnavailabilityFormValues> & { id?: string };
        defaultTab?: "temporary" | "recurring";
        targetUserId?: string;
        targetUserName?: string;
    }>({});
    const [refreshKey, setRefreshKey] = useState(0);
    const userId = useAuthStore((s) => s.user)?.id;

    // Permission checks
    const hasViewAllPermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_UNAVAILABILITY_READ)
    );
    const hasCreatePermission = useAuthStore((s) =>
        s.hasAnyPermission([
            PERMISSIONS.OWN_UNAVAILABILITY_CREATE,
            PERMISSIONS.ALL_UNAVAILABILITY_CREATE,
        ])
    );
    const hasUpdatePermission = useAuthStore((s) =>
        s.hasAnyPermission([
            PERMISSIONS.OWN_UNAVAILABILITY_UPDATE,
            PERMISSIONS.ALL_UNAVAILABILITY_UPDATE,
        ])
    );
    const hasDeletePermission = useAuthStore((s) =>
        s.hasAnyPermission([
            PERMISSIONS.OWN_UNAVAILABILITY_DELETE,
            PERMISSIONS.ALL_UNAVAILABILITY_DELETE,
        ])
    );

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchUnavailability = async (params: Record<string, unknown>) => {
        console.log("Using params:", params);

        // If user has permission to view all unavailability, fetch from /users/unavailability
        // Otherwise, fetch only their own from /users/:userId/unavailability
        const endpoint = hasViewAllPermission
            ? `o/users/unavailability`
            : `o/users/${userId}/unavailability`;

        if (!hasViewAllPermission && !userId) {
            return { data: [], total: 0 };
        }

        // Build search params
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        // Both endpoints now support pagination
        const response = await http
            .get(`${endpoint}?${searchParams}`)
            .json<{ results: UnavailabilityBlock[]; total: number }>();
        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleCreateUnavailability = () => {
        setSelectedUnavailability({});
        setIsModalOpen(true);
    };

    const handleEditUnavailability = (block: UnavailabilityBlock) => {
        const formValues = mapBlockToFormValues(block);

        // Include userId and userName for admin/dispatcher view
        const userName =
            block.userFirstName && block.userLastName
                ? `${block.userFirstName} ${block.userLastName}`
                : undefined;

        setSelectedUnavailability({
            ...formValues,
            targetUserId: block.userId,
            targetUserName: userName,
        });
        setIsModalOpen(true);
    };

    const handleDeleteUnavailability = async (block: UnavailabilityBlock) => {
        if (!confirm("Are you sure you want to delete this unavailability record?")) {
            return;
        }

        try {
            await http.delete(`o/users/${block.userId}/unavailability/${block.id}`);
            toast.success("Unavailability deleted successfully");
            handleRefresh();
        } catch (error) {
            console.error("Failed to delete unavailability:", error);
            toast.error("Failed to delete unavailability");
        }
    };

    // Build columns array dynamically based on permissions
    const columns = [
        // Add User column only if viewing all unavailability
        ...(hasViewAllPermission
            ? [
                  {
                      header: "User",
                      accessorFn: (row: UnavailabilityBlock) => {
                          if (row.userFirstName && row.userLastName) {
                              return `${row.userFirstName} ${row.userLastName}`;
                          }
                          return row.userEmail || "Unknown";
                      },
                      id: "user",
                  },
              ]
            : []),
        {
            header: "Date",
            accessorFn: (row: UnavailabilityBlock) => {
                if (row.isRecurring) {
                    return `Every ${row.recurringDayOfWeek}`;
                }
                const isMultiDay = row.startDate !== row.endDate;
                if (isMultiDay) {
                    return `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`;
                }
                return formatDate(row.startDate);
            },
            id: "date",
        },
        {
            header: "Time",
            accessorFn: (row: UnavailabilityBlock) => {
                if (row.isAllDay) {
                    return "All Day";
                }
                if (row.startTime && row.endTime) {
                    return `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`;
                }
                return "N/A";
            },
            id: "time",
        },
        {
            header: "Day of Week",
            accessorFn: (row: UnavailabilityBlock) => {
                if (row.isRecurring) {
                    return row.recurringDayOfWeek || "N/A";
                }
                const isMultiDay = row.startDate !== row.endDate;
                if (isMultiDay) {
                    return "Multiple Days";
                }
                return getDayOfWeek(row.startDate);
            },
            id: "dayOfWeek",
        },
        {
            header: "Recurring",
            accessorFn: (row: UnavailabilityBlock) => (row.isRecurring ? "Yes" : "No"),
            id: "recurring",
        },
        {
            header: "Multi-Day",
            accessorFn: (row: UnavailabilityBlock) => {
                if (row.isRecurring) {
                    return "No";
                }
                return row.startDate !== row.endDate ? "Yes" : "No";
            },
            id: "multiDay",
        },
        {
            header: "Reason",
            accessorFn: (row: UnavailabilityBlock) => row.reason || "N/A",
            id: "reason",
        },
    ];

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchUnavailability}
                columns={columns}
                onRowClick={hasUpdatePermission ? handleEditUnavailability : undefined}
                rowActions={
                    hasDeletePermission
                        ? (block: UnavailabilityBlock) => (
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
                                              handleDeleteUnavailability(block);
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
                              label: "Add Unavailability",
                              onClick: handleCreateUnavailability,
                          }
                        : undefined
                }
                usePagination={true}
            />
            <UnavailabilityModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultTab={selectedUnavailability.defaultTab}
                tempInitial={selectedUnavailability.temp}
                recurringInitial={selectedUnavailability.recurring}
                targetUserId={selectedUnavailability.targetUserId}
                targetUserName={selectedUnavailability.targetUserName}
                onSuccess={() => {
                    handleRefresh();
                    setIsModalOpen(false);
                }}
            />
        </>
    );
}
