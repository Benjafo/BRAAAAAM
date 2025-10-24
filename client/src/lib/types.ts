export type Permission = {
    id: string;
    title?: string;
    description?: string;
};

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: Permission[];
}

// export interface AuthResponse {
//     user: User;
//     token: string;
// }

// export interface SignInRequest {
//     email: string;
//     password: string;
// }

export type RefreshAccessTokenRequest = {
    message?: string;
    accessToken: string;
};

export type Credentials = { email: string; password: string };

// export type Permission = 'read' | 'write' | 'publish' | 'admin';

export type LoginResponse = {
    user: User;
    role: string;
    permissions: Permission[];
    accessToken: string;
    refreshToken?: string;
};

export type RefreshResponse = {
    accessToken: string;
    refreshToken?: string;
};

export type ForgotPasswordResponse = {
    redactedEmail: string;
    expiresAt: string;
    message?: string;
};

export type ResetPasswordCredentials = {
    newPassword: string;
    confirmNewPassword: string;
};

export interface AuthService {
    login(form: Credentials): Promise<LoginResponse>;
    logout(): Promise<void>;
    resetPassword(form: ResetPasswordCredentials & { token: string }): Promise<void>;
    forgotPassword(form: { email: string }): Promise<ForgotPasswordResponse>;
    refresh?(refreshToken: string): Promise<RefreshResponse>;
}
export type Location = {
    placeId: string;
    address: string;
    addressComponents?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    coordinates: {
        lat: number;
        lng: number;
    };
};

export type LocationSelectorProps = {
    onLocationSelect: (location: Location | null) => void;
    placeholder?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
};
