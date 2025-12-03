import { auth, API_BASE_URL } from './auth';

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

// Media Library API
export async function fetchMediaItems(type: 'movies' | 'tv-shows' | 'books' | 'games') {
    try {
        const response = await fetchWithAuth(`/api/library/${type}`);
        if (!response.ok) return [];
        const json = await response.json();
        return json.success ? json.data.items : [];
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') return [];
        console.error(`Error fetching ${type}:`, error);
        return [];
    }
}

export async function addMediaItem(type: 'movies' | 'tv-shows' | 'books' | 'games', data: any) {
    try {
        const response = await fetchWithAuth(`/api/library/${type}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error(`Error adding ${type}:`, error);
        return { success: false, error: 'Network error' };
    }
}

export async function deleteMediaItem(type: 'movies' | 'tv-shows' | 'books' | 'games', id: number) {
    try {
        const response = await fetchWithAuth(`/api/library/${type}/${id}`, {
            method: 'DELETE',
        });
        return await response.json();
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        return { success: false, error: 'Network error' };
    }
}
