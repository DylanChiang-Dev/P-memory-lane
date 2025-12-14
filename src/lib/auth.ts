// Use relative path in development to leverage proxy, or full URL in production if needed
export const API_BASE_URL = import.meta.env.DEV ? "" : "https://pyqapi.3331322.xyz";

interface AuthResponse {
    user: { id: number; username: string };
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export const auth = {
    setTokens(accessToken: string, refreshToken?: string | null) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        } else {
            localStorage.removeItem('refresh_token');
        }
    },

    getAccessToken() {
        if (typeof window === 'undefined') return null;
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
            if (data.success) {
                this.setTokens(data.data.access_token, data.data.refresh_token);
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
