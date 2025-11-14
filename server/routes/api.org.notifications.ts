import express, { Router } from "express";
import * as notifications from "../controllers/notifications.controller.js";

const router: Router = express.Router({ mergeParams: true });

// Email notifications (messages table)
router.get("/", notifications.listEmailNotifications);
router.post("/:id/retry", notifications.retryNotification);
router.put("/:id", notifications.cancelNotification);

// Old in-app notifications (commented out - using messages table instead)
// router.get("/", notifications.listNotifications);
// router.get("/:notificationId", notifications.getNotification);
// router.delete("/:notificationId", notifications.deleteNotification);

export default router;
