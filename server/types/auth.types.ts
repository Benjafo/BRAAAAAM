import { Request } from "express";

export interface Permission {
    id: number;
    title?: string;
    description?: string;
}

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    permissions: Permission[];
}

// For testing with hardcoded users only, remove this once we have database connection
export interface UserWithPassword extends User {
    password: string;
}

export interface LoginResponse {
    message?: string;
    accessToken: string;
    user: User;
}

export interface TokenPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    db: string;
}

export interface PasswordResetPayload {
    userId: string;
    email: string;
    password: string;
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}

export interface TokenData {
    token: string;
    createdAt: Date;
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
