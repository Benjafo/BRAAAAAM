import { and, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import {
    appointments,
    clients,
    locations,
    messageRecipients,
    messages,
    users,
} from "../drizzle/org/schema.js";
import { hasPermission } from "../utils/permissions.js";
import { applyQueryFilters } from "../utils/queryParams.js";

/*
 * Example Notification Output
  {
    "id": "string",
    "title": "System Alert",
    "description": "A driver has marked a trip as completed.",
    "isDismissed": false,
    "createdAt": "2025-10-22T14:00:00.000Z"
  }
 */

// export const listNotifications = async (req: Request, res: Response): Promise<Response> => {
//     try {
//         const db = req.org?.db;
//         // Does org DB Connection exist?
//         if (!db) return res.status(500).json({ error: "Database not initialized" });

//         // Search + Sort + Pagination
//         const { where, orderBy, limit, offset, page, pageSize } = applyQueryFilters(req, [
//             notifications.title,
//             notifications.description,
//         ]);

//         const [{ total }] = await db
//             .select({ total: sql<number>`count(*)` })
//             .from(notifications)
//             .where(where);

//         // Select all notification records
//         const data = await db
//             .select({
//                 id: notifications.id,
//                 userId: notifications.userId,
//                 title: notifications.title,
//                 description: notifications.description,
//                 isDismissed: notifications.isDismissed,
//                 createdAt: notifications.createdAt,
//             })
//             .from(notifications)
//             .where(where)
//             .orderBy(...(orderBy.length > 0 ? orderBy : []))
//             .limit(limit)
//             .offset(offset);

//         return res.status(200).json({
//             page,
//             pageSize,
//             total: Number(total),
//             results: data,
//         });
//     } catch (err) {
//         console.error("Error listing notifications:", err);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

// export const getNotification = async (req: Request, res: Response): Promise<Response> => {
//     try {
//         const db = req.org?.db;
//         if (!db) return res.status(500).json({ error: "Database not initialized" });

//         const { notificationId } = req.params;

//         // Fetch notification by ID
//         const [notificationData] = await db
//             .select({
//                 id: notifications.id,
//                 userId: notifications.userId,
//                 title: notifications.title,
//                 description: notifications.description,
//                 isDismissed: notifications.isDismissed,
//                 createdAt: notifications.createdAt,
//             })
//             .from(notifications)
//             .where(eq(notifications.id, notificationId));

//         // If not found, return 404
//         if (!notificationData) {
//             return res.status(404).json({ message: "Notification not found" });
//         }

//         return res.status(200).json(notificationData);
//     } catch (err) {
//         console.error("Error fetching notification:", err);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

// export const createNotification = async (req: Request, res: Response): Promise<Response> => {
//     try {
//         const db = req.org?.db;
//         if (!db) return res.status(500).json({ error: "Database not initialized" });

//         const { userId, title, description } = req.body;

//         // Validate all required fields are provided
//         if (!title) {
//             return res.status(400).json({ message: "Title is required" });
//         }

//         // Insert new notification record
//         const [newNotification] = await db
//             .insert(notifications)
//             .values({
//                 userId,
//                 title,
//                 description,
//                 isDismissed: false, // Default to false on creation
//             })
//             .returning();

//         return res.status(201).json(newNotification);
//     } catch (err) {
//         console.error("Error creating notification:", err);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

// export const deleteNotification = async (req: Request, res: Response): Promise<Response> => {
//     try {
//         const db = req.org?.db;
//         if (!db) return res.status(500).json({ error: "Database not initialized" });

//         const { notificationId } = req.params;

//         // Delete record by ID
//         const result = await db.delete(notifications).where(eq(notifications.id, notificationId));

//         // Ensure record was deleted
//         if (result.rowCount === 0) {
//             return res.status(404).json({ message: "Notification not found" });
//         }

//         return res.status(204).send();
//     } catch (err) {
//         console.error("Error deleting notification:", err);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

// export const dismissNotification = async (req: Request, res: Response): Promise<Response> => {
//     try {
//         const db = req.org?.db;
//         if (!db) return res.status(500).json({ error: "Database not initialized" });

//         const { notificationId } = req.params;

//         // Update notification as dismissed
//         const [updatedNotification] = await db
//             .update(notifications)
//             .set({
//                 isDismissed: true,
//             })
//             .where(eq(notifications.id, notificationId))
//             .returning();

//         // No record found
//         if (!updatedNotification) {
//             return res.status(404).json({ message: "Notification not found" });
//         }

//         return res.status(200).json(updatedNotification);
//     } catch (err) {
//         console.error("Error dismissing notification:", err);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// };

// ============================================================================
// Email Notifications (Messages Table)
// ============================================================================

/**
 * List email notifications (messages)
 * Permission-based: drivers see only their own sent/failed, admins see all
 */
export const listEmailNotifications = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const hasAllNotificationsPermission = await hasPermission(
            req.user?.id || "",
            "allnotifications.read",
            req.org!.db
        );
        const hasOwnNotificationsPermission = await hasPermission(
            req.user?.id || "",
            "ownnotifications.read",
            req.org!.db
        );

        if (!hasAllNotificationsPermission && !hasOwnNotificationsPermission) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }

        const pickupLocations = alias(locations, "pickup_locations");
        const dropoffLocations = alias(locations, "dropoff_locations");
        const sender = alias(users, "sender");


        // Define columns for searching, sorting, and filtering
        const recipientName = sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`;
        const clientName = sql<string>`concat(${clients.firstName}, ' ', ${clients.lastName})`;
        const statusText = sql<string>`${messages.status}::text`;
        const priorityText = sql<string>`${messages.priority}::text`;

        const searchableColumns = [
            users.firstName,
            users.lastName,
            users.email,
            messages.subject,
            messages.body,
            statusText,
            priorityText,
            clients.firstName,
            clients.lastName,
        ];

        const sortableColumns: Record<string, any> = {
            status: messages.status,
            recipient: users.firstName,
            recipientName: users.firstName,
            appointmentDate: appointments.startDate,
            timestamp: messages.createdAt,
            createdAt: messages.createdAt,
            sentAt: messages.sentAt,
            priority: messages.priority,
        };

        const filterableColumns: Record<string, any> = {
            status: statusText,
            priority: priorityText,
            recipient: [users.firstName, users.lastName, users.email],
            recipientName: [users.firstName, users.lastName],
            client: [clients.firstName, clients.lastName],
        };

        const { where: filterWhere, orderBy, limit, offset, page, pageSize } = applyQueryFilters(
            req,
            searchableColumns,
            sortableColumns,
            filterableColumns
        );

        // Build additional where conditions for permissions
        const permissionConditions = [];

        // Permission-based filtering
        if (!hasAllNotificationsPermission) {
            // Drivers only see their own notifications, excluding pending
            permissionConditions.push(eq(messageRecipients.userId, userId));
            permissionConditions.push(ne(messages.status, "pending"));
        }

        // Only show email messages
        permissionConditions.push(eq(messages.messageType, "Email"));

        // Combine permission conditions with filter conditions
        const whereClause = and(
            ...(permissionConditions.length > 0 ? permissionConditions : []),
            filterWhere
        );

        // Get total count
        const [{ total }] = await db
            .select({ total: sql<number>`count(distinct ${messages.id})` })
            .from(messages)
            .innerJoin(messageRecipients, eq(messages.id, messageRecipients.messageId))
            .innerJoin(users, eq(messageRecipients.userId, users.id))
            .leftJoin(appointments, eq(messages.appointmentId, appointments.id))
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(dropoffLocations, eq(appointments.destinationLocation, dropoffLocations.id))
            .leftJoin(clients, eq(appointments.clientId, clients.id))
            .where(whereClause);

        // Fetch notifications with recipient and appointment info
        const data = await db
            .select({
                messageId: messages.id,
                status: messages.status,
                priority: messages.priority,
                subject: messages.subject,
                body: messages.body,
                sentAt: messages.sentAt,
                createdAt: messages.createdAt,
                scheduledSendTime: messages.scheduledSendTime,
                recipientId: messageRecipients.userId,
                recipientName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
                recipientEmail: users.email,
                senderId: messages.senderId,
                senderName: sql<string>`concat(${sender.firstName}, ' ', ${sender.lastName})`,
                senderEmail: sender.email,
                appointmentId: appointments.id,
                appointmentDate: appointments.startDate,
                appointmentTime: appointments.startTime,
                clientName: sql<string>`concat(${clients.firstName}, ' ', ${clients.lastName})`,
                pickupAddress: sql<string>`CONCAT(
                    ${pickupLocations.addressLine1}, ', ',
                    ${pickupLocations.city}, ', ',
                    ${pickupLocations.state}, ' ',
                    ${pickupLocations.zip}
                )`,
                dropoffAddress: sql<string>`CONCAT(
                    ${dropoffLocations.addressLine1}, ', ',
                    ${dropoffLocations.city}, ', ',
                    ${dropoffLocations.state}, ' ',
                    ${dropoffLocations.zip}
                )`,
            })
            .from(messages)
            .innerJoin(messageRecipients, eq(messages.id, messageRecipients.messageId))
            .innerJoin(users, eq(messageRecipients.userId, users.id))
            .leftJoin(sender, eq(messages.senderId, sender.id))
            .leftJoin(appointments, eq(messages.appointmentId, appointments.id))
            .leftJoin(pickupLocations, eq(appointments.pickupLocation, pickupLocations.id))
            .leftJoin(dropoffLocations, eq(appointments.destinationLocation, dropoffLocations.id))
            .leftJoin(clients, eq(appointments.clientId, clients.id))
            .where(whereClause)
            .orderBy(...(orderBy.length > 0 ? orderBy : [messages.createdAt]))
            .limit(limit)
            .offset(offset);

        return res.status(200).json({
            page,
            pageSize,
            total: Number(total),
            results: data,
        });
    } catch (err) {
        console.error("Error listing email notifications:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Retry a failed email notification
 * Admin only - requires allnotifications.update permission
 */
export const retryNotification = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { id } = req.params;

        // Check if message exists and is failed
        const [message] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

        if (!message) {
            return res.status(404).json({ error: "Notification not found" });
        }

        if (message.status !== "failed") {
            return res.status(400).json({ error: "Only failed notifications can be retried" });
        }

        // Update status to pending for retry
        const [updatedMessage] = await db
            .update(messages)
            .set({
                status: "pending",
                sentAt: null,
            })
            .where(eq(messages.id, id))
            .returning();

        return res.status(200).json({
            message: "Notification queued for retry",
            notification: updatedMessage,
        });
    } catch (err) {
        console.error("Error retrying notification:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Cancel a pending email notification
 * Admin only - requires allnotifications.update permission
 */
export const cancelNotification = async (req: Request, res: Response): Promise<Response> => {
    try {
        const db = req.org?.db;
        if (!db) return res.status(500).json({ error: "Database not initialized" });

        const { id } = req.params;

        // Check if message exists and is pending
        const [message] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

        if (!message) {
            return res.status(404).json({ error: "Notification not found" });
        }

        if (message.status !== "pending") {
            return res.status(400).json({ error: "Only pending notifications can be cancelled" });
        }

        // Update status to cancelled
        const [updatedMessage] = await db
            .update(messages)
            .set({
                status: "cancelled" as any,
            })
            .where(eq(messages.id, id))
            .returning();

        return res.status(200).json({
            message: "Notification cancelled",
            notification: updatedMessage,
        });
    } catch (err) {
        console.error("Error cancelling notification:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
