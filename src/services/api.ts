import { MarketData, ChatResponse } from '../types';
import { MARKET_DATA } from '../data/marketData';
import { IMAGE_MAP } from '../utils/imageMap';

// For development with Expo Go, use your machine's local IP or localhost
const API_BASE = 'http://192.168.43.151:3000'; // Changed to local IP for device access

const API_TIMEOUT = 10000;

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return (await response.json()) as T;
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection.');
        }

        throw error;
    }
}

export async function fetchMarketData(): Promise<MarketData> {
    try {
        return await apiRequest<MarketData>('/api/market-data');
    } catch (error) {
        console.warn('Failed to fetch market data from API, falling back to local data:', error);
        return MARKET_DATA;
    }
}

export async function sendChatMessage(
    message: string,
    context: {
        cart?: any[];
        orderHistory?: any[];
        attached_skus?: any[];
        attachedVendors?: any[];
    } = {}
): Promise<ChatResponse> {
    return apiRequest<ChatResponse>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
    });
}

export function resolveImageUrl(path: string | undefined | null): any {
    if (!path) return null;
    if (IMAGE_MAP[path]) return IMAGE_MAP[path];
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
}

export function resolveImageSource(path: string | undefined | null): any {
    const src = resolveImageUrl(path);
    if (!src) return undefined;
    if (typeof src === 'string') return { uri: src };
    return src;
}

export { API_BASE };
