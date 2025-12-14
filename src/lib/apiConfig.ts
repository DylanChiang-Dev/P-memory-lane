// API Configuration Manager
const API_CONFIG_KEY = 'api_config';

export interface APIConfig {
    tmdb_api_key: string;
    rawg_api_key: string;
    igdb_client_id?: string;
    igdb_access_token?: string;
    google_books_api_key: string; // Optional
}

export const apiConfigManager = {
    // Get API configuration from localStorage
    getConfig(): APIConfig {
        if (typeof window === 'undefined') {
            return {
                tmdb_api_key: import.meta.env.VITE_TMDB_API_KEY || '',
                rawg_api_key: import.meta.env.VITE_RAWG_API_KEY || '',
                igdb_client_id: import.meta.env.VITE_IGDB_CLIENT_ID || '',
                igdb_access_token: import.meta.env.VITE_IGDB_ACCESS_TOKEN || '',
                google_books_api_key: '',
            };
        }

        const stored = localStorage.getItem(API_CONFIG_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return this.getDefaultConfig();
            }
        }
        return this.getDefaultConfig();
    },

    // Save API configuration to localStorage
    saveConfig(config: APIConfig): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
        }
    },

    // Get default configuration from environment variables
    getDefaultConfig(): APIConfig {
        return {
            tmdb_api_key: import.meta.env.VITE_TMDB_API_KEY || '',
            rawg_api_key: import.meta.env.VITE_RAWG_API_KEY || '',
            igdb_client_id: import.meta.env.VITE_IGDB_CLIENT_ID || '',
            igdb_access_token: import.meta.env.VITE_IGDB_ACCESS_TOKEN || '',
            google_books_api_key: '',
        };
    },

    // Check if configuration is complete
    isConfigured(): boolean {
        const config = this.getConfig();
        return !!(config.tmdb_api_key && (config.rawg_api_key || (config.igdb_client_id && config.igdb_access_token)));
    },

    // Get specific API key
    getTMDBKey(): string {
        return this.getConfig().tmdb_api_key;
    },

    getRAWGKey(): string {
        return this.getConfig().rawg_api_key;
    },

    getIGDBCredentials(): { clientId: string; accessToken: string } | null {
        const config = this.getConfig();
        if (config.igdb_client_id && config.igdb_access_token) {
            return {
                clientId: config.igdb_client_id,
                accessToken: config.igdb_access_token
            };
        }
        return null;
    },

    getGoogleBooksKey(): string {
        return this.getConfig().google_books_api_key;
    },
};
