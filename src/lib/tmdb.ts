import { fetchWithAuth } from './api';

const BACKEND_BASE = '/api/search/tmdb';

export type TMDBLanguagePreference = 'auto' | 'zh-HK' | 'zh-TW' | 'zh-CN' | 'ja-JP' | 'ko-KR' | 'en-US';

export interface TMDBResult {
    id: number;
    title?: string; // For movies
    original_title?: string;
    name?: string; // For TV shows
    original_name?: string;
    original_language?: string;
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

export async function searchTMDB(
    query: string,
    type: 'movie' | 'tv' | 'multi' = 'multi',
    options: { language?: string } = {}
): Promise<TMDBResult[]> {
    try {
        if (type === 'multi') {
            const [movies, tv] = await Promise.all([
                searchTMDB(query, 'movie', options),
                searchTMDB(query, 'tv', options),
            ]);
            return [...movies, ...tv];
        }

        const languageParam = options.language ? `&language=${encodeURIComponent(options.language)}` : '';
        const response = await fetchWithAuth(`${BACKEND_BASE}?type=${type}&query=${encodeURIComponent(query)}${languageParam}`);

        if (!response.ok) return [];

        const json = await response.json();
        const data: TMDBResponse = json?.data?.results
            ? { page: json.data.page ?? 1, results: json.data.results, total_pages: json.data.total_pages ?? 1, total_results: json.data.total_results ?? json.data.results.length }
            : (json?.data ?? json);

        // Filter out results without posters or very low popularity if needed
        return data.results.filter(item => item.poster_path);
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') throw error;
        console.error('Error searching TMDB:', error);
        return [];
    }
}

function getTitleField(type: 'movie' | 'tv') {
    return type === 'tv' ? 'name' : 'title';
}

function getOriginalTitleField(type: 'movie' | 'tv') {
    return type === 'tv' ? 'original_name' : 'original_title';
}

function getLocaleLanguageCode(locale: string) {
    const raw = String(locale || '').trim();
    if (!raw) return '';
    return raw.split('-')[0]?.toLowerCase() ?? '';
}

function isTitleInLocale(item: TMDBResult, type: 'movie' | 'tv', locale: string) {
    const titleKey = getTitleField(type);
    const originalKey = getOriginalTitleField(type);
    const title = String((item as any)?.[titleKey] ?? '').trim();
    const original = String((item as any)?.[originalKey] ?? '').trim();
    if (!title) return false;

    // If title differs from original, TMDB provided a localized title for the requested locale.
    if (original && title !== original) return true;

    // Otherwise, accept it only when the original language matches the requested locale language.
    // This prevents "fallback to original" being treated as a valid localization for other locales,
    // while still allowing original-language titles to win at their priority step.
    const requestedLang = getLocaleLanguageCode(locale);
    const originalLang = String(item.original_language ?? '').toLowerCase();
    if (requestedLang && originalLang) return requestedLang === originalLang;

    // If we can't determine original_language, be conservative and treat it as not localized.
    return false;
}

function mergeLocalizedFields(base: TMDBResult, candidate: TMDBResult, type: 'movie' | 'tv', opts: { title?: boolean; overview?: boolean }) {
    const out: TMDBResult = { ...base };

    if (opts.title) {
        const titleKey = getTitleField(type);
        const candidateTitle = (candidate as any)?.[titleKey];
        if (typeof candidateTitle === 'string' && candidateTitle.trim()) {
            (out as any)[titleKey] = candidateTitle;
        }
    }

    if (opts.overview) {
        if (typeof candidate.overview === 'string' && candidate.overview.trim()) {
            out.overview = candidate.overview;
        }
    }

    return out;
}

function resolveLanguageFallback(preference: TMDBLanguagePreference): string[] {
    // Prefer zh-HK for Traditional Chinese because TMDB often returns Traditional+overview there.
    if (preference === 'auto') return ['zh-HK', 'zh-TW', 'zh-CN', 'ja-JP', 'ko-KR', 'en-US'];
    return [preference];
}

export async function searchTMDBWithLanguagePreference(
    query: string,
    type: 'movie' | 'tv',
    preference: TMDBLanguagePreference
): Promise<TMDBResult[]> {
    const languages = resolveLanguageFallback(preference).filter(Boolean);
    if (languages.length === 0) return await searchTMDB(query, type);

    const base = await searchTMDB(query, type, { language: languages[0] });
    if (languages.length === 1 || base.length === 0) return base;

    const byId = new Map<number, TMDBResult>();
    for (const item of base) byId.set(item.id, { ...item });

    const needTitle = new Set<number>();
    const needOverview = new Set<number>();
    for (const item of base) {
        if (!isTitleInLocale(item, type, languages[0])) needTitle.add(item.id);
        if (!String(item.overview ?? '').trim()) needOverview.add(item.id);
    }

    for (const lang of languages.slice(1)) {
        if (needTitle.size === 0 && needOverview.size === 0) break;
        const alt = await searchTMDB(query, type, { language: lang });
        if (!alt || alt.length === 0) continue;
        const altById = new Map<number, TMDBResult>();
        for (const item of alt) altById.set(item.id, item);

        for (const id of new Set([...needTitle, ...needOverview])) {
            const candidate = altById.get(id);
            if (!candidate) continue;
            const current = byId.get(id);
            if (!current) continue;

            const wantsTitle = needTitle.has(id) && isTitleInLocale(candidate, type, lang);
            const wantsOverview = needOverview.has(id) && String(candidate.overview ?? '').trim();
            if (!wantsTitle && !wantsOverview) continue;

            const merged = mergeLocalizedFields(current, candidate, type, { title: wantsTitle, overview: wantsOverview });
            byId.set(id, merged);

            if (wantsTitle) needTitle.delete(id);
            if (wantsOverview) needOverview.delete(id);
        }
    }

    // 後處理：對於中文原始語言的項目，如果標題仍然是英文，則使用 original_name/original_title
    const finalResults = base.map((item) => {
        const merged = byId.get(item.id) ?? item;
        const originalLang = String(merged.original_language ?? '').toLowerCase();

        // 如果原始語言是中文，優先使用 original_name/original_title
        if (originalLang === 'zh') {
            const titleKey = getTitleField(type);
            const originalKey = getOriginalTitleField(type);
            const currentTitle = String((merged as any)?.[titleKey] ?? '').trim();
            const originalTitle = String((merged as any)?.[originalKey] ?? '').trim();

            // 如果 original_name 存在且與當前 title 不同，使用 original_name
            if (originalTitle && originalTitle !== currentTitle) {
                // 檢查 original_title 是否包含中文字符
                const hasChinese = /[\u4e00-\u9fff]/.test(originalTitle);
                if (hasChinese) {
                    (merged as any)[titleKey] = originalTitle;
                }
            }
        }

        return merged;
    });

    return finalResults;
}

// Search for TV shows (variety, talk show, reality) instead of documentaries
export const searchDocumentaries = async (query: string, options: { language?: string } = {}): Promise<TMDBResult[]> => {
    // Search TV shows - genre IDs: 10767 (Talk), 10764 (Reality), 10763 (News)
    // Also include general TV search since Chinese variety shows may not have these genres
    return await searchTMDB(query, 'tv', options);
};

export function getTMDBImageUrl(path: string | null, size: 'w200' | 'w500' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-image.png'; // Replace with actual placeholder
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
