
import type { AuthService, Credentials, LoginResponse, RefreshResponse } from '@/lib/types';
import type { KyInstance } from 'ky';

export const makeAuthService = (http: KyInstance): AuthService => ({
  async login(creds: Credentials): Promise<LoginResponse> {
    return http.post('auth/login', { json: creds }).json<LoginResponse>();
  },
  async logout(): Promise<void> {
    // If your API doesn't need this, it's fine to noop.
    await http.post('auth/logout').catch(() => {});
  },
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return http.post('auth/refresh', { json: { refreshToken } }).json<RefreshResponse>();
  },
});
