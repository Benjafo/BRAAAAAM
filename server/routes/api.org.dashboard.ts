import { Router } from "express";
import * as controller from "../controllers/dashboard.controller.js";
import { withAuth } from "../middleware/with-auth.js";

const router: Router = Router();

// All routes require authentication
router.use(withAuth);

router.get("/", controller.getDashboardData);

export default router;
