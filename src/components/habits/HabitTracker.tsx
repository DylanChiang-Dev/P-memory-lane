import React, { useState, useEffect } from 'react';
import { Heatmap } from './Heatmap';
import { StatsCard } from './StatsCard';
import { fetchHeatmapData, fetchStats, type Activity, type Stats } from '../../lib/api';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface HabitTrackerProps {
    initialYear: number;
}

type TabType = 'exercise' | 'reading' | 'duolingo';

export const HabitTracker: React.FC<HabitTrackerProps> = ({ initialYear }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        exercise: { stats: Stats; heatmap: Activity[] };
        reading: { stats: Stats; heatmap: Activity[] };
        duolingo: { stats: Stats; heatmap: Activity[] };
    } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [
                exerciseData, exerciseStats,
                readingData, readingStats,
                duolingoData, duolingoStats
            ] = await Promise.all([
                fetchHeatmapData('exercise', initialYear),
                fetchStats('exercise', initialYear),
                fetchHeatmapData('reading', initialYear),
                fetchStats('reading', initialYear),
                fetchHeatmapData('duolingo', initialYear),
                fetchStats('duolingo', initialYear),
            ]);

            setData({
                exercise: { stats: exerciseStats, heatmap: exerciseData },
                reading: { stats: readingStats, heatmap: readingData },
                duolingo: { stats: duolingoStats, heatmap: duolingoData },
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'Unauthorized') return;
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
    }, [initialYear]);

    const habitConfig: { id: TabType; label: string; color: string }[] = [
        { id: 'exercise', label: '運動', color: 'orange' },
        { id: 'reading', label: '閱讀', color: 'blue' },
        { id: 'duolingo', label: 'Duolingo', color: 'green' },
    ];

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {habitConfig.map((habit) => {
                const currentStats = data[habit.id].stats;
                const currentHeatmap = data[habit.id].heatmap;

                return (
                    <div key={habit.id} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className={clsx("w-1.5 h-8 rounded-full", {
                                'bg-orange-500': habit.id === 'exercise',
                                'bg-blue-500': habit.id === 'reading',
                                'bg-green-500': habit.id === 'duolingo',
                            })}></div>
                            <h2 className="text-2xl font-bold text-white">{habit.label}</h2>
                        </div>

                        <StatsCard stats={currentStats} />

                        <div className="bento-card p-4 md:p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-zinc-200">年度熱力圖</h3>
                                <div className="text-xs text-zinc-500 font-mono">{initialYear}</div>
                            </div>
                            <Heatmap data={currentHeatmap} year={initialYear} color={habit.color} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
