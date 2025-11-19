import { rolePermissions, userPermissions, users, permissions } from "../drizzle/org/schema.js";
import {
    requestPasswordResetSchema,
    signInSchema,
    createPasswordSchema,
} from "../schemas/auth.schema.js";
import { Request, Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
    generateAccessToken,
    generatePasswordResetToken,
    generateRefreshToken,
    verifyPasswordResetToken,
    verifyRefreshToken,
} from "../utils/jwt.js";
import { TokenPayload } from "../types/auth.types.js";
import { alias } from "drizzle-orm/pg-core";
import { sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from "../utils/email.js";
import { getSysDb } from "../drizzle/sys-client.js";
import { organizations } from "../drizzle/sys/schema.js";
import { success } from "zod";

const signIn = async (req: Request, res: Response) => {
    try {
        const parsed = signInSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const { email, password } = parsed.data;

        console.log("starting db query", req.org?.subdomain);

        const user = await req.org?.db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isValidPassword = await comparePassword(password, user.passwordHash ?? "");

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const p = alias(permissions, "p");
        const rp = alias(rolePermissions, "rp");
        const up = alias(userPermissions, "up");

        const allPermissions = await req.org?.db
            .select({
                id: p.id,
                permKey: p.permKey,
                resource: p.resource,
                action: p.action,
                name: p.name,
                description: p.description,
                roleGrant: rp.grantAccess, // nullable
                userGrant: up.grantAccess, // nullable
                effective: sql<boolean>`COALESCE(${up.grantAccess}, ${rp.grantAccess}, false)`,
            })
            .from(p)
            .leftJoin(rp, and(eq(rp.permissionId, p.id), eq(rp.roleId, user.roleId!)))
            .leftJoin(up, and(eq(up.permissionId, p.id), eq(up.userId, user.id)))
            .orderBy(p.permKey);

        const tokenPayload: TokenPayload = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            db: req.org?.subdomain || "sys",
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        res.cookie("refresh-token", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const { passwordHash, ...userResponse } = user;

        req.auditLog({
            userId: user.id,
            actionType: "auth.signIn",
        });

        return res.json({
            message: "Signed in successfully",
            accessToken,
            user: userResponse,
            permissions: allPermissions,
            subdomain: req.org?.subdomain,
        });
    } catch (error) {
        console.error("orgSignIn error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const signOut = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        res.clearCookie("refresh-token");

        return res.json({
            message: "Signed out successfully",
        });
    } catch (error) {
        console.error("signOut error:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

const refreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies["refresh-token"];

        if (!refreshToken) {
            return res.status(400).json({
                error: "Refresh token is required",
            });
        }

        let decoded: TokenPayload;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch {
            return res.status(401).json({
                error: "Invalid or expired refresh token",
            });
        }

        console.log(decoded);

        const tokenPayload: TokenPayload = {
            id: decoded.id,
            email: decoded.email,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            db: decoded.db,
        };

        const accessToken = generateAccessToken(tokenPayload);

        return res.json({
            message: "Token refreshed successfully",
            accessToken,
        });
    } catch (error) {
        console.error("refreshToken error:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const parsed = requestPasswordResetSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid email",
            });
        }

        const { email } = parsed.data;

        const user = await req.org?.db.query.users.findFirst({
            columns: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                passwordHash: true,
            },
            where: eq(users.email, email),
        });

        // Calculate expiration time (60 minutes from now)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        if (!user) {
            // Return success message even if user doesn't exist (security best practice)
            return res.json({
                message: "If the email exists, a password reset link has been sent",
                expiresAt: expiresAt.toISOString(),
            });
        }

        const resetToken = generatePasswordResetToken({
            userId: user.id,
            email: user.email,
            password: user.passwordHash ?? "",
        });

        // Build the reset URL with subdomain
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const resetLink = `${appUrl}/${req.org?.subdomain}/reset-password?token=${resetToken}&id=${user.id}`;

        // Send password reset email
        const userName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || "User";

        try {
            await sendPasswordResetEmail(user.email, userName, resetLink, 60);
            console.log(`Password reset email sent to ${user.email}`);
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            // Still return success to prevent email enumeration
        }

        req.auditLog({
            actionType: "auth.passwordResetRequested",
            actionDetails: {
                userId: user.id,
                email: user.email,
            }
        });

        return res.json({
            message: "If the email exists, a password reset link has been sent",
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("requestPasswordReset error:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

const resetPassword = async (req: Request, res: Response) => {
    try {
        const token = req.query["token"] as string;
        const userId = req.query["id"] as string;

        if (!token || !userId) {
            return res.status(400).json({
                error: "Bad request",
            });
        }

        let decoded: { userPassword: string; email: string };
        try {
            decoded = verifyPasswordResetToken(token, userId);
        } catch {
            return res.status(401).json({
                error: "invalid or expired password reset token",
            });
        }

        const parsed = createPasswordSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                error: "Failed password reset validation",
                details: parsed.error.issues,
            });
        }

        const { newPassword } = parsed.data;

        const newHashPassword = await hashPassword(newPassword);

        if (newHashPassword === decoded.userPassword) {
            return res.status(400).json({
                error: "Password cannot match an existing password",
            });
        }

        await req.org?.db
            .update(users)
            .set({ passwordHash: newHashPassword })
            .where(eq(users.id, userId));

        // Send confirmation email
        const user = await req.org?.db.query.users.findFirst({
            columns: {
                email: true,
                firstName: true,
                lastName: true,
            },
            where: eq(users.id, userId),
        });

        let success = false;

        if (user) {
            const userName = user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || "User";

            try {
                await sendPasswordResetConfirmationEmail(user.email, userName);
                console.log(`Password reset confirmation email sent to ${user.email}`);
            } catch (emailError) {
                console.error("Failed to send password reset confirmation email:", emailError);
                // Don't fail the request if email fails
            }

            success = true;
        }

        req.auditLog({
            actionType: "auth.passwordReset",
            actionDetails: {
                userId: userId,
                email: user?.email,
                success: success,
            }
        });

        return res.json({
            message: "Reset password successfully",
        });
    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

const getSupportContact = async (req: Request, res: Response) => {
    try {
        // Get organization contact info from system DB
        const sysDb = getSysDb();
        const org = await sysDb.query.organizations.findFirst({
            where: eq(organizations.subdomain, req.org?.subdomain || ""),
            columns: {
                name: true,
                pocName: true,
                pocPhone: true,
            },
        });

        if (!org) {
            return res.status(404).json({
                error: "Organization not found",
            });
        }

        // Return support contact info
        return res.json({
            organizationName: org.name,
            contactName: org.pocName,
            phone: org.pocPhone || null,
        });
    } catch (error) {
        console.error("getSupportContact error:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

export default {
    signIn,
    signOut,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    getSupportContact,
};
