import { authStore } from "@/components/stores/authStore";
import type { Credentials, LoginResponse, ResetPasswordCredentials } from "@/lib/types";
import { authService } from "@/services/auth/serviceResolver";
import { useMutation } from "@tanstack/react-query";

export function useLogin() {
    return useMutation({
        mutationFn: (vars: Credentials) => authService.login(vars),
        onSuccess: (res: LoginResponse) => {
            // Backend sends objects with { permKey, roleGrant, userGrant, effective }
            // We only want the permKey strings where effective = true
            const effectivePermissions = res.permissions
                .filter(p => p.effective === true)
                .map(p => p.permKey);

            authStore.getState().setAuth({
                user: res.user,
                role: res.role,
                permissions: effectivePermissions,
                accessToken: res.accessToken,
                refreshToken: res.refreshToken ?? null,
            });
        },
        onError: (error) => {
            if (import.meta.env.DEV) {
                console.error("useLogin error", error);
            }
        },
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
                console.error("useLogout error", error);
            }
            authStore.getState().clearAuth();
        },
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (vars: { email: string }) => authService.forgotPassword(vars),
        onError: (error) => {
            if (import.meta.env.DEV) {
                console.error("useForgotPassword error", error);
            }
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: (vars: ResetPasswordCredentials & { token: string }) =>
            authService.resetPassword(vars),
        onError: (error) => {
            if (import.meta.env.DEV) {
                console.error("useResetPassword error", error);
            }
        },
    });
}
