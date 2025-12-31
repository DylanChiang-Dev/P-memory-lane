import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Tv, Star } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { ShareButton } from '../ShareButton';

interface TvSlideProps {
    data: YearlyReviewData['media']['tvShows'];
}

export const TvSlide: React.FC<TvSlideProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // Top 6
    const topItems = data.items.slice(0, 6);
    // Remaining items for the scrolling list
    const remainingItems = data.items.slice(6);

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white pb-safe">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-6 pt-10 pb-safe">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-pink-500/20 rounded-xl">
                            <Tv className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">剧集</h2>
                            <p className="text-white/40 text-xs uppercase tracking-wider">Binge-worthy Stories</p>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                    {/* Stats Group */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-base text-white/60 mb-1">沉浸在每一集的心跳中</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-5xl font-black text-pink-400">{data.total}</span>
                            <span className="text-lg font-medium text-pink-400/60">部剧集</span>
                        </div>
                    </motion.div>

                    {/* Top Picks Grid - Smaller for mobile */}
                    <div className="grid grid-cols-3 gap-2">
                        {topItems.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                                className="group relative"
                            >
                                <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-white/5 relative">
                                    {item.cover_image_cdn ? (
                                        <img
                                            src={item.cover_image_cdn}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-2 text-center text-[8px] text-white/30">
                                            {item.title}
                                        </div>
                                    )}
                                    {item.my_rating && (
                                        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-yellow-500 font-bold z-10 flex items-center">
                                            <Star size={8} className="mr-0.5 fill-current" />
                                            {item.my_rating}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1">
                                    <p className="text-[8px] text-white/60 truncate leading-tight">{item.title}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Compact List */}
                    {remainingItems.length > 0 && (
                        <div className="relative mt-auto">
                            <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-2">还追了</h4>
                            <div className="flex flex-wrap gap-1.5 opacity-40 grayscale pointer-events-none">
                                {remainingItems.slice(0, 15).map((item) => (
                                    <span key={item.id} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded-full whitespace-nowrap">
                                        {item.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ShareButton targetRef={containerRef} fileName="tv-stats" />
        </div>
    );
};
