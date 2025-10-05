import { useMutation } from '@tanstack/react-query';
import { authStore } from '@/components/stores/authStore';
import type { Credentials, LoginResponse, ResetPasswordCredentials } from '@/lib/types';
import { authService } from '@/services/auth/serviceResolver';

export function useLogin() {
  return useMutation({
    mutationFn: (vars: Credentials) => authService.login(vars),
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
          console.error("useLogin error", error)
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
    // Even if server logout fails, clear local state anyway:
    onError: (error) => {
      if (import.meta.env.DEV) {
          console.error("useLogout error", error)
      }
      authStore.getState().clearAuth();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (vars: { email: string}) => authService.forgotPassword(vars),
    onError: (error) => {
      if (import.meta.env.DEV) {
          console.error("useForgotPassword error", error)
      }
    }
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (vars: ResetPasswordCredentials & { token: string }) => authService.resetPassword(vars),
    onError: (error) => {
      if (import.meta.env.DEV) {
          console.error("useResetPassword error", error)
      }
    }
  })
}