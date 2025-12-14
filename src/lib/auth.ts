// Use relative path in development to leverage proxy, or full URL in production if needed
export const API_BASE_URL = import.meta.env.DEV ? "" : "https://pyqapi.3331322.xyz";

interface AuthResponse {
    user: { id: number; username: string };
    access_token: string;
    refresh_token: string;
    // Some backends return access_expires_in instead of expires_in, and may omit refresh_token.
    access_expires_in?: number;
    expires_in?: number;
}

export const auth = {
    setTokens(accessToken: string, refreshToken?: string | null, accessExpiresInSeconds?: number | null) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        } else {
            localStorage.removeItem('refresh_token');
        }

        if (typeof accessExpiresInSeconds === 'number' && Number.isFinite(accessExpiresInSeconds) && accessExpiresInSeconds > 0) {
            // Save expiry time with a small safety buffer to avoid edge cases.
            const bufferSeconds = 30;
            const expiresAt = Date.now() + Math.max(0, accessExpiresInSeconds - bufferSeconds) * 1000;
            localStorage.setItem('access_token_expires_at', String(expiresAt));
        } else {
            localStorage.removeItem('access_token_expires_at');
        }
    },

    getAccessToken() {
        if (typeof window === 'undefined') return null;
        const expiresAtRaw = localStorage.getItem('access_token_expires_at');
        if (expiresAtRaw) {
            const expiresAt = Number(expiresAtRaw);
            if (Number.isFinite(expiresAt) && Date.now() >= expiresAt) {
                this.clearTokens();
                return null;
            }
        }
        const token = localStorage.getItem('access_token');
        if (!token || token === 'undefined' || token === 'null') return null;
        return token;
    },

    getRefreshToken() {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem('refresh_token');
        if (!token || token === 'undefined' || token === 'null') return null;
        return token;
    },

    clearTokens() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('access_token_expires_at');
        // Dispatch custom event to notify AuthManager
        window.dispatchEvent(new CustomEvent('auth:logout'));
    },

    isAuthenticated() {
        return !!this.getAccessToken();
    },

    async login(email: string, password: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            if (data.success && data?.data?.access_token) {
                const expiresIn = data.data.access_expires_in ?? data.data.expires_in ?? null;
                this.setTokens(data.data.access_token, data.data.refresh_token ?? null, expiresIn);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    },

    async logout() {
        this.clearTokens();
        window.location.reload();
    }
};
