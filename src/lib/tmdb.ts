const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
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
    if (!TMDB_API_KEY) {
        console.warn('TMDB API Key is missing. Please set VITE_TMDB_API_KEY in your .env file.');
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

export function getTMDBImageUrl(path: string | null, size: 'w200' | 'w500' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-image.png'; // Replace with actual placeholder
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
