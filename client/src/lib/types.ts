export interface Permission {
    id: string;
    title?: string;
    description?: string; 
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: Permission[];
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface SignInRequest {
    email: string;
    password: string;
}

export type RefreshAccessTokenRequest = {
    message?: string,
    accessToken: string,
}
