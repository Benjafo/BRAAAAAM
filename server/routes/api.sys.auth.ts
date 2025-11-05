import { Router } from "express";

const router: Router = Router();

router.post("/sign-in");
router.post("/sign-out");
router.post("/reset-password");
router.post("token-refresh");
router.post("/request-password-reset");

export default router;
