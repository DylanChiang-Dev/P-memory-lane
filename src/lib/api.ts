import { auth, API_BASE_URL } from './auth';
import { getTMDBDetails, getTMDBImageUrl } from './tmdb';
import { getPodcastDetails } from './itunes';
import { getAnimeDetails } from './anilist';
import { getBookDetails } from './googleBooks';
import { getGameDetails } from './rawg';
import { getIGDBGameDetails, getIGDBImageUrl } from './igdb';

export interface Activity {
    date: string;
    value: number;
    intensity?: "low" | "medium" | "high";
    notes?: string;
}

export interface Stats {
    total_days: number;
    total_minutes: number;
    current_streak: number;
    longest_streak: number;
    monthly_breakdown: { month: number; days: number; minutes: number }[];
}

// Helper to fetch with auth header
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = auth.getAccessToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        auth.clearTokens();
        // Do not reload, let AuthManager handle the UI
        throw new Error('Unauthorized');
    }

    return response;
}

export async function fetchHeatmapData(type: string, year: number): Promise<Activity[]> {
    try {
        const response = await fetchWithAuth(`/api/activities/heatmap?type=${type}&year=${year}`);
        if (!response.ok) return [];
        const json = await response.json();
        return json.success ? json.data : [];
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') return [];
        console.error(`Error fetching heatmap for ${type}:`, error);
        return [];
    }
}

export async function fetchStats(type: string, year: number): Promise<Stats> {
    try {
        const response = await fetchWithAuth(`/api/activities/stats?type=${type}&year=${year}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const json = await response.json();
        return json.success ? json.data : {
            total_days: 0,
            total_minutes: 0,
            current_streak: 0,
            longest_streak: 0,
            monthly_breakdown: []
        };
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return {
                total_days: 0,
                total_minutes: 0,
                current_streak: 0,
                longest_streak: 0,
                monthly_breakdown: []
            };
        }
        console.error(`Error fetching stats for ${type}:`, error);
        return {
            total_days: 0,
            total_minutes: 0,
            current_streak: 0,
            longest_streak: 0,
            monthly_breakdown: []
        };
    }
}

export async function submitCheckin(data: any) {
    try {
        const response = await fetchWithAuth('/api/activities/checkin', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const json = await response.json();
        return json;
    } catch (error) {
        console.error('Error submitting checkin:', error);
        return { success: false, error: 'Network error' };
    }
}

// Extended media type definition
export type MediaType = 'movies' | 'tv-shows' | 'books' | 'games' | 'podcasts' | 'documentaries' | 'anime';

// Map new types to existing endpoints (temporary until backend supports them)
const MEDIA_TYPE_API_MAP: Record<MediaType, string> = {
    'movies': 'movies',
    'tv-shows': 'tv-shows',
    'books': 'books',
    'games': 'games',
    'podcasts': 'podcasts',
    'documentaries': 'documentaries',
    'anime': 'anime',
};

// Media Library API
export async function fetchMediaItems(type: MediaType, status?: string) {
    try {
        const apiType = MEDIA_TYPE_API_MAP[type];
        const url = status
            ? `/api/library/${apiType}?status=${status}`
            : `/api/library/${apiType}`;
        const response = await fetchWithAuth(url);
        if (!response.ok) return [];
        const json = await response.json();

        const items = json.success ? json.data.items : [];

        // Enrich items with metadata
        return await Promise.all(items.map(async (item: any) => {
            // If we already have a full URL for poster/cover, assume it's good
            if (item.poster_path?.startsWith('http') || item.cover_image?.startsWith('http')) return item;

            try {
                let details: any = null;

                if (type === 'movies' && item.tmdb_id) {
                    details = await getTMDBDetails(item.tmdb_id, 'movie');
                    if (details?.poster_path) {
                        details.poster_path = getTMDBImageUrl(details.poster_path);
                    }
                } else if (type === 'tv-shows' && item.tmdb_id) {
                    details = await getTMDBDetails(item.tmdb_id, 'tv');
                    if (details?.poster_path) {
                        details.poster_path = getTMDBImageUrl(details.poster_path);
                    }
                } else if (type === 'documentaries' && item.tmdb_id) {
                    details = await getTMDBDetails(item.tmdb_id, 'tv');
                    if (details?.poster_path) {
                        details.poster_path = getTMDBImageUrl(details.poster_path);
                    }
                } else if (type === 'podcasts' && item.itunes_id) {
                    details = await getPodcastDetails(item.itunes_id);
                } else if (type === 'anime' && item.anilist_id) {
                    details = await getAnimeDetails(item.anilist_id);
                } else if (type === 'books' && item.google_books_id) {
                    details = await getBookDetails(item.google_books_id);
                } else if (type === 'games' && item.igdb_id) {
                    details = await getIGDBGameDetails(item.igdb_id);
                    if (details?.cover?.image_id) {
                        details.cover_url = getIGDBImageUrl(details.cover.image_id);
                    }
                } else if (type === 'games' && item.rawg_id) {
                    // Fallback for existing items
                    details = await getGameDetails(item.rawg_id);
                }

                if (details) {
                    // Merge details but preserve critical user fields (id, status)
                    return { ...item, ...details, id: item.id, status: item.status };
                }
            } catch (e) {
                console.error('Failed to enrich item:', item, e);
            }
            return item;
        }));
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') return [];
        console.error(`Error fetching ${type}:`, error);
        return [];
    }
}

export async function addMediaItem(type: MediaType, data: any) {
    try {
        const apiType = MEDIA_TYPE_API_MAP[type];
        const response = await fetchWithAuth(`/api/library/${apiType}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error(`Error adding ${type}:`, error);
        return { success: false, error: 'Network error' };
    }
}

export async function updateMediaItem(type: MediaType, id: number, data: any) {
    try {
        const apiType = MEDIA_TYPE_API_MAP[type];
        const response = await fetchWithAuth(`/api/library/${apiType}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error(`Error updating ${type}:`, error);
        return { success: false, error: 'Network error' };
    }
}

export async function deleteMediaItem(type: MediaType, id: number) {
    try {
        const apiType = MEDIA_TYPE_API_MAP[type];
        const response = await fetchWithAuth(`/api/library/${apiType}/${id}`, {
            method: 'DELETE',
        });
        return await response.json();
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        return { success: false, error: 'Network error' };
    }
}


export async function fetchUserSettings() {
    try {
        const response = await fetchWithAuth('/api/user/settings');
        if (!response.ok) return null;
        const json = await response.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return null;
    }
}

export async function saveUserSettings(data: any) {
    try {
        const response = await fetchWithAuth('/api/user/settings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving user settings:', error);
        return { success: false, error: 'Network error' };
    }
}
