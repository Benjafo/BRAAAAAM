import express, { Router } from "express";
import * as users from "../controllers/users.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// /o/:orgId/users
router.get("/", withPermission({ permissions: "users.read" }), users.listUsers);
router.post("/", withPermission({ permissions: "users.create" }), users.createUser);

// /o/:orgId/users/:userId
router.get("/:userId", withPermission({ permissions: "users.read" }), users.getUser);
router.put("/:userId", withPermission({ permissions: "users.update" }), users.updateUser);
router.delete("/:userId", withPermission({ permissions: "users.delete" }), users.deleteUser);

// Unavailability
router.post(
    "/:userId/unavailability",
    withPermission({ permissions: "unavailability.create" }),
    users.createUnavailability
);
router.get(
    "/:userId/unavailability",
    withPermission({ permissions: "unavailability.read" }),
    users.listUnavailability
);
router.put(
    "/:userId/unavailability/:unavailabilityId",
    withPermission({ permissions: "unavailability.update" }),
    users.updateUnavailability
);
router.delete(
    "/:userId/unavailability/:unavailabilityId",
    withPermission({ permissions: "unavailability.delete" }),
    users.deleteUnavailability
);

export default router;
