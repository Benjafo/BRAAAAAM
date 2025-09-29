import { useAuthStore } from "@/components/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import type { RefreshAccessTokenRequest } from "./types";

const kyWithAuth = ky.create({
    prefixUrl: import.meta.env.BASE_URL,
    credentials: "include",
    hooks: {
        beforeRequest: [
            (request) => {
                const { isAuthenticated, token } = useAuthStore.getState();

                if (!isAuthenticated || !token) return;
                request.headers.set("Authorization", `Bearer ${token}`);

                /**
                 * Possibly add a TTL for the refresh token in the response
                 * to let a user know when their session is about to expire
                 */
            },
        ],
        beforeRetry: [
            async ({ options, error }) => {
                const { setToken } = useAuthStore();
                const navigate = useNavigate();

                if (!(error instanceof HTTPError)) return;

                try {
                    const res = await ky
                        .post("auth/token-refresh", { ...options, retry: 0 })
                        .json<RefreshAccessTokenRequest>();

                    setToken(res.accessToken);
                } catch (error) {
                    if (import.meta.env.DEV) {
                        console.error(error);
                    }

                    toast.error("Session expired", {
                        id: "invalid-session",
                        description: "You have been logged out.",
                        duration: Infinity,
                        cancel: {
                            label: "Sign-in",
                            onClick: () => navigate({ to: "/sign-in" }) /**Probably not an issue */,
                        },
                    });
                }
            },
        ],
    },
    retry: {
        limit: 1,
        statusCodes: [401, 403, 500, 504],
    },
});

export { kyWithAuth as ky };
