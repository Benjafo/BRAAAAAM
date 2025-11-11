import { Router } from "express";
import controller from "../controllers/org.auth.controller.js";
import { withAuth } from "../middleware/with-auth.js";
import { withOrg } from "../middleware/with-org.js";

const router: Router = Router();

router.use(withOrg);

router.post("/sign-in", controller.signIn);
router.post("/sign-out", withAuth, controller.signOut);
router.post("/reset-password", controller.resetPassword);
router.post("/token-refresh", withAuth, controller.refreshToken);
router.post("/request-password-reset", controller.requestPasswordReset);

export default router;
