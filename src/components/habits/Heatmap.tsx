import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import type { Activity } from '../../lib/api';

interface HeatmapProps {
    data: Activity[];
    color?: string; // e.g., 'orange', 'blue', 'green'
    year?: number; // If provided, show full year (Jan 1 - Dec 31) instead of rolling view
}

const COLOR_SCALES: Record<string, { level1: string; level2: string; level3: string; level4: string; level5: string; level6: string }> = {
    orange: { level1: '#ffedd5', level2: '#fed7aa', level3: '#fdba74', level4: '#fb923c', level5: '#f97316', level6: '#ea580c' },
    blue: { level1: '#dbeafe', level2: '#bfdbfe', level3: '#93c5fd', level4: '#60a5fa', level5: '#3b82f6', level6: '#2563eb' },
    green: { level1: '#dcfce7', level2: '#bbf7d0', level3: '#86efac', level4: '#4ade80', level5: '#22c55e', level6: '#16a34a' },
    indigo: { level1: '#e0e7ff', level2: '#c7d2fe', level3: '#a5b4fc', level4: '#818cf8', level5: '#6366f1', level6: '#4f46e5' },
};

// Chinese month labels
const MONTH_LABELS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

// GitHub-style rolling heatmap: shows ~54 weeks with aligned week boundaries
export const Heatmap: React.FC<HeatmapProps> = ({ data, color = 'indigo', year }) => {
    let startDate: Date;
    let endDate: Date;

    if (year) {
        // Full year mode: show Jan 1 - Dec 31 of the specified year
        startDate = new Date(year, 0, 1); // Jan 1
        // Align to previous Sunday if Jan 1 isn't Sunday
        const janFirstDay = startDate.getDay();
        if (janFirstDay !== 0) {
            startDate.setDate(startDate.getDate() - janFirstDay);
        }

        endDate = new Date(year, 11, 31); // Dec 31
        // Align to next Saturday if Dec 31 isn't Saturday
        const decLastDay = endDate.getDay();
        if (decLastDay !== 6) {
            endDate.setDate(endDate.getDate() + (6 - decLastDay));
        }
    } else {
        // Rolling view mode (default): ~54 weeks ending around today
        const today = new Date();

        // Calculate start date: go back ~54 weeks and align to the previous Sunday
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 378); // ~54 weeks
        // Align to Sunday (day 0)
        const startDayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - startDayOfWeek);

        // Calculate end date: extend ~2 weeks into future and align to Saturday
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 14);
        // Align to Saturday (day 6)
        const endDayOfWeek = endDate.getDay();
        endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));
    }

    const theme = COLOR_SCALES[color] || COLOR_SCALES.indigo;

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

    const containerRef = React.useRef<HTMLDivElement>(null);

    // Scroll behavior: year mode shows from start (left), rolling mode shows recent (right)
    React.useEffect(() => {
        if (containerRef.current) {
            if (year) {
                // Year mode: scroll to beginning to show January first
                containerRef.current.scrollLeft = 0;
            } else {
                // Rolling mode: scroll to end to show recent data
                containerRef.current.scrollLeft = containerRef.current.scrollWidth;
            }
        }
    }, [data, year]);

    // Get unit label
    const getUnitLabel = () => {
        if (color === 'blue') return '頁';
        if (color === 'green') return 'XP';
        return '分鐘';
    };

    // For year mode, use compact sizing to fit full year
    const isYearMode = !!year;

    return (
        <div ref={containerRef} className={`w-full pb-2 ${isYearMode ? '' : 'overflow-x-auto no-scrollbar'}`}>
            <div className={isYearMode ? 'heatmap-year-mode' : 'min-w-[700px] md:min-w-[800px]'}>
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
                            'data-tooltip-content': `${value.date}: ${value.value} ${getUnitLabel()}${value.notes ? ` - ${value.notes}` : ''}`,
                        };
                    }}
                    showWeekdayLabels
                    gutterSize={3}
                    monthLabels={MONTH_LABELS}
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
                <Tooltip
                    id="heatmap-tooltip"
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
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    
                    /* Year mode: compact sizing to fit full 12 months */
                    .heatmap-year-mode .react-calendar-heatmap text {
                        font-size: 6px;
                    }
                    .heatmap-year-mode .react-calendar-heatmap rect {
                        width: 5px !important;
                        height: 5px !important;
                    }
                    .heatmap-year-mode .react-calendar-heatmap {
                        width: 100%;
                    }
                    
                    /* Mobile optimization */
                    @media (max-width: 768px) {
                        .react-calendar-heatmap text { font-size: 7px; }
                        .react-calendar-heatmap rect { 
                            width: 8px !important; 
                            height: 8px !important; 
                        }
                        
                        .heatmap-year-mode .react-calendar-heatmap text {
                            font-size: 5px;
                        }
                        .heatmap-year-mode .react-calendar-heatmap rect {
                            width: 4px !important;
                            height: 4px !important;
                        }
                    }
                `}</style>
        </div>
    );
};
