import type { KyInstance } from "ky";
import ky from "ky";

/* eslint-disable */

type CreateHttpClientOpts = {
    baseUrl?: string;
    getAccessToken?: () => string | null;
    onUnauthorized?: () => void | Promise<void>
    onRefresh?: () => void | Promise<void>
}

export const createHttpClient = (opts: CreateHttpClientOpts = {}): KyInstance => {

    const { baseUrl, getAccessToken, onUnauthorized, onRefresh } = opts;

    return ky.create({
        prefixUrl: baseUrl,
        hooks: {
            beforeRequest: [
                (request) => {
                    const token = getAccessToken?.()
                    if(token) request.headers.set('Authorization', `Bearer ${token}`);
                    request.headers.set('Content-Type', 'application/json');
                    request.headers.set('Accept', 'application/json');
                },
            ],
            beforeRetry: [ //have to rest, this may not be needed.
                async ({request, options, error, retryCount}) => {
                    const token = getAccessToken?.()
                    if(token) request.headers.set('Authorization', `Bearer ${token}`);
                }
            ],
            afterResponse: [
                async (_request, _options, response) => {
                    if(response.status === 401 && onUnauthorized){
                        await onUnauthorized();
                    }
                }
            ]
        },
        retry: { limit: 1 },
    })

} 