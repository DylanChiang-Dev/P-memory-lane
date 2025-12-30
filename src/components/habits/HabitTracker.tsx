import React, { useState, useEffect } from 'react';
import { Heatmap } from './Heatmap';
import { StatsCard } from './StatsCard';
import { fetchHeatmapData, fetchStats, type Activity, type Stats } from '../../lib/api';
import { HABIT_TYPES, type ActivityType } from '../../lib/habitConfig';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export const HabitTracker: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        exercise: { stats: Stats; heatmap: Activity[] };
        reading: { stats: Stats; heatmap: Activity[] };
        duolingo: { stats: Stats; heatmap: Activity[] };
    } | null>(null);

    const loadData = async (retry = true) => {
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear();
            const lastYear = currentYear - 1;

            // Fetch data for both current year and last year to support rolling 365-day view
            const [
                exerciseDataCurrent, exerciseDataLast, exerciseStats,
                readingDataCurrent, readingDataLast, readingStats,
                duolingoDataCurrent, duolingoDataLast, duolingoStats
            ] = await Promise.all([
                fetchHeatmapData('exercise', currentYear),
                fetchHeatmapData('exercise', lastYear),
                fetchStats('exercise', currentYear),
                fetchHeatmapData('reading', currentYear),
                fetchHeatmapData('reading', lastYear),
                fetchStats('reading', currentYear),
                fetchHeatmapData('duolingo', currentYear),
                fetchHeatmapData('duolingo', lastYear),
                fetchStats('duolingo', currentYear),
            ]);

            // Merge data from both years
            const mergeHeatmapData = (current: Activity[], last: Activity[]) => {
                const merged = [...last, ...current];
                // Remove duplicates (prefer current year data)
                const dateMap = new Map<string, Activity>();
                merged.forEach(item => {
                    dateMap.set(item.date, item);
                });
                return Array.from(dateMap.values());
            };

            setData({
                exercise: { stats: exerciseStats, heatmap: mergeHeatmapData(exerciseDataCurrent, exerciseDataLast) },
                reading: { stats: readingStats, heatmap: mergeHeatmapData(readingDataCurrent, readingDataLast) },
                duolingo: { stats: duolingoStats, heatmap: mergeHeatmapData(duolingoDataCurrent, duolingoDataLast) },
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'Unauthorized' && retry) {
                // Token was likely invalid and cleared by fetchWithAuth
                // Retry once to fetch as public user
                await loadData(false);
                return;
            }
            console.error('Failed to load habit data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        const handleRefresh = () => loadData();
        window.addEventListener('habit-checkin-success', handleRefresh);
        return () => window.removeEventListener('habit-checkin-success', handleRefresh);
    }, []);



    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {HABIT_TYPES.map((habit) => {
                const currentStats = data[habit.id].stats;
                const currentHeatmap = data[habit.id].heatmap;

                return (
                    <div key={habit.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className={clsx("w-1 h-5 rounded-full", {
                                'bg-orange-500': habit.id === 'exercise',
                                'bg-blue-500': habit.id === 'reading',
                                'bg-green-500': habit.id === 'duolingo',
                            })}></div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{habit.label}</h2>
                        </div>

                        <StatsCard stats={currentStats} activityType={habit.id} />

                        <div className="bento-card p-3 md:p-4 overflow-hidden">
                            <Heatmap data={currentHeatmap} color={habit.color} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
