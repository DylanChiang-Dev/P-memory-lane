/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_TMDB_API_KEY: string;
    readonly VITE_RAWG_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
