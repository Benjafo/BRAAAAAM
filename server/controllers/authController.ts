import { Request, Response } from "express";
import {
    AuthRequest,
    ErrorResponse,
    LoginResponse,
    MessageResponse,
    TokenData,
    TokenResponse,
    User,
    UserPayload,
} from "../types/auth.types";
import {
    generateAccessToken,
    generatePasswordResetToken,
    generateRefreshToken,
    verifyPasswordResetToken,
    verifyRefreshToken,
} from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

// TODO: remove this shit, use database
const USERS: User[] = [
    {
        id: 1,
        email: "admin@gmail.com",
        name: "Admin User",
        password: "$2b$10$0DwdOLdi0gkCcN81XcdxYuzKcacUYLUwNjvljWlZf84uDyodkPfSW", // password123
    },
    {
        id: 2,
        email: "driver@gmail.com",
        name: "Driver user",
        password: "$2b$10$/psMsbxSQ5J03m5xVQdcu.xqZiKvE14D..WTgdNXQTNUFfaK9pCiS", // password1234
    },
    {
        id: 3,
        email: "dispatcher@gmail.com",
        username: "Dispatcher user",
        password: "$2b$10$T5Y5pXqefGjzqxHrSfbMEu4L4oebFsSSyyEHBAAI3mF4CQg6UC1yi", // password12345
    },
];

// TODO: remove this shit also, use database
const refreshTokenStore = new Map<number, string[]>();
const passwordResetTokenStore = new Map<number, TokenData>();

export const signIn = async (
    req: Request<{}, {}, { email?: string; password?: string }>,
    res: Response<LoginResponse | ErrorResponse>
): Promise<Response> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // TODO: replace with database query
        console.log("Attempting login for:", email);
        const user = USERS.find((u) => u.email === email);

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const userPayload: UserPayload = {
            id: user.id,
            email: user.email,
            username: user.username,
        };

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken(userPayload);

        // TODO: replace with database query
        const userTokens = refreshTokenStore.get(user.id) || [];
        userTokens.push(refreshToken);
        refreshTokenStore.set(user.id, userTokens);

        return res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const signOut = async (
    req: AuthRequest,
    res: Response<MessageResponse | ErrorResponse>
): Promise<Response> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;

        // TODO: replace with database query
        refreshTokenStore.delete(userId);

        return res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const refreshToken = async (
    req: Request<{}, {}, { refreshToken?: string }>,
    res: Response<TokenResponse | ErrorResponse>
): Promise<Response> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        let decoded: UserPayload;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (_error) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        // TODO: replace with database query
        const userTokens = refreshTokenStore.get(decoded.id) || [];
        if (!userTokens.includes(refreshToken)) {
            return res.status(401).json({ error: "Refresh token not found" });
        }

        const userPayload: UserPayload = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
        };
        const newAccessToken = generateAccessToken(userPayload);

        return res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const requestPasswordReset = async (
    req: Request<{}, {}, { email?: string }>,
    res: Response<MessageResponse | ErrorResponse>
): Promise<Response> => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // TODO: replace with database query
        const user = USERS.find((u) => u.email === email);

        if (!user) {
            return res.json({
                message: "If the email exists, a password reset link has been sent",
            });
        }

        const resetToken = generatePasswordResetToken({
            userId: user.id,
            email: user.email,
            password: user.password,
        });

        // TODO: replace with database query
        passwordResetTokenStore.set(user.id, {
            token: resetToken,
            createdAt: new Date(),
        });

        // TODO: send an email here
        console.log(`Password reset token for ${email}: ${resetToken}`);
        return res.json({
            message: "If the email exists, a password reset link has been sent",
            resetToken: resetToken, // TODO: remove, this is for testing
        });
    } catch (error) {
        console.error("Password reset request error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const resetPassword = async (
    req: Request<{}, {}, { newPassword?: string; confirmPassword?: string }>,
    res: Response<MessageResponse | ErrorResponse>
): Promise<Response> => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const token = req.query.token as string;

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ error: "New and confirm password are required" });
        }

        // TODO: replace with real validation
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }

        let userId: number | null = null;
        let storedTokenData: TokenData | null = null;

        // TODO: replace with database query
        for (const [id, tokenData] of passwordResetTokenStore.entries()) {
            if (tokenData.token === token) {
                userId = id;
                storedTokenData = tokenData;
                break;
            }
        }

        if (!userId || !storedTokenData) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        // TODO: replace with database query
        const user = USERS.find((u) => u.id === userId);
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        try {
            verifyPasswordResetToken(token, user.password);
        } catch (_error) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        const hashedPassword = await hashPassword(newPassword);

        // TODO: replace with database query
        const userIndex = USERS.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
            USERS[userIndex].password = hashedPassword;
        }
        passwordResetTokenStore.delete(userId);
        refreshTokenStore.delete(userId);
        return res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Password reset error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
