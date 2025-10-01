import { useMutation } from '@tanstack/react-query';
import { authStore } from '@/components/stores/authStore';
import type { LoginResponse } from '@/lib/types';
import { authService } from '@/services/auth/serviceResolver';

export function useLogin() {
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) => authService.login(vars),
    onSuccess: (res: LoginResponse) => {
      authStore.getState().setAuth({
        user: res.user,
        role: res.role,
        permissions: res.permissions,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken ?? null,
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
          console.error("SignInform onSubmit error", error)
      }
    }
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      authStore.getState().clearAuth();
    },
    // Even if server logout fails, you often want to clear local state anyway:
    onError: () => {
      authStore.getState().clearAuth();
    },
  });
}
