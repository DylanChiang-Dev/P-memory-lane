import { fetchWithAuth } from './api';

const BACKEND_BASE = '/api/search/tmdb';

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
    try {
        if (type === 'multi') {
            const [movies, tv] = await Promise.all([
                searchTMDB(query, 'movie'),
                searchTMDB(query, 'tv'),
            ]);
            return [...movies, ...tv];
        }

        const response = await fetchWithAuth(`${BACKEND_BASE}?type=${type}&query=${encodeURIComponent(query)}`);

        if (!response.ok) return [];

        const json = await response.json();
        const data: TMDBResponse = json?.data?.results
            ? { page: json.data.page ?? 1, results: json.data.results, total_pages: json.data.total_pages ?? 1, total_results: json.data.total_results ?? json.data.results.length }
            : (json?.data ?? json);

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

export function getTMDBImageUrl(path: string | null, size: 'w200' | 'w500' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-image.png'; // Replace with actual placeholder
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
