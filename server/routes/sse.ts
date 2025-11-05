import express, { Router } from "express";
import * as sseController from "../controllers/sse.controller.js";

const router: Router = express.Router();
router.get("/", sseController.getSSEStream);
export default router;
