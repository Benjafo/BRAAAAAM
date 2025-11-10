import { DataTable } from "@/components/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import type { RecurringUnavailabilityFormValues } from "../form/recurringUnavailabilityForm";
import type { TempUnavailabilityFormValues } from "../form/tempUnavailabilityForm";
import UnavailabilityModal from "../modals/unavailablilityModal";

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
};

const ORG_ID = "braaaaam"; // Hardcoded for now

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
    }>({});
    const [refreshKey, setRefreshKey] = useState(0);
    const userId = useAuthStore((s) => s.user)?.id;

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchUnavailability = async (params: Record<string, unknown>) => {
        console.log("Using params:", params);

        if (!userId) {
            return { data: [], total: 0 };
        }

        const blocks: UnavailabilityBlock[] = await http
            .get(`o/${ORG_ID}/users/${userId}/unavailability`, {
                headers: {
                    "x-org-subdomain": ORG_ID,
                },
            })
            .json();

        return {
            data: blocks,
            total: blocks.length,
        };
    };

    const handleCreateUnavailability = () => {
        setSelectedUnavailability({});
        setIsModalOpen(true);
    };

    const handleEditUnavailability = (block: UnavailabilityBlock) => {
        const formValues = mapBlockToFormValues(block);
        setSelectedUnavailability(formValues);
        setIsModalOpen(true);
    };

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchUnavailability}
                columns={[
                    {
                        header: "Date",
                        accessorFn: (row) => {
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
                        accessorFn: (row) => {
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
                        accessorFn: (row) => {
                            if (row.isRecurring) {
                                return row.recurringDayOfWeek || "N/A";
                            }
                            const isMultiDay = row.startDate !== row.endDate;
                            if (isMultiDay) {
                                return "N/A";
                            }
                            return getDayOfWeek(row.startDate);
                        },
                        id: "dayOfWeek",
                    },
                    {
                        header: "Recurring",
                        accessorFn: (row) => (row.isRecurring ? "Yes" : "No"),
                        id: "recurring",
                    },
                    {
                        header: "Multi-Day",
                        accessorFn: (row) => {
                            if (row.isRecurring) {
                                return "No";
                            }
                            return row.startDate !== row.endDate ? "Yes" : "No";
                        },
                        id: "multiDay",
                    },
                    {
                        header: "Reason",
                        accessorKey: "reason",
                        cell: ({ getValue }) => getValue() || "N/A",
                    },
                ]}
                onRowClick={handleEditUnavailability}
                actionButton={{
                    label: "Add Unavailability",
                    onClick: handleCreateUnavailability,
                }}
                usePagination={true}
            />
            <UnavailabilityModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultTab={selectedUnavailability.defaultTab}
                tempInitial={selectedUnavailability.temp}
                recurringInitial={selectedUnavailability.recurring}
                onSuccess={() => {
                    handleRefresh();
                    setIsModalOpen(false);
                }}
            />
        </>
    );
}
