import { fetchWithAuth } from './api';

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
    try {
        const response = await fetchWithAuth(`/api/search/rawg?query=${encodeURIComponent(query)}`);
        if (!response.ok) return [];
        const json = await response.json();
        const data: RAWGResponse = json?.data?.results ? json.data : (json?.data ?? json);
        return data?.results || [];
    } catch (error) {
        console.error('Error searching RAWG:', error);
        return [];
    }
}

// Details are served by backend/library; no direct RAWG calls in frontend.
