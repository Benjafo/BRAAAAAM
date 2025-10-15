import { Request, Response } from "express";

interface Notification {
  id: string;
  title?: string;
  message?: string;
  createdAt: string;
  isRead?: boolean;
}

const notifications: Notification[] = [];

export const listNotifications = (req: Request, res: Response): Response => {
  return res.status(200).json(notifications);
  // return res.status(500).send();
};

export const getNotification = (req: Request, res: Response): Response => {
  const { notificationId } = req.params;
  const notification = notifications.find((n) => n.id === notificationId);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  return res.status(200).json(notification);
  // return res.status(500).send();
};

export const deleteNotification = (req: Request, res: Response): Response => {
  const { notificationId } = req.params;

  const index = notifications.findIndex((n) => n.id === notificationId);
  if (index === -1) {
    return res.status(404).json({ message: "Notification not found" });
  }

  notifications.splice(index, 1);
  return res.status(204).send();
  // return res.status(500).send();
};