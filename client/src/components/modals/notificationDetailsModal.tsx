"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

type NotificationDetailsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    notification: Notification;
};

export default function NotificationDetailsModal({
    open,
    onOpenChange,
    notification,
}: NotificationDetailsModalProps) {
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Notification Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <div className="mt-1">{getStatusBadge(notification.status)}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Priority</label>
                            <p className="mt-1 text-sm">
                                {notification.priority.charAt(0).toUpperCase() +
                                    notification.priority.slice(1)}
                            </p>
                        </div>
                    </div>

                    {/* Recipient Information */}
                    <div>
                        <h3 className="text-md font-semibold mb-3">Recipient</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Name</label>
                                <p className="mt-1 text-sm">{notification.recipientName}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-sm">{notification.recipientEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Information */}
                    {notification.appointmentId && (
                        <div>
                            <h3 className="text-md font-semibold mb-3">Appointment</h3>
                            <div className="space-y-3">
                                {notification.clientName && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Client
                                        </label>
                                        <p className="mt-1 text-sm">{notification.clientName}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Date
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {notification.appointmentDate || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Time
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {notification.appointmentTime || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                {notification.pickupAddress && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Pickup Address
                                        </label>
                                        <p className="mt-1 text-sm">{notification.pickupAddress}</p>
                                    </div>
                                )}
                                {notification.dropoffAddress && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Dropoff Address
                                        </label>
                                        <p className="mt-1 text-sm">{notification.dropoffAddress}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message Information */}
                    <div>
                        <h3 className="text-md font-semibold mb-3">Message</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Subject</label>
                                <p className="mt-1 text-sm">{notification.subject}</p>
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div>
                        <h3 className="text-md font-semibold mb-3">Timestamps</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Created</label>
                                <p className="mt-1 text-sm">
                                    {new Date(notification.createdAt).toLocaleString()}
                                </p>
                            </div>
                            {notification.sentAt && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Sent</label>
                                    <p className="mt-1 text-sm">
                                        {new Date(notification.sentAt).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {notification.scheduledSendTime && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Scheduled
                                    </label>
                                    <p className="mt-1 text-sm">
                                        {new Date(notification.scheduledSendTime).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
