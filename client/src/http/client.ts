import type { KyInstance } from "ky";
import ky from "ky";

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
                    const token = getAccessToken?.()
                    if(token) request.headers.set('Authorization', `Bearer ${token}`);
                    request.headers.set('Content-Type', 'application/json');
                    request.headers.set('Accept', 'application/json');

                    const subdomain = getSubdomain?.()
                    if(subdomain) {request.headers.set('x-org-subdomain', subdomain);}
                },
            ],
            beforeRetry: [
                //have to rest, this may not be needed.
                async ({ request }) => {
                    const token = getAccessToken?.();
                    if (token) request.headers.set("Authorization", `Bearer ${token}`);
                    request.headers.set("x-org-subdomain", "braaaaam");
                },
            ],
            afterResponse: [
                async (_request, _options, response) => {
                    if (response.status === 401 && onUnauthorized) {
                        await onUnauthorized();
                    }
                },
            ],
        },
        retry: { limit: 1 },
    });
};
