
import type { AuthService, Credentials, LoginResponse, RefreshResponse } from '@/lib/types';
import type { KyInstance } from 'ky';

export const makeAuthService = (http: KyInstance): AuthService => ({
  async login(creds: Credentials): Promise<LoginResponse> {
    return http.post('auth/sign-in', { json: creds }).json<LoginResponse>();
  },
  async logout(): Promise<void> {
    // If your API doesn't need this, it's fine to noop.
    await http.post('auth/sign-out').catch(() => {});
  },
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return http.post('auth/token-refresh', { json: { refreshToken } }).json<RefreshResponse>();
  },
});
