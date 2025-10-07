import express, { Router } from "express";
import * as sseController from "../controllers/sseController";

const router: Router = express.Router();
router.get("/", sseController.stream);
export default router;