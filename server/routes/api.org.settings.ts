import express, { Router } from "express";
import * as settings from "../controllers/org-settings.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// GET/PUT /o/:orgId/settings
router.get("/", withPermission({ permissions: "settings.read" }), settings.getSettings);
router.put("/", withPermission({ permissions: "settings.update" }), settings.updateSettings);

// /operation-hours
router.get("/operation-hours", withPermission({ permissions: "settings.read" }), settings.getOperationHours);

// TODO Using settings permissions for now until forms permissions are created
// TODO: Make Forms router seperate from settings
// /forms
router.get("/forms", settings.listForms);
router.post("/forms", settings.createForm);
router.get("/forms/:formId", settings.getForm);
router.put("/forms/:formId", settings.updateForm);

// /audit-log
router.get("/audit-log", settings.listAuditLog);
router.get("/audit-log/:logId", settings.getAuditLogEntry);

// /permissions
router.get("/permissions", settings.getPermissions);

// /location
router.get("/location", settings.getCurrentLocation);

export default router;