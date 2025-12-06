import React, { useEffect, useState } from 'react';
import { Activity, Book, Film, Gamepad2, Tv, Headphones, Clapperboard, Sparkles } from 'lucide-react';
import { fetchStats, fetchMediaItems } from '../../lib/api';

interface StatItemProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, gradient }) => (
    <div className="group relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
        <div className="relative flex items-center justify-between">
            <div>
                <p className="text-[13px] text-white/50 font-medium">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white/70 transition-colors">
                {icon}
            </div>
        </div>
    </div>
);

interface QuickStatProps {
    label: string;
    value: number;
    icon: React.ReactNode;
}

const QuickStat: React.FC<QuickStatProps> = ({ label, value, icon }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
        <div className="text-white/40">{icon}</div>
        <div>
            <p className="text-lg font-semibold text-white">{value}</p>
            <p className="text-xs text-white/40">{label}</p>
        </div>
    </div>
);

export const DashboardOverview: React.FC = () => {
    const [stats, setStats] = useState({
        exerciseStreak: 0,
        readingStreak: 0,
        moviesCount: 0,
        tvCount: 0,
        booksCount: 0,
        gamesCount: 0,
        animeCount: 0,
        podcastsCount: 0,
        documentariesCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        // Set greeting based on time
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('早安');
        else if (hour < 18) setGreeting('午安');
        else setGreeting('晚安');

        const loadStats = async () => {
            try {
                const [exercise, reading, movies, tv, books, games, anime, podcasts, documentaries] = await Promise.all([
                    fetchStats('exercise', new Date().getFullYear()).catch(() => ({ current_streak: 0 })),
                    fetchStats('reading', new Date().getFullYear()).catch(() => ({ current_streak: 0 })),
                    fetchMediaItems('movies').catch(() => []),
                    fetchMediaItems('tv-shows').catch(() => []),
                    fetchMediaItems('books').catch(() => []),
                    fetchMediaItems('games').catch(() => []),
                    fetchMediaItems('anime').catch(() => []),
                    fetchMediaItems('podcasts').catch(() => []),
                    fetchMediaItems('documentaries').catch(() => []),
                ]);

                // Helper to safely get total count from API response
                // API returns { items, pagination: { total } } format
                const getTotal = (data: any) => {
                    if (!data) return 0;
                    // Prefer pagination.total for accurate count
                    if (data?.pagination?.total !== undefined) {
                        return data.pagination.total;
                    }
                    // Fallback to items length if no pagination
                    if (Array.isArray(data?.items)) {
                        return data.items.length;
                    }
                    if (Array.isArray(data)) {
                        return data.length;
                    }
                    return 0;
                };

                setStats({
                    exerciseStreak: exercise.current_streak || 0,
                    readingStreak: reading.current_streak || 0,
                    moviesCount: getTotal(movies),
                    tvCount: getTotal(tv),
                    booksCount: getTotal(books),
                    gamesCount: getTotal(games),
                    animeCount: getTotal(anime),
                    podcastsCount: getTotal(podcasts),
                    documentariesCount: getTotal(documentaries),
                });
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const totalMedia = stats.moviesCount + stats.tvCount + stats.booksCount + stats.gamesCount + stats.animeCount + stats.podcastsCount + stats.documentariesCount;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 rounded-2xl bg-zinc-800/50 animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-zinc-800/50 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-white/5 p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-2">
                            <Sparkles size={16} />
                            <span>{greeting}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            歡迎回來
                        </h1>
                        <p className="text-white/50 max-w-md">
                            這是你的生活儀表板，追蹤習慣、管理收藏，記錄每一個精彩時刻。
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <QuickStat label="總收藏" value={totalMedia} icon={<Film size={18} />} />
                        <QuickStat label="運動連續" value={stats.exerciseStreak} icon={<Activity size={18} />} />
                        <QuickStat label="閱讀連續" value={stats.readingStreak} icon={<Book size={18} />} />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatItem
                    label="電影"
                    value={stats.moviesCount}
                    icon={<Film size={20} />}
                    gradient="bg-gradient-to-br from-purple-500/20 to-transparent"
                />
                <StatItem
                    label="劇集"
                    value={stats.tvCount}
                    icon={<Tv size={20} />}
                    gradient="bg-gradient-to-br from-blue-500/20 to-transparent"
                />
                <StatItem
                    label="書籍"
                    value={stats.booksCount}
                    icon={<Book size={20} />}
                    gradient="bg-gradient-to-br from-amber-500/20 to-transparent"
                />
                <StatItem
                    label="遊戲"
                    value={stats.gamesCount}
                    icon={<Gamepad2 size={20} />}
                    gradient="bg-gradient-to-br from-emerald-500/20 to-transparent"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-zinc-900/40 border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
                        <Sparkles size={18} className="text-pink-400" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-white">{stats.animeCount}</p>
                        <p className="text-xs text-white/40">動畫</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-zinc-900/40 border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Headphones size={18} className="text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-white">{stats.podcastsCount}</p>
                        <p className="text-xs text-white/40">播客</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-zinc-900/40 border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Clapperboard size={18} className="text-orange-400" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-white">{stats.documentariesCount}</p>
                        <p className="text-xs text-white/40">紀錄片</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
