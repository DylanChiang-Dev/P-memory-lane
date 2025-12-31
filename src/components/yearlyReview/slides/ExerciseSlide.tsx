import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { YearHeatmap } from '../../habits/YearHeatmap';
import { ShareButton } from '../ShareButton';

interface ExerciseSlideProps {
    data: YearlyReviewData['habits']['exercise'];
}

export const ExerciseSlide: React.FC<ExerciseSlideProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-6 pt-10 pb-safe">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-6"
                >
                    <div className="p-2 bg-orange-500/20 rounded-xl">
                        <Dumbbell className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">运动</h2>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Health & Fitness</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col justify-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-base text-white/60 mb-1">挥酒汗水的每一个瞬间</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-5xl font-black text-orange-400">
                                {data.totalMinutes?.toLocaleString() || 0}
                            </span>
                            <span className="text-lg font-medium text-orange-400/60">分钟</span>
                        </div>
                        <p className="text-white/40 text-xs mt-1">共坚持了 {data.totalDays} 天</p>
                    </motion.div>

                    {/* Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-4 scale-95 origin-left"
                    >
                        <h4 className="text-[10px] uppercase tracking-widest text-white/30">每日运动热力图</h4>
                        <YearHeatmap data={data.heatmapData || []} color="orange" year={2025} />
                    </motion.div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-2xl">
                            <div className="text-xl font-bold">{data.longestStreak}</div>
                            <div className="text-[10px] text-white/40">最长连续 (天)</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl">
                            <div className="text-xl font-bold">{data.currentStreak}</div>
                            <div className="text-[10px] text-white/40">当前连续 (天)</div>
                        </div>
                    </div>
                </div>
            </div>

            <ShareButton targetRef={containerRef} fileName="exercise-stats" />
        </div>
    );
};
