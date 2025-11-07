import express, { Router } from "express";
import * as reports from "../controllers/reports.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

router.get("/", withPermission({ permissions: "reports.read" }), reports.listReports);
router.post("/", reports.createReport);

router.get("/:reportId", withPermission({ permissions: "reports.read" }), reports.getReport);
router.put("/:reportId", reports.updateReport);
router.delete("/:reportId", reports.deleteReport);

// /o/:orgId/reports/:reportId/generate
router.get(
    "/:reportId/generate",
    withPermission({ permissions: "reports.export" }),
    reports.generateReport
);

// Export routes for data export
router.get("/clients/export", withPermission({ permissions: "reports.export" }), reports.exportClients);
router.get("/users/export", withPermission({ permissions: "reports.export" }), reports.exportUsers);
router.get("/appointments/export", withPermission({ permissions: "reports.export" }), reports.exportAppointments);

export default router;
