import { fetchWithAuth, fetchHeatmapData, fetchMediaItems, type Activity } from './api';

/**
 * 年度总结媒体项类型
 */
export interface YearlyMediaItem {
    id: number;
    title: string;
    cover_image?: string;
    cover_image_cdn?: string;
    my_rating?: number;
    completed_date?: string;
    status?: string; // 'completed', 'reading', 'want_to_read', etc.
}

/**
 * 年度总结数据类型
 */
export interface YearlyReviewData {
    year: number;
    habits: {
        exercise: HabitStats;
        reading: HabitStats & { totalPages: number };
        duolingo: HabitStats & { totalXP: number };
    };
    media: {
        movies: MediaCategorySummary;
        books: MediaCategorySummary;
        games: MediaCategorySummary;
        anime: MediaCategorySummary;
        tvShows: MediaCategorySummary;
        documentaries: MediaCategorySummary;
        podcasts: MediaCategorySummary;
    };
}

interface HabitStats {
    totalDays: number;
    totalMinutes?: number;
    longestStreak: number;
    currentStreak: number;
    monthlyBreakdown: { month: number; days: number; minutes: number; pages?: number; xp?: number }[];
    heatmapData: Activity[];
}

interface MediaCategorySummary {
    total: number;
    items: YearlyMediaItem[];
}

// Helper to fetch all media items with pagination
async function fetchAllMediaItems(type: 'movies' | 'tv-shows' | 'books' | 'games' | 'podcasts' | 'documentaries' | 'anime', year: number): Promise<YearlyMediaItem[]> {
    const allItems: YearlyMediaItem[] = [];
    let page = 1;
    const limit = 100; // Larger limit to reduce requests

    while (true) {
        const result = await fetchMediaItems(type, undefined, page, limit, 'rating_desc');
        if (!result.items || result.items.length === 0) break;

        // Filter by year (completed_date or created_at starts with the year)
        const yearStr = String(year);
        const yearItems = result.items.filter((item: any) => {
            const date = item.completed_date || item.created_at || '';
            return date.startsWith(yearStr);
        });

        allItems.push(...yearItems.map((item: any) => ({
            id: item.id,
            title: item.title,
            cover_image: item.cover_image,
            cover_image_cdn: item.cover_image_cdn,
            my_rating: item.my_rating,
            completed_date: item.completed_date,
            status: item.status,
        })));

        // Check if there are more pages
        if (page >= result.pagination.total_pages) break;
        page++;
    }

    // Sort by rating descending
    return allItems.sort((a, b) => (b.my_rating || 0) - (a.my_rating || 0));
}

/**
 * 获取年度总结数据 (使用后端聚合接口 + 完整媒体列表)
 */
export async function fetchYearlyReviewData(year: number): Promise<YearlyReviewData> {
    try {
        // Fetch base data and heatmap data in parallel
        const [response, exerciseHeatmap, duolingoHeatmap, readingHeatmap,
            allMovies, allTvShows, allBooks, allGames, allAnime, allPodcasts, allDocs] = await Promise.all([
                fetchWithAuth(`/api/activities/yearly-review?year=${year}`),
                fetchHeatmapData('exercise', year),
                fetchHeatmapData('duolingo', year),
                fetchHeatmapData('reading', year),
                fetchAllMediaItems('movies', year),
                fetchAllMediaItems('tv-shows', year),
                fetchAllMediaItems('books', year),
                fetchAllMediaItems('games', year),
                fetchAllMediaItems('anime', year),
                fetchAllMediaItems('podcasts', year),
                fetchAllMediaItems('documentaries', year),
            ]);

        if (!response.ok) {
            throw new Error(`Failed to fetch yearly review data: ${response.status}`);
        }

        const json = await response.json();

        if (!json.success || !json.data) {
            throw new Error('Invalid response format');
        }

        const data = json.data;
        const habits = data.habits;

        // 适配前端数据结构，使用完整媒体列表
        return {
            year,
            habits: {
                exercise: {
                    totalDays: habits.exercise.total_days,
                    totalMinutes: habits.exercise.total_minutes,
                    longestStreak: habits.exercise.longest_streak,
                    currentStreak: habits.exercise.current_streak,
                    monthlyBreakdown: habits.exercise.monthly_breakdown.map((m: any) => ({
                        month: m.month,
                        days: m.days || m.total_days || 0,
                        minutes: m.minutes || m.total_minutes || 0
                    })),
                    heatmapData: exerciseHeatmap,
                },
                reading: {
                    totalDays: habits.reading.total_days,
                    totalPages: habits.reading.total_pages,
                    longestStreak: habits.reading.longest_streak,
                    currentStreak: habits.reading.current_streak,
                    monthlyBreakdown: habits.reading.monthly_breakdown.map((m: any) => ({
                        month: m.month,
                        days: m.days || m.total_days || 0,
                        minutes: m.minutes || m.total_minutes || 0,
                        pages: m.pages || m.total_pages || 0
                    })),
                    heatmapData: readingHeatmap,
                },
                duolingo: {
                    totalDays: habits.duolingo.total_days,
                    totalXP: habits.duolingo.total_xp,
                    longestStreak: habits.duolingo.longest_streak,
                    currentStreak: habits.duolingo.current_streak,
                    monthlyBreakdown: habits.duolingo.monthly_breakdown.map((m: any) => ({
                        month: m.month,
                        days: m.days || m.total_days || 0,
                        minutes: m.minutes || m.total_minutes || 0,
                        xp: m.xp || m.total_xp || 0
                    })),
                    heatmapData: duolingoHeatmap,
                },
            },
            media: {
                movies: { total: allMovies.length, items: allMovies },
                books: { total: allBooks.length, items: allBooks },
                games: { total: allGames.length, items: allGames },
                anime: { total: allAnime.length, items: allAnime },
                tvShows: { total: allTvShows.length, items: allTvShows },
                documentaries: { total: allDocs.length, items: allDocs },
                podcasts: { total: allPodcasts.length, items: allPodcasts },
            },
        };

    } catch (error) {
        console.error('Error in fetchYearlyReviewData:', error);
        // 返回空数据避免页面崩溃
        const emptyHabit = { totalDays: 0, longestStreak: 0, currentStreak: 0, monthlyBreakdown: [], heatmapData: [] };
        const emptyMedia = { total: 0, items: [] };
        return {
            year,
            habits: {
                exercise: { ...emptyHabit, totalMinutes: 0 },
                reading: { ...emptyHabit, totalPages: 0 },
                duolingo: { ...emptyHabit, totalXP: 0 },
            },
            media: {
                movies: emptyMedia,
                books: emptyMedia,
                games: emptyMedia,
                anime: emptyMedia,
                tvShows: emptyMedia,
                documentaries: emptyMedia,
                podcasts: emptyMedia,
            },
        };
    }
}
