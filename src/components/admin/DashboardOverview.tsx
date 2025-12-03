import React, { useEffect, useState } from 'react';
import { Activity, Book, Film, Tv, Gamepad2, TrendingUp } from 'lucide-react';
import { fetchStats, fetchMediaItems } from '../../lib/api';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, color }) => (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 flex items-center gap-4 hover:border-zinc-300 dark:hover:border-white/10 transition-all">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</h3>
            {trend && <p className="text-xs text-teal-500 mt-1 flex items-center gap-1"><TrendingUp size={12} /> {trend}</p>}
        </div>
    </div>
);

export const DashboardOverview: React.FC = () => {
    const [stats, setStats] = useState({
        exerciseStreak: 0,
        readingStreak: 0,
        moviesCount: 0,
        booksCount: 0,
        gamesCount: 0
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [exercise, reading, movies, books, games] = await Promise.all([
                    fetchStats('exercise', new Date().getFullYear()),
                    fetchStats('reading', new Date().getFullYear()),
                    fetchMediaItems('movies'),
                    fetchMediaItems('books'),
                    fetchMediaItems('games')
                ]);

                setStats({
                    exerciseStreak: exercise.current_streak,
                    readingStreak: reading.current_streak,
                    moviesCount: movies.length,
                    booksCount: books.length,
                    gamesCount: games.length
                });
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
            }
        };

        loadStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
                title="運動連續天數"
                value={`${stats.exerciseStreak} 天`}
                icon={<Activity size={24} />}
                color="bg-orange-500"
                trend="保持中"
            />
            <StatsCard
                title="閱讀連續天數"
                value={`${stats.readingStreak} 天`}
                icon={<Book size={24} />}
                color="bg-blue-500"
                trend="保持中"
            />
            <StatsCard
                title="電影收藏"
                value={stats.moviesCount}
                icon={<Film size={24} />}
                color="bg-purple-500"
            />
            <StatsCard
                title="遊戲收藏"
                value={stats.gamesCount}
                icon={<Gamepad2 size={24} />}
                color="bg-emerald-500"
            />
        </div>
    );
};
