import express, { Router } from "express";
import * as volunteerRecords from "../controllers/volunteer-records.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// List and create volunteer records
// Both OWN and ALL permissions can list, but filtering is handled in controller
router.get(
    "/",
    withPermission({
        permissions: ["ownvolunteer-records.read", "allvolunteer-records.read"],
    }),
    volunteerRecords.listVolunteerRecords
);

router.post(
    "/",
    withPermission({
        permissions: "ownvolunteer-records.create",
    }),
    volunteerRecords.createVolunteerRecord
);

// Get, update, and delete individual records
router.get(
    "/:recordId",
    withPermission({
        permissions: ["ownvolunteer-records.read", "allvolunteer-records.read"],
    }),
    volunteerRecords.getVolunteerRecord
);

router.put(
    "/:recordId",
    withPermission({
        permissions: ["ownvolunteer-records.update", "allvolunteer-records.update"],
    }),
    volunteerRecords.updateVolunteerRecord
);

router.delete(
    "/:recordId",
    withPermission({
        permissions: ["ownvolunteer-records.delete", "allvolunteer-records.delete"],
    }),
    volunteerRecords.deleteVolunteerRecord
);

export default router;
