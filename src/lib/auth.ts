export const API_BASE_URL = "https://pyqapi.3331322.xyz";

interface AuthResponse {
    user: { id: number; username: string };
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export const auth = {
    setTokens(accessToken: string, refreshToken: string) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    },

    getAccessToken() {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    },

    getRefreshToken() {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('refresh_token');
    },

    clearTokens() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
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
