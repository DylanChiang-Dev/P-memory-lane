import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Star } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';

interface PodcastSlideProps {
    data: YearlyReviewData['media']['podcasts'];
}

export const PodcastSlide: React.FC<PodcastSlideProps> = ({ data }) => {
    // Top 6
    const topItems = data.items.slice(0, 6);

    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-8 pt-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-8"
                >
                    <div className="p-3 bg-yellow-500/20 rounded-2xl">
                        <Mic className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">播客</h2>
                        <p className="text-white/40 text-sm">Audio Journey</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-lg text-white/60 mb-2">聆听声音的力量</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-6xl font-black text-yellow-400">
                                {data.total}
                            </span>
                            <span className="text-xl font-medium text-yellow-400/60">档播客</span>
                        </div>
                        <p className="text-white/40 text-sm mt-2">在 {data.total} 个声音中寻找共鸣</p>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {topItems.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                                className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative group shadow-lg"
                            >
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
                            </motion.div>
                        ))}
                        {Array.from({ length: Math.max(0, 6 - topItems.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-[2/3] bg-white/5 rounded-lg" />
                        ))}
                    </div>

                    <div className="flex-1" />
                </div>
            </div>
        </div>
    );
};
