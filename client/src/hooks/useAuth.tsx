import { useMutation } from '@tanstack/react-query';
import { authStore } from '@/components/stores/authStore';
import type { Credentials, LoginResponse, ResetPasswordCredentials } from '@/lib/types';
import { useAuthService } from '@/services/auth/serviceResolver';
// import { authService } from '@/services/auth/serviceResolver';

export function useLogin() {

  const authService = useAuthService();

  return useMutation({
    mutationFn: (vars: Credentials) => authService.login(vars),
    onSuccess: (res: LoginResponse) => {
      authStore.getState().setAuth({
        subdomain: res.subdomain ?? null,
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
  
  const authService = useAuthService();

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

  const authService = useAuthService();

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

  const authService = useAuthService();
  
  return useMutation({
    mutationFn: (vars: ResetPasswordCredentials & { token: string, id: string }) => authService.resetPassword(vars),
    onError: (error) => {
      if (import.meta.env.DEV) {
          console.error("useResetPassword error", error)
      }
    }
  })
}