import express, { Router } from "express";
import * as sys from "../controllers/sys-settings.controller.js";

const router: Router = express.Router();

// /s/settings
router.get("/", sys.getSystemSettings);
router.put("/", sys.updateSystemSettings);

export default router;