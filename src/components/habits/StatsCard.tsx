import React from 'react';
import { Calendar, Clock, BookOpen, Zap } from 'lucide-react';
import type { Stats } from '../../lib/api';
import type { ActivityType } from '../../lib/habitConfig';

interface StatsCardProps {
    stats: Stats;
    activityType: ActivityType;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats, activityType }) => {
    // Render the secondary stat based on activity type
    const renderSecondaryStat = () => {
        switch (activityType) {
            case 'exercise':
                return (
                    <div className="bento-card p-3 md:p-4 flex items-center gap-3 h-16 md:h-20 relative group">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Clock size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-zinc-500">總時長</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                {Math.round(stats.total_minutes / 60)}<span className="text-xs text-zinc-500 ml-1">小時</span>
                            </p>
                        </div>
                    </div>
                );
            case 'reading':
                return (
                    <div className="bento-card p-3 md:p-4 flex items-center gap-3 h-16 md:h-20 relative group">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <BookOpen size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-zinc-500">總頁數</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                {stats.total_pages ?? 0}<span className="text-xs text-zinc-500 ml-1">頁</span>
                            </p>
                        </div>
                    </div>
                );
            case 'duolingo':
                return (
                    <div className="bento-card p-3 md:p-4 flex items-center gap-3 h-16 md:h-20 relative group">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <Zap size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-zinc-500">總經驗</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                {stats.total_xp ?? 0}<span className="text-xs text-zinc-500 ml-1">XP</span>
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
            <div className="bento-card p-3 md:p-4 flex items-center gap-3 h-16 md:h-20 relative group">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Calendar size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-medium text-zinc-500">總天數</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        {stats.total_days}<span className="text-xs text-zinc-500 ml-1">天</span>
                    </p>
                </div>
            </div>

            {renderSecondaryStat()}
        </div>
    );
};
