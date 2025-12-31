import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame, Languages } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { YearHeatmap } from '../../habits/YearHeatmap';
import { ShareButton } from '../ShareButton';

interface DuolingoSlideProps {
    data: YearlyReviewData['habits']['duolingo'];
}

export const DuolingoSlide: React.FC<DuolingoSlideProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-6 pt-10 pb-safe">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-6"
                >
                    <div className="p-2 bg-green-500/20 rounded-xl">
                        <Languages className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">多邻国</h2>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Language Learning</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-base text-white/60 mb-1">Learning a language is a marathon</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-5xl font-black text-green-400">
                                {data.totalXP?.toLocaleString() || 0}
                            </span>
                            <span className="text-lg font-medium text-green-400/60">XP</span>
                        </div>
                        <p className="text-white/40 text-xs mt-1">打卡 {data.totalDays} 天</p>
                    </motion.div>

                    {/* Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-2 scale-95 origin-left"
                    >
                        <h4 className="text-[10px] uppercase tracking-widest text-white/30">每日学习热力图</h4>
                        <YearHeatmap data={data.heatmapData || []} color="green" year={2025} />
                    </motion.div>

                    {/* Streak Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-2xl flex items-center space-x-3">
                            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                            <div>
                                <div className="text-xl font-bold">{data.currentStreak}</div>
                                <div className="text-[10px] text-white/40">当前连胜 (天)</div>
                            </div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl">
                            <div className="text-xl font-bold">{data.longestStreak}</div>
                            <div className="text-[10px] text-white/40">最长连续 (天)</div>
                        </div>
                    </div>
                </div>
            </div>

            <ShareButton targetRef={containerRef} fileName="duolingo-stats" />
        </div>
    );
};
