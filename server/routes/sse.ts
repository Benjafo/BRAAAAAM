import express, { Router } from "express";
import * as sseController from "../controllers/sse.controller";

const router: Router = express.Router();
router.get("/", sseController.getSSEStream);
export default router;