import { create } from "zustand";
import { mockAuthService } from "../services/mockAuthService";
import type { User, SignInRequest } from "../lib/types";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    signIn: (credentials: SignInRequest) => Promise<void>;
    signOut: () => Promise<void>;
    initialize: () => void;
    clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // sign in logic
    signIn: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
            const response = await mockAuthService.signIn(credentials);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Sign in failed";
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: message,
            });
            throw error;
        }
    },

    // sign out logic
    signOut: async () => {
        set({ isLoading: true });

        try {
            await mockAuthService.signOut();
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error("Sign out error:", error);
            // Clear state anyway
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        }
    },

    initialize: () => {
        const user = mockAuthService.getUser();
        const isAuthenticated = mockAuthService.isAuthenticated();

        set({
            user,
            isAuthenticated,
            isLoading: false,
            error: null,
        });
    },

    clearError: () => set({ error: null }),
}));
