// src/auth/authStore.ts
import type { User } from "@/lib/types";
import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

type AuthState = {
    user: User | null;
    role: string | null;
    permissions: string[];
    accessToken: string | null;
    refreshToken: string | null;
};

type AuthActions = {
    setAuth: (data: Partial<AuthState>) => void;
    clearAuth: () => void;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    canAccess: (resource: string, action: string) => boolean;
};

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
    user: null,
    role: null,
    permissions: [],
    accessToken: null,
    refreshToken: null,
};

export const authStore = createStore<AuthStore>()(
    persist(
        (set, get) => ({
            ...initialState,
            setAuth: (data) => set((s) => ({ ...s, ...data })),
            clearAuth: () => set(initialState),

            hasPermission: (permission: string) => {
                return get().permissions.includes(permission);
            },

            hasAnyPermission: (permissions: string[]) => {
                const { hasPermission } = get();
                return permissions.some((p) => hasPermission(p));
            },

            hasAllPermissions: (permissions: string[]) => {
                const { hasPermission } = get();
                return permissions.every((p) => hasPermission(p));
            },

            canAccess: (resource: string, action: string) => {
                const { hasPermission } = get();
                return hasPermission(`${resource}.${action}`);
            },
        }),
        {
            name: "auth-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                user: s.user,
                role: s.role,
                permissions: s.permissions,
                accessToken: s.accessToken,
                refreshToken: s.refreshToken,
            }),
        }
    )
);

export const useAuthStore = <T,>(selector: (s: AuthStore) => T): T => useStore(authStore, selector);

export const useIsAuthed = () => useAuthStore((s) => Boolean(s.user && s.accessToken));
