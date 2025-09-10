import { ContractStatuses, Providers } from "@/types/mytonstorage";
import { ApiResponse } from "./types";
import { handleError } from "./utils";
import axios from "axios"

// Provider API host from env
const mtpoHost = (typeof process !== 'undefined' && process.env.PUBLIC_MTPO_HOST) || "https://mytonprovider.org"

const requestCache = new Map<string, Promise<ApiResponse>>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function getProvidersStorageChecks(addresses: string[]): Promise<ApiResponse> {
    const cacheKey = `checks-${JSON.stringify(addresses)}`;
    
    if (requestCache.has(cacheKey)) {
        console.log(`Using cached request for checks with addresses: ${JSON.stringify(addresses)}`);
        return requestCache.get(cacheKey)!;
    }
    
    const requestPromise = (async () => {
        try {
            const result = await fetchProvidersChecks(addresses);
            
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

async function fetchProvidersChecks(addresses: string[]): Promise<ApiResponse> {
    var error: string | null = null;
    var status: number | null = null;
    var data: ContractStatuses | null = null;

    try {
        const response = await axios.post(`${mtpoHost}/api/v1/contracts/statuses`, {
            contracts: addresses
        }, {
            headers: { 'Content-Type': 'application/json' },
        });
        data = response.data as ContractStatuses;
        status = response.status;
    } catch (err: any) {
        error = handleError(err);
        if (err.response?.status) {
            status = err.response.status;
        }
    }

    return { error, status, data };
}

async function fetchProvidersData(exact?: string[]): Promise<ApiResponse> {
    var error: string | null = null;
    var status: number | null = null;
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
        status = response.status;
    } catch (err: any) {
        error = handleError(err);
        if (err.response?.status) {
            status = err.response.status;
        }
    }

    return { error, status, data };
}
