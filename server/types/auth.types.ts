import { Request } from 'express';

export interface User {
    id: number;
    email: string;
    name?: string;
    username?: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface UserPayload {
    id: number;
    email: string;
    username?: string;
}

export interface PasswordResetPayload {
    userId: number;
    email: string;
    password: string;
}

export interface AuthRequest extends Request {
    user?: UserPayload;
}

export interface TokenData {
    token: string;
    createdAt: Date;
}

export interface LoginResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        username?: string;
        firstName?: string;
        lastName?: string;
    };
}

export interface TokenResponse {
    message: string;
    accessToken: string;
}

export interface MessageResponse {
    message: string;
    resetToken?: string;
}

export interface ErrorResponse {
    error: string;
}