import express, { Router } from "express";
import * as appt from "../controllers/appointments.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// /o/:orgId/appointments
router.get("/", withPermission({ permissions: "appointments.read" }), appt.listAppointments);
router.post("/", withPermission({ permissions: "appointments.create" }), appt.createAppointment);

// /o/:orgId/appointments/:appointmentId
router.get(
    "/:appointmentId",
    withPermission({ permissions: "appointments.read" }),
    appt.getAppointment
);
router.put(
    "/:appointmentId",
    withPermission({ permissions: "appointments.update" }),
    appt.updateAppointment
);

// /o/:orgId/appointments/tags
// router.get("/tags", appt.listTags);
// router.post("/tags", appt.createTag);
// router.put("/tags/:tagId", appt.updateTag);
// router.delete("/tags/:tagId", appt.deleteTag);

export default router;
