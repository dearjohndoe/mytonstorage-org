import { Providers } from "@/types/mytonstorage";
import { ApiResponse } from "./types";
import { handleError } from "./utils";
import axios from "axios"

// Provider API host from env
const mtpoHost = (typeof process !== 'undefined' && process.env.PUBLIC_MTPO_HOST) || "https://mytonprovider.org"

const requestCache = new Map<string, Promise<ApiResponse>>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getProviders(exact?: string[]): Promise<ApiResponse> {
    const cacheKey = `providers-${JSON.stringify(exact || [])}`;
    
    if (requestCache.has(cacheKey)) {
        console.log(`Using cached request for providers with exact: ${JSON.stringify(exact)}`);
        return requestCache.get(cacheKey)!;
    }
    
    const requestPromise = (async () => {
        try {
            const result = await fetchProvidersData(exact);
            
            // Если есть ошибка, не кешируем результат
            if (result.error) {
                requestCache.delete(cacheKey);
            }
            
            return result;
        } finally {
            setTimeout(() => {
                requestCache.delete(cacheKey);
            }, CACHE_TTL);
        }
    })();
    
    requestCache.set(cacheKey, requestPromise);
    
    return requestPromise;
}

async function fetchProvidersData(exact?: string[]): Promise<ApiResponse> {
    var error: string | null = null;
    var data: Providers | null = null;

    try {
        const response = await axios.post(`${mtpoHost}/api/v1/providers/search`, {
            filters: {
                uptime_gt_percent: 50
            },
            sort: {
                column: "rating",
                order: "desc"
            },
            exact: exact || [],
            limit: 1000,
            offset: 0
        }, {
            headers: { 'Content-Type': 'application/json' },
        });
        data = response.data as Providers;
    } catch (err) {
        error = handleError(err);
    }

    return { error, data };
}
