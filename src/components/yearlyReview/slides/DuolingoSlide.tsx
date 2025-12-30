import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Languages } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { YearHeatmap } from '../../habits/YearHeatmap';

interface DuolingoSlideProps {
    data: YearlyReviewData['habits']['duolingo'];
}

export const DuolingoSlide: React.FC<DuolingoSlideProps> = ({ data }) => {
    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-8 pt-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-12"
                >
                    <div className="p-3 bg-green-500/20 rounded-2xl">
                        <Languages className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">多邻国</h2>
                        <p className="text-white/40 text-sm">Language Learning</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col justify-center space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-lg text-white/60 mb-2">Learning a language is a marathon</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-6xl font-black text-green-400">
                                {data.totalXP?.toLocaleString() || 0}
                            </span>
                            <span className="text-xl font-medium text-green-400/60">XP</span>
                        </div>
                        <p className="text-white/40 text-sm mt-2">打卡 {data.totalDays} 天</p>
                    </motion.div>

                    {/* Streak Visualization */}
                    <div className="flex items-center justify-center py-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse rounded-full" />
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="relative flex flex-col items-center"
                            >
                                <Flame className="w-24 h-24 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] fill-orange-500 animate-pulse" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-2">
                                    <span className="block text-2xl font-black text-white drop-shadow-md">
                                        {data.currentStreak > 0 ? data.currentStreak : data.longestStreak}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-white/80">
                                        {data.currentStreak > 0 ? 'Current Streak' : 'Longest Streak'}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="space-y-4"
                    >
                        <h4 className="text-xs uppercase tracking-widest text-white/30">每日学习热力图</h4>
                        <YearHeatmap data={data.heatmapData || []} color="green" year={2025} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
