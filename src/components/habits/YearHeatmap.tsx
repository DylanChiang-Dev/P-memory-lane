import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import type { Activity } from '../../lib/api';

interface YearHeatmapProps {
    data: Activity[];
    color?: string; // e.g., 'orange', 'blue', 'green'
    year: number;
}

const COLOR_SCALES: Record<string, { level1: string; level2: string; level3: string; level4: string; level5: string; level6: string }> = {
    orange: { level1: '#ffedd5', level2: '#fed7aa', level3: '#fdba74', level4: '#fb923c', level5: '#f97316', level6: '#ea580c' },
    blue: { level1: '#dbeafe', level2: '#bfdbfe', level3: '#93c5fd', level4: '#60a5fa', level5: '#3b82f6', level6: '#2563eb' },
    green: { level1: '#dcfce7', level2: '#bbf7d0', level3: '#86efac', level4: '#4ade80', level5: '#22c55e', level6: '#16a34a' },
    indigo: { level1: '#e0e7ff', level2: '#c7d2fe', level3: '#a5b4fc', level4: '#818cf8', level5: '#6366f1', level6: '#4f46e5' },
};

const MONTH_LABELS_H1 = ['一月', '二月', '三月', '四月', '五月', '六月', '', '', '', '', '', ''];
const MONTH_LABELS_H2 = ['七月', '八月', '九月', '十月', '十一月', '十二月', '', '', '', '', '', ''];

// Two-row yearly heatmap: H1 (Jan-Jun) on top, H2 (Jul-Dec) on bottom
export const YearHeatmap: React.FC<YearHeatmapProps> = ({ data, color = 'indigo', year }) => {
    const theme = COLOR_SCALES[color] || COLOR_SCALES.indigo;

    // H1: Jan 1 - Jun 30
    const h1Start = new Date(year, 0, 1);
    const h1StartDay = h1Start.getDay();
    if (h1StartDay !== 0) {
        h1Start.setDate(h1Start.getDate() - h1StartDay);
    }
    const h1End = new Date(year, 5, 30);
    const h1EndDay = h1End.getDay();
    if (h1EndDay !== 6) {
        h1End.setDate(h1End.getDate() + (6 - h1EndDay));
    }

    // H2: Jul 1 - Dec 31
    const h2Start = new Date(year, 6, 1);
    const h2StartDay = h2Start.getDay();
    if (h2StartDay !== 0) {
        h2Start.setDate(h2Start.getDate() - h2StartDay);
    }
    const h2End = new Date(year, 11, 31);
    const h2EndDay = h2End.getDay();
    if (h2EndDay !== 6) {
        h2End.setDate(h2End.getDate() + (6 - h2EndDay));
    }

    // Filter data for each half
    const h1Data = data.filter(d => {
        const date = new Date(d.date);
        return date.getMonth() < 6;
    });
    const h2Data = data.filter(d => {
        const date = new Date(d.date);
        return date.getMonth() >= 6;
    });

    const getIntensity = (val: Activity) => {
        const v = val.value;

        if (color === 'blue') { // Reading (Pages)
            if (v >= 60) return 'level6';
            if (v >= 50) return 'level5';
            if (v >= 40) return 'level4';
            if (v >= 30) return 'level3';
            if (v >= 20) return 'level2';
            return 'level1';
        }
        if (color === 'green') { // Duolingo (XP)
            if (v >= 120) return 'level6';
            if (v >= 100) return 'level5';
            if (v >= 80) return 'level4';
            if (v >= 60) return 'level3';
            if (v >= 40) return 'level2';
            return 'level1';
        }
        // Default / Exercise (Minutes)
        if (v >= 60) return 'level6';
        if (v >= 50) return 'level5';
        if (v >= 40) return 'level4';
        if (v >= 30) return 'level3';
        if (v >= 20) return 'level2';
        return 'level1';
    };

    const getUnitLabel = () => {
        if (color === 'blue') return '頁';
        if (color === 'green') return 'XP';
        return '分鐘';
    };

    const renderHeatmap = (startDate: Date, endDate: Date, heatmapData: Activity[], monthLabels: string[], tooltipId: string) => (
        <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={heatmapData}
            classForValue={(value) => {
                if (!value || value.value === 0) return 'color-empty';
                return `color-scale-${getIntensity(value)}`;
            }}
            tooltipDataAttrs={(value: any) => {
                if (!value || !value.date || value.value === 0) return null;
                return {
                    'data-tooltip-id': tooltipId,
                    'data-tooltip-content': `${value.date}: ${value.value} ${getUnitLabel()}${value.notes ? ` - ${value.notes}` : ''}`,
                };
            }}
            showWeekdayLabels
            gutterSize={3}
            monthLabels={monthLabels}
            transformDayElement={(element, value, index) => {
                if (!value || value.value === 0) {
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
    );

    return (
        <div className="w-full space-y-4">
            {/* H1: Jan - Jun */}
            <div className="w-full">
                {renderHeatmap(h1Start, h1End, h1Data, MONTH_LABELS_H1, 'year-heatmap-h1')}
                <Tooltip
                    id="year-heatmap-h1"
                    className="!bg-zinc-800 !text-white !border !border-white/10 !px-3 !py-2 !rounded-lg !text-xs !shadow-xl !opacity-100"
                    place="top"
                />
            </div>
            {/* H2: Jul - Dec */}
            <div className="w-full">
                {renderHeatmap(h2Start, h2End, h2Data, MONTH_LABELS_H2, 'year-heatmap-h2')}
                <Tooltip
                    id="year-heatmap-h2"
                    className="!bg-zinc-800 !text-white !border !border-white/10 !px-3 !py-2 !rounded-lg !text-xs !shadow-xl !opacity-100"
                    place="top"
                />
            </div>
            <style>{`
                .react-calendar-heatmap text { 
                    font-size: 8px; 
                    fill: #71717a; 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                }
                .react-calendar-heatmap rect { 
                    width: 10px !important; 
                    height: 10px !important; 
                }
                .react-calendar-heatmap rect:hover { 
                    stroke: #fff; 
                    stroke-width: 1px; 
                }
            `}</style>
        </div>
    );
};
