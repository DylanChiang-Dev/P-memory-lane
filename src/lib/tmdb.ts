import { apiConfigManager } from './apiConfig';

const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBResult {
    id: number;
    title?: string; // For movies
    name?: string; // For TV shows
    poster_path: string | null;
    release_date?: string; // For movies
    first_air_date?: string; // For TV shows
    vote_average: number;
    overview: string;
    media_type: 'movie' | 'tv';
}

export interface TMDBResponse {
    page: number;
    results: TMDBResult[];
    total_pages: number;
    total_results: number;
}

export async function searchTMDB(query: string, type: 'movie' | 'tv' | 'multi' = 'multi'): Promise<TMDBResult[]> {
    const TMDB_API_KEY = apiConfigManager.getTMDBKey();

    if (!TMDB_API_KEY) {
        console.warn('TMDB API Key is missing. Please configure it in /admin/settings.');
        return [];
    }

    try {
        const response = await fetch(
            `${BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=zh-TW&include_adult=false`
        );

        if (!response.ok) {
            throw new Error(`TMDB API Error: ${response.statusText}`);
        }

        const data: TMDBResponse = await response.json();

        // Filter out results without posters or very low popularity if needed
        return data.results.filter(item => item.poster_path);
    } catch (error) {
        console.error('Error searching TMDB:', error);
        return [];
    }
}

// Search for TV shows (variety, talk show, reality) instead of documentaries
export const searchDocumentaries = async (query: string): Promise<TMDBResult[]> => {
    // Search TV shows - genre IDs: 10767 (Talk), 10764 (Reality), 10763 (News)
    // Also include general TV search since Chinese variety shows may not have these genres
    return await searchTMDB(query, 'tv');
};

export async function getTMDBDetails(id: number, type: 'movie' | 'tv'): Promise<TMDBResult | null> {
    const TMDB_API_KEY = apiConfigManager.getTMDBKey();
    if (!TMDB_API_KEY) return null;

    try {
        const response = await fetch(
            `${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=zh-TW`
        );
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`Error fetching TMDB details for ${type} ${id}:`, error);
        return null;
    }
}

export function getTMDBImageUrl(path: string | null, size: 'w200' | 'w500' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-image.png'; // Replace with actual placeholder
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
