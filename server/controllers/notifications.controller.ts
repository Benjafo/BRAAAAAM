import { Request, Response } from "express";
import { notifications } from "../drizzle/org/schema.js";
import { eq } from "drizzle-orm";

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

export const listNotifications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = req.org?.db;
    // Does org DB Connection exist?
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    // Select all notification records
    const data = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        title: notifications.title,
        description: notifications.description,
        isDismissed: notifications.isDismissed,
        createdAt: notifications.createdAt,
      })
      .from(notifications);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error listing notifications:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getNotification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = req.org?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { notificationId } = req.params;

    // Fetch notification by ID
    const [notificationData] = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        title: notifications.title,
        description: notifications.description,
        isDismissed: notifications.isDismissed,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.id, notificationId));

    // If not found, return 404
    if (!notificationData) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json(notificationData);
  } catch (err) {
    console.error("Error fetching notification:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createNotification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = req.org?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { userId, title, description } = req.body;

    // Validate all required fields are provided
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Insert new notification record
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        description,
        isDismissed: false, // Default to false on creation
      })
      .returning();

    return res.status(201).json(newNotification);
  } catch (err) {
    console.error("Error creating notification:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = req.org?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { notificationId } = req.params;

    // Delete record by ID
    const result = await db.delete(notifications).where(eq(notifications.id, notificationId));

    // Ensure record was deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting notification:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const dismissNotification = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = req.org?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { notificationId } = req.params;

    // Update notification as dismissed
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isDismissed: true,
      })
      .where(eq(notifications.id, notificationId))
      .returning();

    // No record found
    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json(updatedNotification);
  } catch (err) {
    console.error("Error dismissing notification:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
