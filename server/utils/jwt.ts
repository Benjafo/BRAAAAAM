import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserPayload, PasswordResetPayload } from '../types/auth.types';

const ACCESS_TOKEN_SECRET: string =
    process.env.ACCESS_TOKEN_SECRET || crypto.randomBytes(64).toString('hex');
const REFRESH_TOKEN_SECRET: string =
    process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString('hex');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const PASSWORD_RESET_TOKEN_EXPIRY = '1h';

export const generateAccessToken = (payload: UserPayload): string => {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload: UserPayload): string => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const generatePasswordResetToken = (payload: PasswordResetPayload): string => {
    const resetTokenSecret = ACCESS_TOKEN_SECRET + payload.password;
    return jwt.sign(
        { userId: payload.userId, email: payload.email },
        resetTokenSecret,
        { expiresIn: PASSWORD_RESET_TOKEN_EXPIRY }
    );
};

export const verifyAccessToken = (token: string): UserPayload => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as UserPayload;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

export const verifyRefreshToken = (token: string): UserPayload => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET) as UserPayload;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

export const verifyPasswordResetToken = (
    token: string,
    userPassword: string
): { userId: number; email: string } => {
    try {
        const resetTokenSecret = ACCESS_TOKEN_SECRET + userPassword;
        return jwt.verify(token, resetTokenSecret) as { userId: number; email: string };
    } catch (error) {
        throw new Error('Invalid or expired password reset token');
    }
};