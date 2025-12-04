import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import type { Activity } from '../../lib/api';

interface HeatmapProps {
    data: Activity[];
    year: number;
    color?: string; // e.g., 'orange', 'blue', 'green'
}

const COLOR_SCALES: Record<string, { level1: string; level2: string; level3: string; level4: string; level5: string; level6: string }> = {
    orange: { level1: '#ffedd5', level2: '#fed7aa', level3: '#fdba74', level4: '#fb923c', level5: '#f97316', level6: '#ea580c' }, // Orange 100-600
    blue: { level1: '#dbeafe', level2: '#bfdbfe', level3: '#93c5fd', level4: '#60a5fa', level5: '#3b82f6', level6: '#2563eb' },   // Blue 100-600
    green: { level1: '#dcfce7', level2: '#bbf7d0', level3: '#86efac', level4: '#4ade80', level5: '#22c55e', level6: '#16a34a' },  // Green 100-600
    indigo: { level1: '#e0e7ff', level2: '#c7d2fe', level3: '#a5b4fc', level4: '#818cf8', level5: '#6366f1', level6: '#4f46e5' }, // Indigo 100-600
};

export const Heatmap: React.FC<HeatmapProps> = ({ data, year, color = 'indigo' }) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const theme = COLOR_SCALES[color] || COLOR_SCALES.indigo;

    const getIntensity = (val: Activity) => {
        // Fallback logic if intensity is missing or we want to override based on value
        const v = val.value;

        if (color === 'blue') { // Reading (Pages): 10, 20, 30, 40, 50, 60+
            if (v >= 60) return 'level6';
            if (v >= 50) return 'level5';
            if (v >= 40) return 'level4';
            if (v >= 30) return 'level3';
            if (v >= 20) return 'level2';
            return 'level1';
        }
        if (color === 'green') { // Duolingo (XP): 20, 40, 60, 80, 100, 120+
            if (v >= 120) return 'level6';
            if (v >= 100) return 'level5';
            if (v >= 80) return 'level4';
            if (v >= 60) return 'level3';
            if (v >= 40) return 'level2';
            return 'level1';
        }
        // Default / Exercise (Minutes): 10, 20, 30, 40, 50, 60+
        if (v >= 60) return 'level6';
        if (v >= 50) return 'level5';
        if (v >= 40) return 'level4';
        if (v >= 30) return 'level3';
        if (v >= 20) return 'level2';
        return 'level1';
    };

    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (containerRef.current && year === new Date().getFullYear()) {
            const today = new Date();
            const start = new Date(year, 0, 0);
            const diff = today.getTime() - start.getTime();
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            const totalDays = 365; // Approximation is fine for scroll position

            const scrollWidth = containerRef.current.scrollWidth;
            const clientWidth = containerRef.current.clientWidth;

            // Calculate position: (dayOfYear / totalDays) * scrollWidth
            // Center it: - clientWidth / 2
            const scrollPos = (dayOfYear / totalDays) * scrollWidth - clientWidth / 2;

            containerRef.current.scrollLeft = scrollPos;
        }
    }, [year, data]); // Re-run when year or data changes

    return (
        <div ref={containerRef} className="w-full overflow-x-auto pb-2 no-scrollbar">
            <div className="min-w-[800px]">
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={data}
                    classForValue={(value) => {
                        if (!value || value.value === 0) return 'color-empty';
                        return `color-scale-${getIntensity(value)}`;
                    }}
                    tooltipDataAttrs={(value: any) => {
                        if (!value || !value.date || value.value === 0) return null;
                        return {
                            'data-tooltip-id': 'heatmap-tooltip',
                            'data-tooltip-content': `${value.date}: ${value.value} ${color === 'blue' ? 'pages' : color === 'green' ? 'XP' : 'min'}${value.notes ? ` - ${value.notes}` : ''}`,
                        };
                    }}
                    showWeekdayLabels
                    gutterSize={4}
                    transformDayElement={(element, value, index) => {
                        if (!value || value.value === 0) {
                            // Use light gray for light mode, dark gray for dark mode
                            return React.cloneElement(element, {
                                style: { rx: 2 },
                                className: 'fill-zinc-200 dark:fill-zinc-800'
                            });
                        }
                        const intensity = getIntensity(value);
                        // @ts-ignore
                        const style = { fill: theme[intensity], rx: 2 };
                        return React.cloneElement(element, { style });
                    }}
                />
                <Tooltip
                    id="heatmap-tooltip"
                    className="!bg-zinc-800 !text-white !border !border-white/10 !px-3 !py-2 !rounded-lg !text-xs !shadow-xl !opacity-100"
                    place="top"
                />
            </div>
            <style>{`
                .react-calendar-heatmap text { font-size: 10px; fill: #71717a; font-family: 'Inter', sans-serif; }
                .react-calendar-heatmap rect:hover { stroke: #fff; stroke-width: 1px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
