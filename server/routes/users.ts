import express, { Router } from "express";
import * as users from "../controllers/usersController";

const router: Router = express.Router({ mergeParams: true });

// /o/:orgId/users
router.get("/", users.listUsers);
router.post("/", users.createUser);

// /o/:orgId/users/:userId
router.get("/:userId", users.getUser);
router.put("/:userId", users.updateUser);
router.delete("/:userId", users.deleteUser);

// Unavailability
router.post("/:userId/unavailability", users.createUnavailability);
router.get("/:userId/unavailability", users.listUnavailability);
router.put("/:userId/unavailability/:unavailabilityId", users.updateUnavailability);
router.delete("/:userId/unavailability/:unavailabilityId", users.deleteUnavailability);

export default router;