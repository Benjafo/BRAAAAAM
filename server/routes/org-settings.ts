import express, { Router } from "express";
import * as settings from "../controllers/org-settings.controller";

const router: Router = express.Router({ mergeParams: true });

// GET/PUT /o/:orgId/settings
router.get("/", settings.getSettings);
router.put("/", settings.updateSettings);

// /operation-hours
router.get("/operation-hours", settings.getOperationHours);

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