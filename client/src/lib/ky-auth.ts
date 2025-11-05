import { authStore, useAuthStore, useIsAuthed } from "@/components/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import type { RefreshAccessTokenRequest } from "./types";
// import type { RefreshAccessTokenRequest } from "./types";

const kyWithAuth = ky.create({
    prefixUrl: import.meta.env.BASE_URL,
    credentials: "include",
    hooks: {
        beforeRequest: [
            (request) => {
                const isAuthed = useIsAuthed()
                const accessToken = useAuthStore((s) => s.accessToken);

                if (!isAuthed || !accessToken) return;
                request.headers.set("Authorization", `Bearer ${accessToken}`);

                // const { subdomain } = useParams({strict: false});
                // if(subdomain) {request.headers.set('x-org-subdomain', subdomain);}

                /**
                 * Possibly add a TTL for the refresh token in the response
                 * to let a user know when their session is about to expire
                 */
            },
        ],
        beforeRetry: [
            async ({ options, error }) => {
                
                const navigate = useNavigate();

                if (!(error instanceof HTTPError)) return;

                try {
                    const res = await ky
                        .post("auth/token-refresh", { ...options, retry: 0 })
                        .json<RefreshAccessTokenRequest>();

                        authStore.getState().setAuth({
                            accessToken: res.accessToken
                        })

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
                            onClick: () => navigate({ to: "/{-$subdomain}/sign-in" }) /**Probably not an issue */,
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
