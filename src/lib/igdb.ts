import { fetchWithAuth } from './api';

export interface IGDBGameResult {
    id: number;
    name: string;
    cover?: {
        id: number;
        image_id: string;
    };
    first_release_date?: number; // Unix timestamp
    total_rating?: number;
    summary?: string;
    platforms?: {
        id: number;
        name: string;
    }[];
}

function uniqById(items: IGDBGameResult[]) {
    const seen = new Set<number>();
    const out: IGDBGameResult[] = [];
    for (const it of items) {
        if (!it || typeof it.id !== 'number') continue;
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        out.push(it);
    }
    return out;
}

function normalizeQuery(q: string) {
    return String(q || '').trim();
}

function buildQueryVariants(q: string) {
    const base = normalizeQuery(q);
    if (!base) return [];
    const variants: string[] = [base];

    // If user pasted IGDB URL, extract slug as a variant.
    const m = base.match(/igdb\.com\/games\/([^?#/]+)/i);
    if (m?.[1]) {
        const slug = decodeURIComponent(m[1]);
        variants.push(slug);
        variants.push(slug.replace(/-/g, ' '));
    }

    // Try a hyphenated variant for phrase queries (helps some backends).
    if (base.includes(' ')) variants.push(base.replace(/\s+/g, '-'));
    if (base.includes('-')) variants.push(base.replace(/-/g, ' '));

    // Dedup while keeping order.
    const seen = new Set<string>();
    return variants
        .map((v) => normalizeQuery(v))
        .filter(Boolean)
        .filter((v) => (seen.has(v) ? false : (seen.add(v), true)))
        .slice(0, 3);
}

function scoreResult(item: IGDBGameResult, originalQuery: string, preferredYear?: number) {
    const q = normalizeQuery(originalQuery).toLowerCase();
    const qSpace = q.replace(/-/g, ' ');
    const qDash = q.replace(/\s+/g, '-');
    const name = String(item?.name || '').trim().toLowerCase();

    let score = 0;
    if (name === q || name === qSpace || name === qDash) score += 1000;
    if (name.startsWith(q) || name.startsWith(qSpace)) score += 300;
    if (name.includes(q) || name.includes(qSpace)) score += 120;

    if (typeof preferredYear === 'number' && Number.isFinite(preferredYear) && typeof item.first_release_date === 'number') {
        const releaseYear = new Date(item.first_release_date * 1000).getFullYear();
        const diff = Math.abs(releaseYear - preferredYear);
        if (diff === 0) score += 800;
        else if (diff === 1) score += 250;
        else if (diff === 2) score += 120;
    }

    // Tie-breakers: prefer entries with rating and release date.
    if (typeof item.total_rating === 'number') score += Math.min(50, Math.max(0, item.total_rating));
    if (typeof item.first_release_date === 'number') score += Math.min(50, item.first_release_date / 1e9); // small bump

    return score;
}

export async function searchIGDB(query: string, options?: { limit?: number; year?: number }): Promise<IGDBGameResult[]> {
    try {
        const q = normalizeQuery(query);
        if (!q) return [];

        const limit = typeof options?.limit === 'number' && Number.isFinite(options.limit) ? Math.max(1, Math.min(100, options.limit)) : 50;
        const preferredYear = typeof options?.year === 'number' && Number.isFinite(options.year) ? options.year : undefined;
        const variants = buildQueryVariants(q);

        const all: IGDBGameResult[] = [];
        for (const v of variants) {
            const response = await fetchWithAuth(`/api/search/igdb?query=${encodeURIComponent(v)}&limit=${limit}`);
            if (!response.ok) continue;
            const json = await response.json();
            const data: IGDBGameResult[] = json?.data ?? json;
            if (Array.isArray(data)) all.push(...data);
        }

        const unique = uniqById(all);
        unique.sort((a, b) => scoreResult(b, q, preferredYear) - scoreResult(a, q, preferredYear));
        return unique;
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') throw error;
        console.error('Error searching IGDB:', error);
        return [];
    }
}

export function getIGDBImageUrl(imageId: string | undefined, size: 'cover_small' | 'cover_big' | 'screenshot_med' | '720p' | '1080p' = 'cover_big'): string {
    if (!imageId) return '/placeholder.png';
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
