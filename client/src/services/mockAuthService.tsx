import type { User, AuthResponse, SignInRequest } from "../lib/types";

// Mock user database
const MOCK_USERS: Record<string, { user: User; password: string }> = {
    "admin@gmail.com": {
        user: {
            id: "1",
            email: "admin@gmail.com",
            name: "Admin User",
            role: "admin",
        },
        password: "password123",
    },
    "driver@gmail.com": {
        user: {
            id: "2",
            email: "driver@gmail.com",
            name: "Driver User",
            role: "user",
        },
        password: "password1234",
    },
    "dispatcher@gmail.com": {
        user: {
            id: "3",
            email: "dispatcher@gmail.com",
            name: "Dispatcher User",
            role: "user",
        },
        password: "password1235",
    },
};

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

/**
 * Simulate API delay
 */
const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate mock JWT token
 */
const generateMockToken = (userId: string): string => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
        JSON.stringify({
            userId,
            exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
            iat: Math.floor(Date.now() / 1000),
        })
    );
    const signature = btoa(`mock-signature-${userId}-${Date.now()}`);
    return `${header}.${payload}.${signature}`;
};

/**
 * Store authentication tokens
 */
const setTokens = (token: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Store authentication token
 */
const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Store user data
 */
const setUser = (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Clear all authentication data
 */
const clearAuth = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Mock authentication service that simulates API calls
 * Replace this with real API calls when backend is ready
 */
export const mockAuthService = {
    /**
     * Mock sign in - validates credentials against mock database
     */
    async signIn(credentials: SignInRequest): Promise<AuthResponse> {
        // Simulate network delay
        await delay(800);

        const { email, password } = credentials;
        const mockUser = MOCK_USERS[email.toLowerCase()];

        // Simulate authentication failure
        if (!mockUser || mockUser.password !== password) {
            throw new Error("Invalid email or password");
        }

        // Generate mock tokens
        const token = generateMockToken(mockUser.user.id);
        const refreshToken = generateMockToken(`refresh-${mockUser.user.id}`);

        const response: AuthResponse = {
            user: mockUser.user,
            token,
            refreshToken,
        };

        // Store tokens and user data
        setTokens(token, refreshToken);
        setUser(mockUser.user);

        return response;
    },

    /**
     * Mock sign out
     */
    async signOut(): Promise<void> {
        // Simulate network delay
        await delay(300);
        clearAuth();
    },

    /**
     * Mock token refresh
     */
    async refreshToken(): Promise<string> {
        await delay(500);

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const user = this.getUser();
        if (!user) {
            throw new Error("No user data available");
        }

        // Generate new token
        const newToken = generateMockToken(user.id);
        setToken(newToken);

        return newToken;
    },

    /**
     * Get current authentication token
     */
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    /**
     * Get current user data
     */
    getUser(): User | null {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getToken() && !!this.getUser();
    },

    /**
     * Get available demo accounts for testing
     */
    getDemoAccounts() {
        return Object.entries(MOCK_USERS).map(([email, data]) => ({
            email,
            password: data.password,
            role: data.user.role,
            name: data.user.name,
        }));
    },
};
