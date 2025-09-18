export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
}

export interface SignInRequest {
    email: string;
    password: string;
}
