import { Router } from "express";
import orgRouter from "./api.org.js"
import { withOrg } from "../middleware/with-org.js";
import { withAuth } from "../middleware/with-auth.js";
// import authRouter from "./auth.js";

const router: Router = Router();

// router.use('/auth', authRouter);
router.use('/o', withAuth, withOrg, orgRouter);
router.use('/s', withAuth);

export default router;