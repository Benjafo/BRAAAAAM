import express, { Router } from "express";
import * as locations from "../controllers/locations.controller";

const router: Router = express.Router({ mergeParams: true });

// /o/:orgId/settings/locations
router.post("/", locations.createLocation);
router.get("/:locationId", locations.getLocation);
router.put("/:locationId", locations.updateLocation);
router.delete("/:locationId", locations.deleteLocation);

export default router;