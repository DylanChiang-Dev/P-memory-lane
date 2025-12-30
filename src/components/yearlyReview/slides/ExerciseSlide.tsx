import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { Heatmap } from '../../habits/Heatmap';

interface ExerciseSlideProps {
    data: YearlyReviewData['habits']['exercise'];
}

export const ExerciseSlide: React.FC<ExerciseSlideProps> = ({ data }) => {
    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-8 pt-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-12"
                >
                    <div className="p-3 bg-orange-500/20 rounded-2xl">
                        <Dumbbell className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">运动</h2>
                        <p className="text-white/40 text-sm">Health & Fitness</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col justify-center space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-lg text-white/60 mb-2">挥酒汗水的每一个瞬间</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-6xl font-black text-orange-400">
                                {data.totalMinutes?.toLocaleString() || 0}
                            </span>
                            <span className="text-xl font-medium text-orange-400/60">分钟</span>
                        </div>
                        <p className="text-white/40 text-sm mt-2">共坚持了 {data.totalDays} 天</p>
                    </motion.div>

                    {/* Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-4"
                    >
                        <h4 className="text-xs uppercase tracking-widest text-white/30">每日运动热力图</h4>
                        <Heatmap data={data.heatmapData || []} color="orange" />
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <div className="text-2xl font-bold">{data.longestStreak}</div>
                            <div className="text-xs text-white/40">最长连续 (天)</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <div className="text-2xl font-bold">{data.currentStreak}</div>
                            <div className="text-xs text-white/40">当前连续 (天)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
