import express, { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import { validateData } from "../middleware/validation";
import {
    signInSchema,
    requestPasswordResetSchema,
    createPasswordSchema,
} from "../schemas/authSchemas";

const router: Router = express.Router();

router.post("/sign-in", validateData(signInSchema), authController.signIn);
router.post("/sign-out", authenticateToken, authController.signOut);
router.post("/reset-password", validateData(createPasswordSchema), authController.resetPassword);
router.post("/token-refresh", authController.refreshToken);
router.post(
    "/request-password-reset",
    validateData(requestPasswordResetSchema),
    authController.requestPasswordReset
);

export default router;
