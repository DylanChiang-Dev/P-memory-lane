import React from 'react';
import { motion } from 'framer-motion';
import { Film, Star } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';

interface MovieMoreSlideProps {
    data: YearlyReviewData['media']['movies'];
}

export const MovieMoreSlide: React.FC<MovieMoreSlideProps> = ({ data }) => {
    // Remaining items after top 9
    const remainingItems = data.items.slice(9);

    if (remainingItems.length === 0) return null;

    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-5 pt-10 pb-safe overflow-y-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center space-x-2 mb-3"
                >
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                        <Film className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">更多观看</h2>
                        <p className="text-[10px] text-white/40">还有 {remainingItems.length} 部电影</p>
                    </div>
                </motion.div>

                {/* List */}
                <div className="flex-1 space-y-1.5">
                    {remainingItems.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02, duration: 0.3 }}
                            className="flex items-center space-x-2 py-1 border-b border-white/5"
                        >
                            {/* Rating */}
                            <div className="w-8 text-center">
                                {item.my_rating ? (
                                    <span className="text-yellow-400 text-xs font-bold">
                                        <Star className="w-2.5 h-2.5 inline fill-current mr-0.5" />
                                        {item.my_rating}
                                    </span>
                                ) : (
                                    <span className="text-white/20 text-xs">-</span>
                                )}
                            </div>
                            {/* Title */}
                            <span className="flex-1 text-xs text-white/70 truncate">{item.title}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Footer quote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 text-center"
                >
                    <p className="text-[9px] text-white/20 italic">
                        这一年，在银幕前度过了无数美好时光
                    </p>
                </motion.div>
            </div>
        </div>
    );
};
