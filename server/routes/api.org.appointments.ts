import express, { Router } from "express";
import * as appt from "../controllers/appointments.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// /o/appointments
router.get("/", withPermission({ permissions: ["ownappointments.read", "allappointments.read"] }), appt.listAppointments);
router.post("/", withPermission({ permissions: "allappointments.create" }), appt.createAppointment);

// /o/appointments/:appointmentId
router.get(
    "/:appointmentId",
    withPermission({ permissions: ["ownappointments.read", "allappointments.read"] }),
    appt.getAppointment
);
router.put(
    "/:appointmentId",
    withPermission({ permissions: ["ownappointments.update", "allappointments.update"] }),
    appt.updateAppointment
);

router.get(
    "/:appointmentId/matching-drivers",
    withPermission({ permissions: ["ownappointments.read", "allappointments.read"] }),
    appt.getMatchingDrivers
);

// /o/appointments/:appointmentId/notify-drivers
router.post(
    "/:appointmentId/notify-drivers",
    withPermission({ permissions: "allappointments.update" }),
    appt.notifyDrivers
);

// /o/appointments/:appointmentId/accept
router.post(
    "/:appointmentId/accept",
    withPermission({ permissions: ["ownappointments.read", "allappointments.read"] }),
    appt.acceptAppointment
);

// /o/appointments/tags
// router.get("/tags", appt.listTags);
// router.post("/tags", appt.createTag);
// router.put("/tags/:tagId", appt.updateTag);
// router.delete("/tags/:tagId", appt.deleteTag);

export default router;
