
import type { AuthService, Credentials, ForgotPasswordResponse, LoginResponse, RefreshResponse, ResetPasswordCredentials } from '@/lib/types';
import type { KyInstance } from 'ky';

export const makeAuthService = (http: KyInstance): AuthService => ({
  async login(vars: Credentials): Promise<LoginResponse> {
    return http.post('auth/sign-in', { json: vars }).json<LoginResponse>();
  },
  async logout(): Promise<void> {
    await http.post('auth/sign-out').catch(() => {});
  },
  async forgotPassword(vars: { email: string }): Promise<ForgotPasswordResponse> {
    return http.post('auth/request-password-reset', { json: vars }).json<ForgotPasswordResponse>();
  },
  async resetPassword(vars: ResetPasswordCredentials & { token: string, id: string }): Promise<void> {
    // not sure if we want to do anything with this catch
    const { token, id, ...form } = vars;
    await http.post('auth/reset-password', { json: { ...form }, searchParams: { token, id }}).catch(() => {});

  },
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return http.post('auth/token-refresh', { json: { refreshToken } }).json<RefreshResponse>();
  },
});
