import express, { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateData } from "../middleware/validation.js";
import {
    createPasswordSchema,
    requestPasswordResetSchema,
    signInSchema,
} from "../schemas/authSchemas.js";

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
