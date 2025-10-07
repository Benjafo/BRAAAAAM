import express, { Router } from "express";
import * as reports from "../controllers/reportsController";

const router: Router = express.Router({ mergeParams: true });

router.get("/", reports.listReports);
router.post("/", reports.createReport);

router.get("/:reportId", reports.getReport);
router.put("/:reportId", reports.updateReport);
router.delete("/:reportId", reports.deleteReport);

// /o/:orgId/reports/:reportId/generate
router.get("/:reportId/generate", reports.generateReport);

export default router;