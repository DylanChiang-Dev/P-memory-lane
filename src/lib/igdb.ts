import { apiConfigManager } from './apiConfig';

const BASE_URL = '/igdb-proxy';

// Note: IGDB API requires CORS headers to be set properly.
// If you encounter CORS issues in production, route through your backend.

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
    const credentials = apiConfigManager.getIGDBCredentials();

    if (!credentials) {
        console.warn('IGDB Credentials missing. Please configure Client ID and Access Token.');
        return [];
    }



    try {
        const response = await fetch(`${BASE_URL}/games`, {
            method: 'POST',
            headers: {
                'Client-ID': credentials.clientId,
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'text/plain',
            },
            body: `
                search "${query}";
                fields name, cover.image_id, first_release_date, total_rating, summary, platforms.name;
                limit 20;
            `
        });

        if (!response.ok) {
            throw new Error(`IGDB API Error: ${response.statusText}`);
        }

        const data: IGDBGameResult[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching IGDB:', error);
        return [];
    }
}

export async function getIGDBGameDetails(id: number): Promise<IGDBGameResult | null> {
    const credentials = apiConfigManager.getIGDBCredentials();

    if (!credentials) return null;

    try {
        const response = await fetch(`${BASE_URL}/games`, {
            method: 'POST',
            headers: {
                'Client-ID': credentials.clientId,
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'text/plain',
            },
            body: `
                fields name, cover.image_id, first_release_date, total_rating, summary, platforms.name;
                where id = ${id};
            `
        });

        if (!response.ok) return null;

        const data: IGDBGameResult[] = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error fetching IGDB game details:', error);
        return null;
    }
}

export function getIGDBImageUrl(imageId: string | undefined, size: 'cover_small' | 'cover_big' | 'screenshot_med' | '720p' | '1080p' = 'cover_big'): string {
    if (!imageId) return '/placeholder.png';
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
