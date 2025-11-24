import express, { Router } from "express";
import * as users from "../controllers/users.controller.js";
import * as volunteerRecords from "../controllers/volunteer-records.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// User list routes
router.get("/", withPermission({ permissions: "users.read" }), users.listUsers);
router.post("/", withPermission({ permissions: "users.create" }), users.createUser);

// Unavailability all
router.get(
    "/unavailability",
    withPermission({ permissions: "allunavailability.read" }),
    users.listAllUnavailability
);

// Volunteer records all
router.get(
    "/volunteer-records",
    withPermission({ permissions: "allvolunteer-records.read" }),
    volunteerRecords.listAllVolunteerRecords
);

// User CRUD routes
router.get("/:userId", withPermission({ permissions: "users.read" }), users.getUser);
router.put("/:userId", withPermission({ permissions: "users.update" }), users.updateUser);
router.delete("/:userId", withPermission({ permissions: "users.delete" }), users.deleteUser);

// Unavailability routes
router.post(
    "/:userId/unavailability",
    withPermission({
        scoped: {
            resource: "unavailability",
            action: "create",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    users.createUnavailability
);
router.get(
    "/:userId/unavailability",
    withPermission({
        scoped: {
            resource: "unavailability",
            action: "read",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    users.listUnavailability
);
router.put(
    "/:userId/unavailability/:unavailabilityId",
    withPermission({
        scoped: {
            resource: "unavailability",
            action: "update",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    users.updateUnavailability
);
router.delete(
    "/:userId/unavailability/:unavailabilityId",
    withPermission({
        scoped: {
            resource: "unavailability",
            action: "delete",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    users.deleteUnavailability
);

// Volunteer records routes
router.get(
    "/:userId/volunteer-records",
    withPermission({
        scoped: {
            resource: "volunteer-records",
            action: "read",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    volunteerRecords.listVolunteerRecordsByUser
);
router.get(
    "/:userId/volunteer-records/:recordId",
    withPermission({
        scoped: {
            resource: "volunteer-records",
            action: "read",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    volunteerRecords.getVolunteerRecord
);
router.post(
    "/:userId/volunteer-records",
    withPermission({
        scoped: {
            resource: "volunteer-records",
            action: "create",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    volunteerRecords.createVolunteerRecord
);
router.put(
    "/:userId/volunteer-records/:recordId",
    withPermission({
        scoped: {
            resource: "volunteer-records",
            action: "update",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    volunteerRecords.updateVolunteerRecord
);
router.delete(
    "/:userId/volunteer-records/:recordId",
    withPermission({
        scoped: {
            resource: "volunteer-records",
            action: "delete",
            getTargetUserId: (req) => req.params.userId,
        },
    }),
    volunteerRecords.deleteVolunteerRecord
);

export default router;
