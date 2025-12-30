import React from 'react';
import { motion } from 'framer-motion';
import { Tv, Star } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';

interface TvSlideProps {
    data: YearlyReviewData['media']['tvShows'];
}

export const TvSlide: React.FC<TvSlideProps> = ({ data }) => {
    // Top 6
    const topItems = data.items.slice(0, 6);
    // Remaining items for the scrolling list
    const remainingItems = data.items.slice(6);

    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-8 pt-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-8"
                >
                    <div className="p-3 bg-pink-500/20 rounded-2xl">
                        <Tv className="w-8 h-8 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">剧集</h2>
                        <p className="text-white/40 text-sm">Binge Watching</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-lg text-white/60 mb-2">未完待续的故事</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-6xl font-black text-pink-400">
                                {data.total}
                            </span>
                            <span className="text-xl font-medium text-pink-400/60">部剧集</span>
                        </div>
                        <p className="text-white/40 text-sm mt-2">追逐着 {data.total} 个精彩的平行世界</p>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {topItems.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                                className="flex flex-col"
                            >
                                <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative group shadow-lg">
                                    {item.cover_image_cdn ? (
                                        <img
                                            src={item.cover_image_cdn}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-white/50 bg-slate-800">
                                            {item.title}
                                        </div>
                                    )}
                                    {/* Rating Badge */}
                                    {item.my_rating && (
                                        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-yellow-400 font-bold">
                                            <Star className="w-2 h-2 inline-block mr-0.5 fill-current" />
                                            {item.my_rating}
                                        </div>
                                    )}
                                </div>
                                {/* Title below poster */}
                                <p className="mt-1 text-xs text-white/60 text-center line-clamp-2 leading-tight">
                                    {item.title}
                                </p>
                            </motion.div>
                        ))}
                        {Array.from({ length: Math.max(0, 6 - topItems.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-[2/3] bg-white/5 rounded-lg" />
                        ))}
                    </div>

                    {/* Remaining items - static list */}
                    {remainingItems.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="mt-auto pt-4"
                        >
                            <h4 className="text-xs uppercase tracking-widest text-white/30 mb-2">还追了</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {remainingItems.map((item) => (
                                    <span key={item.id} className="inline-flex items-center text-sm text-white/60">
                                        {item.my_rating && (
                                            <span className="text-yellow-400 mr-1">★{item.my_rating}</span>
                                        )}
                                        <span>{item.title}</span>
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
