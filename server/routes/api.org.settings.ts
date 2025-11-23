import express, { Router } from "express";
import * as settings from "../controllers/org-settings.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// GET/PUT /o/:orgId/settings
router.get("/", withPermission({ permissions: "settings.read" }), settings.getSettings);
router.put("/", withPermission({ permissions: "settings.update" }), settings.updateSettings);

// /operation-hours
router.get(
    "/operation-hours",
    withPermission({ permissions: "settings.read" }),
    settings.getOperationHours
);

export default router;
