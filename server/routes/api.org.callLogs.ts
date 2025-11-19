import { Router } from "express";
import * as controller from "../controllers/callLogs.controller.js";
import { withAuth } from "../middleware/with-auth.js";

const router: Router = Router();

// All routes require authentication
router.use(withAuth);

router.get("/", controller.listCallLogs);
router.get("/:id", controller.getCallLog);
router.post("/", controller.createCallLog);
router.put("/:id", controller.updateCallLog);
router.delete("/:id", controller.deleteCallLog);

export default router;
