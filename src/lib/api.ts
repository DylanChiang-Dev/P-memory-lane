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
// Helper to fetch with auth header
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    let token = auth.getAccessToken();
    const shouldLogoutOn401 =
        endpoint.startsWith('/api/library/') ||
        endpoint.startsWith('/api/activities/') ||
        endpoint.startsWith('/api/integrations/') ||
        endpoint.startsWith('/api/user/');

    const getHeaders = (t: string | null) => ({
        'Content-Type': 'application/json',
        ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
        ...options.headers,
    });

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: getHeaders(token),
    });

    if (response.status === 401) {
        // Token might be expired, try to refresh
        const refreshToken = auth.getRefreshToken();

        if (refreshToken) {
            try {
                // Call refresh endpoint
                // Backend endpoint is /api/refresh-token (see api_manual.md)
                const refreshResponse = await fetch(`${API_BASE_URL}/api/refresh-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });

                // Refresh token invalid/expired: end session
                if (refreshResponse.status === 401 || refreshResponse.status === 403) {
                    auth.clearTokens();
                    throw new Error('Unauthorized');
                }

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    if (data.success && data.data.access_token) {
                        // Update tokens
                        auth.setTokens(
                            data.data.access_token,
                            data.data.refresh_token || refreshToken,
                            data.data.access_expires_in ?? data.data.expires_in ?? null
                        );

                        // Retry original request with new token
                        token = data.data.access_token;
                        response = await fetch(`${API_BASE_URL}${endpoint}`, {
                            ...options,
                            headers: getHeaders(token),
                        });

                        // If it's still 401, then we really are unauthorized
                        if (response.status === 401) {
                            auth.clearTokens();
                            throw new Error('Unauthorized');
                        }

                        return response;
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }

            // Refresh attempt failed (network/5xx/invalid format)
            if (shouldLogoutOn401) auth.clearTokens();
            throw new Error('Unauthorized');
        }

        // No refresh token
        if (shouldLogoutOn401) auth.clearTokens();
        throw new Error('Unauthorized');
    }

    return response;
}

export type IntegrationStatus = {
    tmdb?: { configured: boolean };
    rawg?: { configured: boolean };
    google_books?: { configured: boolean };
    igdb?: { configured: boolean };
};

export async function fetchIntegrationStatus(): Promise<IntegrationStatus | null> {
    try {
        const response = await fetchWithAuth('/api/integrations/status');
        if (!response.ok) return null;
        const json = await response.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error('Error fetching integrations status:', error);
        return null;
    }
}

export type IntegrationCredentialsPayload = Partial<{
    tmdb_api_key: string;
    rawg_api_key: string;
    google_books_api_key: string;
    igdb_client_id: string;
    igdb_client_secret: string;
}>;

export async function saveIntegrationCredentials(payload: IntegrationCredentialsPayload) {
    try {
        const response = await fetchWithAuth('/api/integrations/credentials', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving integrations credentials:', error);
        return { success: false, error: 'Network error' };
    }
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
export async function fetchMediaItems(type: MediaType, status?: string, page: number = 1, limit: number = 20, sort?: string, search?: string) {
    try {
        const apiType = MEDIA_TYPE_API_MAP[type];
        let url = `/api/library/${apiType}?page=${page}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        if (sort) {
            url += `&sort=${sort}`;
        }
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await fetchWithAuth(url);
        if (!response.ok) return { items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
        const json = await response.json();

        const items = json.success ? json.data.items : [];
        const pagination = json.success ? json.data.pagination : { page: 1, limit: 20, total: 0, total_pages: 0 };

        // 後端已返回完整元數據，無需客戶端 enrichment
        // Backend now returns complete metadata (title, cover_image_cdn, overview, etc.)
        return { items, pagination };

    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') return { items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
        console.error(`Error fetching ${type}:`, error);
        return { items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
    }
}

export async function addMediaItem(type: MediaType, data: any) {
    try {
        const apiType = MEDIA_TYPE_API_MAP[type];
        console.log('[addMediaItem] Sending data:', JSON.stringify(data, null, 2));
        const response = await fetchWithAuth(`/api/library/${apiType}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const result = await response.json();
        console.log('[addMediaItem] Response:', JSON.stringify(result, null, 2));

        if (!response.ok) {
            return {
                success: false,
                error: result.error || result.message || `HTTP ${response.status}`
            };
        }
        return result;
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

/**
 * Upload a media file (image) to the backend.
 * Returns the URL of the uploaded file.
 */
export async function uploadMedia(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const token = auth.getAccessToken();
        const formData = new FormData();
        formData.append('files[]', file);

        const response = await fetch(`${API_BASE_URL}/api/media`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            return { success: false, error: json.error || `Upload failed: HTTP ${response.status}` };
        }

        if (json.data?.items?.length > 0) {
            return { success: true, url: json.data.items[0].url };
        }

        return { success: false, error: 'No URL returned from server' };
    } catch (error) {
        console.error('Error uploading media:', error);
        return { success: false, error: 'Network error' };
    }
}
