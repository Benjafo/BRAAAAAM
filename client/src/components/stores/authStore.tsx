// src/auth/authStore.ts
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Permission, User } from '@/lib/types';

type AuthState = {
  subdomain: string | null;
  user: User | null;
  role: string | null;
  permissions: Permission[];
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthActions = {
  setAuth: (data: Partial<AuthState>) => void;
  clearAuth: () => void;
};

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  subdomain: null,
  user: null,
  role: null,
  permissions: [],
  accessToken: null,
  refreshToken: null,
};

export const authStore = createStore<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: (data) => set((s) => ({ ...s, ...data })),
      clearAuth: () => set(initialState),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        subdomain: s.subdomain,
        user: s.user,
        role: s.role,
        permissions: s.permissions,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    }
  )
);

export const useAuthStore = <T,>(selector: (s: AuthStore) => T): T =>
  useStore(authStore, selector);

export const useIsAuthed = () => useAuthStore((s) => Boolean(s.user && s.accessToken));
