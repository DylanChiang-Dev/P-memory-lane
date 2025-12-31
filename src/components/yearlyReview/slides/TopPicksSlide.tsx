import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { ShareButton } from '../ShareButton';

interface TopPicksSlideProps {
    data: YearlyReviewData['topPicks'];
}

export const TopPicksSlide: React.FC<TopPicksSlideProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white pb-safe">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-6 pt-10 pb-safe">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-6"
                >
                    <div className="p-2 bg-yellow-500/20 rounded-xl">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">年度之选</h2>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Top Picks of 2025</p>
                    </div>
                </motion.div>

                {/* Main Content - Compact Grid */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 gap-3 content-center">
                    {data.map((item, i) => (
                        <motion.div
                            key={item.category}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center space-x-4"
                        >
                            <div className="w-16 h-24 flex-shrink-0 bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-white/5">
                                {item.cover_image_cdn ? (
                                    <img
                                        src={item.cover_image_cdn}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-1 text-center text-[8px] text-white/30 uppercase">
                                        {item.category}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase tracking-widest text-yellow-500/60 font-medium mb-1 flex items-center">
                                    <Star size={8} className="mr-1 fill-current" />
                                    {item.category}
                                </div>
                                <h3 className="text-sm font-bold text-white truncate leading-tight mb-1">{item.title}</h3>
                                {item.reason && (
                                    <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">
                                        {item.reason}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <ShareButton targetRef={containerRef} fileName="top-picks" />
        </div>
    );
};
