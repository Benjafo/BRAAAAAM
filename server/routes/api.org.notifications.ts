import express, { Router } from "express";
import * as notifications from "../controllers/notifications.controller.js";

const router: Router = express.Router({ mergeParams: true });

router.get("/", notifications.listNotifications);
router.get("/:notificationId", notifications.getNotification);
router.delete("/:notificationId", notifications.deleteNotification);

export default router;
