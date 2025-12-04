import React from 'react';
import { Trophy, Flame, Calendar, Clock } from 'lucide-react';
import type { Stats } from '../../lib/api';

interface StatsCardProps {
    stats: Stats;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-8">
            <div className="bento-card p-4 md:p-5 flex flex-col justify-between h-28 md:h-32 relative group">
                <div className="absolute top-4 right-4 text-zinc-700 group-hover:text-indigo-500 transition-colors">
                    <Calendar size={20} />
                </div>
                <p className="text-sm font-medium text-zinc-500">總天數</p>
                <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.total_days}</p>
                    <p className="text-xs text-zinc-500 mt-1">今年活躍天數</p>
                </div>
            </div>

            <div className="bento-card p-5 flex flex-col justify-between h-32 relative group">
                <div className="absolute top-4 right-4 text-zinc-700 group-hover:text-emerald-500 transition-colors">
                    <Clock size={20} />
                </div>
                <p className="text-sm font-medium text-zinc-500">總時長</p>
                <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{Math.round(stats.total_minutes / 60)}<span className="text-sm text-zinc-600 ml-1">小時</span></p>
                    <p className="text-xs text-zinc-500 mt-1">{stats.total_minutes} 分鐘</p>
                </div>
            </div>

            <div className="bento-card p-5 flex flex-col justify-between h-32 relative group">
                <div className="absolute top-4 right-4 text-zinc-700 group-hover:text-orange-500 transition-colors">
                    <Flame size={20} />
                </div>
                <p className="text-sm font-medium text-zinc-500">當前連續</p>
                <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.current_streak}</p>
                    <p className="text-xs text-zinc-500 mt-1">當前連續天數</p>
                </div>
            </div>

            <div className="bento-card p-5 flex flex-col justify-between h-32 relative group">
                <div className="absolute top-4 right-4 text-zinc-700 group-hover:text-purple-500 transition-colors">
                    <Trophy size={20} />
                </div>
                <p className="text-sm font-medium text-zinc-500">最佳連續</p>
                <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.longest_streak}</p>
                    <p className="text-xs text-zinc-500 mt-1">最長連續天數</p>
                </div>
            </div>
        </div>
    );
};
