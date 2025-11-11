import express, { Router } from "express";
import * as locations from "../controllers/locations.controller.js";

const router: Router = express.Router({ mergeParams: true });

// /o/settings/locations
router.post("/", locations.createLocation);
router.get("/:locationId", locations.getLocation);
router.put("/:locationId", locations.updateLocation);
router.delete("/:locationId", locations.deleteLocation);

export default router;
