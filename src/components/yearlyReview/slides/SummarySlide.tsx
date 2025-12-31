import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { ShareButton } from '../ShareButton';

interface SummarySlideProps {
    data: YearlyReviewData;
}

export const SummarySlide: React.FC<SummarySlideProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-white text-black p-6 pt-10 pb-safe">
            {/* Minimal Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.02),transparent)] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full items-center text-center">
                {/* Header - More Compact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="flex items-center justify-center space-x-2 text-black/20 mb-2">
                        <Sparkles size={16} />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Annual Report</span>
                        <Sparkles size={16} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight leading-none">2025 年度总结</h2>
                </motion.div>

                {/* Stats Grid - Vertical Compression */}
                <div className="w-full flex-1 flex flex-col justify-center space-y-4 max-w-sm mx-auto">
                    {[
                        { label: 'Books', count: data.media.books.total, unit: '本阅读', color: 'bg-blue-50' },
                        { label: 'Movies & TV', count: data.media.movies.total + data.media.tvShows.total, unit: '部影视', color: 'bg-purple-50' },
                        { label: 'Exercise', count: data.exercise.total_days, unit: '天健身', color: 'bg-emerald-50' },
                        { label: 'Duolingo', count: data.duolingo.total_days, unit: '天学习', color: 'bg-yellow-50' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className={`flex items-center justify-between p-4 rounded-3xl ${stat.color} border border-black/5`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-black/40">{stat.label}</span>
                            <div className="text-right">
                                <span className="text-2xl font-black mr-1">{stat.count}</span>
                                <span className="text-[10px] font-bold text-black/60">{stat.unit}</span>
                            </div>
                        </motion.div>
                    ))}

                    {/* Final Message - Shortened */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="pt-4"
                    >
                        <div className="flex items-center justify-center space-x-2 text-black/60 mb-1">
                            <Heart size={14} className="fill-red-500 text-red-500" />
                            <span className="text-xs font-bold">每一个瞬间，都值得珍藏</span>
                        </div>
                        <p className="text-[10px] text-black/30 font-medium">Memory Lane · 2025 Recap</p>
                    </motion.div>
                </div>

                {/* Share Action Container - Ensure it's above safe area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 mb-2"
                >
                    <ShareButton
                        targetRef={containerRef}
                        fileName="yearly-summary-2025"
                        label="分享我的 2025"
                        isLarge={true}
                    />
                </motion.div>
            </div>
        </div>
    );
};
