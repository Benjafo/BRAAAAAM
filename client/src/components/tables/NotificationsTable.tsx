import { DataTable } from "@/components/dataTable";
import { useAuthStore } from "@/components/stores/authStore";
import { PERMISSIONS } from "@/lib/permissions";
import { http } from "@/services/auth/serviceResolver";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import NotificationDetailsModal from "../modals/notificationDetailsModal";

type Notification = {
    messageId: string;
    status: "pending" | "sent" | "failed" | "cancelled";
    priority: "normal" | "immediate";
    subject: string;
    body: string;
    sentAt: string | null;
    createdAt: string;
    scheduledSendTime: string | null;
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    appointmentId: string | null;
    appointmentDate: string | null;
    appointmentTime: string | null;
    clientName: string | null;
    pickupAddress: string | null;
    dropoffAddress: string | null;
};

export function NotificationsTable() {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const hasUpdatePermission = useAuthStore((s) =>
        s.hasPermission(PERMISSIONS.ALL_NOTIFICATIONS_UPDATE)
    );

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const fetchNotifications = async (params: Record<string, unknown>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.set(key, String(value));
            }
        });

        const response = await http
            .get(`o/notifications?${searchParams}`)
            .json<{ results: Notification[]; total: number }>();

        return {
            data: response.results,
            total: response.total,
        };
    };

    const handleRowClick = (notification: Notification) => {
        setSelectedNotification(notification);
        setIsDetailsModalOpen(true);
    };

    const handleCancelNotification = async (messageId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click

        try {
            await http.put(`o/notifications/${messageId}`).json();
            toast.success("Notification cancelled successfully");
            handleRefresh();
        } catch (error) {
            console.error("Failed to cancel notification:", error);
            toast.error("Failed to cancel notification");
        }
    };

    const getStatusBadge = (status: Notification["status"]) => {
        const variants = {
            pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
            sent: "bg-green-100 text-green-800 hover:bg-green-100",
            failed: "bg-red-100 text-red-800 hover:bg-red-100",
            cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        };

        return (
            <Badge variant="secondary" className={variants[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <>
            <DataTable
                key={refreshKey}
                fetchData={fetchNotifications}
                columns={[
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: ({ row }) => getStatusBadge(row.original.status),
                    },
                    {
                        header: "Recipient",
                        accessorKey: "recipientName",
                    },
                    {
                        header: "Appointment Date",
                        accessorFn: (row) => {
                            if (!row.appointmentDate) return "N/A";
                            return `${row.appointmentDate}${row.appointmentTime ? ` ${row.appointmentTime}` : ""}`;
                        },
                        id: "appointmentDate",
                    },
                    {
                        header: "Queued/Sent At",
                        accessorFn: (row) => {
                            const date = row.sentAt || row.createdAt;
                            return new Date(date).toLocaleString();
                        },
                        id: "timestamp",
                    },
                    {
                        header: "Actions",
                        id: "actions",
                        cell: ({ row }) => {
                            if (!hasUpdatePermission || row.original.status !== "pending") {
                                return null;
                            }

                            return (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleCancelNotification(row.original.messageId, e)}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                </Button>
                            );
                        },
                    },
                ]}
                onRowClick={handleRowClick}
            />
            {selectedNotification && (
                <NotificationDetailsModal
                    open={isDetailsModalOpen}
                    onOpenChange={setIsDetailsModalOpen}
                    notification={selectedNotification}
                />
            )}
        </>
    );
}
