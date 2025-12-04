import { apiConfigManager } from './apiConfig';

const BASE_URL = 'https://api.rawg.io/api';

export interface RAWGGameResult {
    id: number;
    name: string;
    background_image: string | null;
    released: string;
    rating: number;
    platforms: {
        platform: {
            id: number;
            name: string;
            slug: string;
        };
    }[];
}

export interface RAWGResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: RAWGGameResult[];
}

export async function searchRAWG(query: string): Promise<RAWGGameResult[]> {
    const RAWG_API_KEY = apiConfigManager.getRAWGKey();

    if (!RAWG_API_KEY) {
        console.warn('RAWG API Key is missing. Please configure it in /admin/settings.');
        return [];
    }

    try {
        const response = await fetch(
            `${BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=20`
        );

        if (!response.ok) {
            throw new Error(`RAWG API Error: ${response.statusText}`);
        }

        const data: RAWGResponse = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error searching RAWG:', error);
        return [];
    }
}

export async function getGameDetails(id: number): Promise<RAWGGameResult | null> {
    const RAWG_API_KEY = apiConfigManager.getRAWGKey();
    if (!RAWG_API_KEY) return null;

    try {
        const response = await fetch(`${BASE_URL}/games/${id}?key=${RAWG_API_KEY}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching RAWG game details:', error);
        return null;
    }
}
