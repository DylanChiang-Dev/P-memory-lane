const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;
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
    if (!RAWG_API_KEY) {
        console.warn('RAWG API Key is missing. Please set VITE_RAWG_API_KEY in your .env file.');
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
