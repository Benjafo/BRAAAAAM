import { authStore } from "@/components/stores/authStore";
import type { RefreshResponse } from "@/lib/types";
import type { KyInstance } from "ky";
import ky from "ky";
import { toast } from "sonner";

type CreateHttpClientOpts = {
    baseUrl?: string;
    getSubdomain?: () => string | undefined;
    getAccessToken?: () => string | null;
    onUnauthorized?: () => void | Promise<void>;
    onRefresh?: () => void | Promise<void>;
};

export const createHttpClient = (opts: CreateHttpClientOpts = {}): KyInstance => {
    const { baseUrl, getSubdomain, getAccessToken, onUnauthorized, onRefresh } = opts;

    // This is a temp fix for build for unused variables. @TODO NEED TO AMEND tsconfig.build.json
    void onRefresh;

    return ky.create({
        prefixUrl: baseUrl,
        hooks: {
            beforeRequest: [
                (request) => {
                    const token = getAccessToken?.();
                    if (token) request.headers.set("Authorization", `Bearer ${token}`);
                    request.headers.set("Content-Type", "application/json");
                    request.headers.set("Accept", "application/json");

                    const subdomain = getSubdomain?.();
                    if (subdomain) request.headers.set("x-org-subdomain", subdomain);
                },
            ],
            beforeRetry: [
                //Sets most up-to-date access token on retry
                async ({ request }) => {
                    const token = getAccessToken?.();
                    if (token) request.headers.set("Authorization", `Bearer ${token}`);
                },
            ],
            afterResponse: [
                async (_request, _options, response, state) => {

                    if (
                        response.status === 401 &&
                        state.retryCount === 0 &&
                        Boolean(authStore.getState().user && authStore.getState().accessToken)
                    ) {
                        try {

                            const headers = new Headers()
                            headers.set("Content-Type", "application/json");
                            headers.set("Accept", "application/json");
                            const currentToken = getAccessToken?.();
                            if (currentToken) headers.set("Authorization", `Bearer ${currentToken}`);

                            const orgSubdomain = getSubdomain?.();
                            if (orgSubdomain) headers.set("x-org-subdomain", orgSubdomain);

                            const { accessToken } = await ky
                                .post("auth/token-refresh", {
                                    prefixUrl: baseUrl,
                                    headers: headers,
                                })
                                .json<RefreshResponse>();
                            authStore.getState().setAuth({ accessToken: accessToken });
                        } catch {
                            console.log("Failed to refresh token");
                            toast.error("You have been logged out", {
                                description: "Please sign-in again.",
                                duration: Infinity,
                                cancel: {
                                    label: 'Dismiss',
                                    onClick: () => {},
                                },
                            });

                            await onUnauthorized?.(); //sign-out script
                        }
                    }
                },
            ],
        },
        retry: { limit: 1 },
    });
};
