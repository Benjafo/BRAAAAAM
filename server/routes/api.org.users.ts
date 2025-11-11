import express, { Router } from "express";
import * as users from "../controllers/users.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

router.get("/", withPermission({ permissions: "users.read" }), users.listUsers);
router.post("/", withPermission({ permissions: "users.create" }), users.createUser);

router.get(
    "/unavailability",
    withPermission({ permissions: "allunavailability.read" }),
    users.listAllUnavailability
);

router.get("/:userId", withPermission({ permissions: "users.read" }), users.getUser);
router.put("/:userId", withPermission({ permissions: "users.update" }), users.updateUser);
router.delete("/:userId", withPermission({ permissions: "users.delete" }), users.deleteUser);

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

export default router;
