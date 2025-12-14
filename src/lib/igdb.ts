import { fetchWithAuth } from './api';

export interface IGDBGameResult {
    id: number;
    name: string;
    cover?: {
        id: number;
        image_id: string;
    };
    first_release_date?: number; // Unix timestamp
    total_rating?: number;
    summary?: string;
    platforms?: {
        id: number;
        name: string;
    }[];
}

export async function searchIGDB(query: string): Promise<IGDBGameResult[]> {
    try {
        const response = await fetchWithAuth(`/api/search/igdb?query=${encodeURIComponent(query)}`);
        if (!response.ok) return [];
        const json = await response.json();
        const data: IGDBGameResult[] = json?.data ?? json;
        return Array.isArray(data) ? data : [];
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') throw error;
        console.error('Error searching IGDB:', error);
        return [];
    }
}

export function getIGDBImageUrl(imageId: string | undefined, size: 'cover_small' | 'cover_big' | 'screenshot_med' | '720p' | '1080p' = 'cover_big'): string {
    if (!imageId) return '/placeholder.png';
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
