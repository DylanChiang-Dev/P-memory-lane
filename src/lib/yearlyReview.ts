import { fetchWithAuth, fetchHeatmapData, type Activity } from './api';

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

/**
 * 获取年度总结数据 (使用后端聚合接口)
 */
export async function fetchYearlyReviewData(year: number): Promise<YearlyReviewData> {
    try {
        // Fetch base data and heatmap data in parallel
        const [response, exerciseHeatmap, duolingoHeatmap, readingHeatmap] = await Promise.all([
            fetchWithAuth(`/api/activities/yearly-review?year=${year}`),
            fetchHeatmapData('exercise', year),
            fetchHeatmapData('duolingo', year),
            fetchHeatmapData('reading', year)
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
        const media = data.media;

        // 适配前端数据结构
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
                movies: {
                    total: media.summary.movies_count,
                    items: media.top_items.movies || [],
                },
                books: {
                    total: media.summary.books_count,
                    items: media.top_items.books || [],
                },
                games: {
                    total: media.summary.games_count,
                    items: media.top_items.games || [],
                },
                anime: {
                    total: media.summary.anime_count,
                    items: media.top_items.anime || [],
                },
                tvShows: {
                    total: media.summary.tv_shows_count,
                    items: media.top_items.tv_shows || [], // 注意后端字段映射
                },
                documentaries: {
                    total: media.summary.documentaries_count,
                    items: media.top_items.documentaries || [],
                },
                podcasts: {
                    total: media.summary.podcasts_count,
                    items: media.top_items.podcasts || [],
                },
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

