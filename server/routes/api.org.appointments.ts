import express, { Router } from "express";
import * as appt from "../controllers/appointments.controller.js";

const router: Router = express.Router({ mergeParams: true });

// /o/:orgId/appointments
router.get("/", appt.listAppointments);
router.post("/", appt.createAppointment);

// /o/:orgId/appointments/:appointmentId
router.get("/:appointmentId", appt.getAppointment);
router.put("/:appointmentId", appt.updateAppointment);

// /o/:orgId/appointments/tags
router.get("/tags", appt.listTags);
router.post("/tags", appt.createTag);
router.put("/tags/:tagId", appt.updateTag);
router.delete("/tags/:tagId", appt.deleteTag);

export default router;
