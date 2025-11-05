import crypto from "crypto";
import jwt from "jsonwebtoken";
import { PasswordResetPayload, TokenPayload } from "../types/auth.types.js";

const ACCESS_TOKEN_SECRET: string =
    process.env.ACCESS_TOKEN_SECRET || crypto.randomBytes(64).toString("hex");
const REFRESH_TOKEN_SECRET: string =
    process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString("hex");
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const PASSWORD_RESET_TOKEN_EXPIRY = "1h";

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const generatePasswordResetToken = (payload: PasswordResetPayload): string => {
    const resetTokenSecret = ACCESS_TOKEN_SECRET + payload.userId;
    return jwt.sign({ userPassword: payload.password, email: payload.email }, resetTokenSecret, {
        expiresIn: PASSWORD_RESET_TOKEN_EXPIRY,
    });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch {
        throw new Error("Invalid or expired access token");
    }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch {
        throw new Error("Invalid or expired refresh token");
    }
};

export const verifyPasswordResetToken = (
    token: string,
    userId: string
): { userPassword: string; email: string } => {
    try {
        const resetTokenSecret = ACCESS_TOKEN_SECRET + userId;
        return jwt.verify(token, resetTokenSecret) as { userPassword: string; email: string };
    } catch {
        throw new Error("Invalid or expired password reset token");
    }
};
