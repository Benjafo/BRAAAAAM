import { authStore } from "@/components/stores/authStore";
import { createHttpClient } from "./client";

export const api = createHttpClient({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    getSubdomain: () => authStore.getState().subdomain ?? undefined,
    getAccessToken: () => authStore.getState().accessToken,
    onUnauthorized: () => authStore.getState().clearAuth(),
});