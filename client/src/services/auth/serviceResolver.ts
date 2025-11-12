// import { createHttpClient } from '@/http/httpClient';
// import { makeAuthService } from './authService.ky';
// import type { AuthService } from './auth.types';
// import { authStore } from './authStore';

import { authStore } from "@/components/stores/authStore";
import { makeAuthService } from "./authService";
import type { AuthService } from "@/lib/types";
import { createHttpClient } from "@/http/client";
import { useParams } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

// 👇 Point this import to YOUR mock service file:
// import { makeMockAuthService } from './mockAuthService'; // you already have this

// const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
// const API_URL = import.meta.env.VITE_API_URL;

// Keep a ref to the latest refresh token if you want refresh later:
// let refreshTokenRef: string | null = authStore.getState().refreshToken || null;

// If a 401 happens, decide what to do.
// Simple version: clear auth (or navigate to /login).
// const onUnauthorized = async () => {
//   authStore.getState().clearAuth();
// };

// const { subdomain } = useParams({ strict: false });

// const getSubdomain = useCallback(() => subdomain, [subdomain]);

// const http = createHttpClient({
//   baseUrl: import.meta.env.BASE_URL,
//   getSubdomain: getSubdomain,
//   getAccessToken: () => authStore.getState().accessToken,
//   onUnauthorized: () => onUnauthorized(),
// });

// const realService = makeAuthService(http);



export function useAuthService(): AuthService {
  const { subdomain } = useParams({ strict: false });

  const getSubdomain = useCallback(() => subdomain, [subdomain]);
  const http = useMemo(
    () =>
      createHttpClient({
        baseUrl: import.meta.env.DEV ? import.meta.env.BASE_URL : 'http://localhost:3000/', // note: BASE_URL is the public path, usually not your API
        getSubdomain,
        getAccessToken: () => authStore.getState().accessToken,
        onUnauthorized: () => authStore.getState().clearAuth(),
      }),
    [getSubdomain]
  );

  return useMemo(() => makeAuthService(http), [http]);
}

// export const authService: AuthService = useAuthService()


/**@TODO use http/api.ts instead */
export const http = createHttpClient({
  baseUrl: import.meta.env.DEV ? import.meta.env.BASE_URL : 'http://localhost:3000/',
  getSubdomain: () => authStore.getState().subdomain ?? undefined,
  getAccessToken: () => authStore.getState().accessToken,
  onUnauthorized: () => authStore.getState().clearAuth(),
});

// Swap in your mock when desired
// export const authService: AuthService = USE_MOCKS ? makeMockAuthService() : realService;
// export const authService: AuthService = realService

// Keep local refs in sync when tokens change
// const unsub = authStore.subscribe((s) => {
//   refreshTokenRef = s.refreshToken;
// });

// OPTIONAL: If you later add auto-refresh, you can change onUnauthorized like this:
// const onUnauthorized = async () => {
//   if (!realService.refresh || !refreshTokenRef) {
//     authStore.getState().clearAuth();
//     return;
//   }
//   try {
//     const res = await realService.refresh(refreshTokenRef);
//     authStore.getState().setTokens(res.accessToken ?? null, res.refreshToken ?? null);
//     // You could retry the failed request here by moving refresh logic into ky's afterResponse.
//   } catch {
//     authStore.getState().clearAuth();
//   }
// };
