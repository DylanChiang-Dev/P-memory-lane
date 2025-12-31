import React from 'react';
import { motion } from 'framer-motion';
import { Tv } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';

interface TvSlideProps {
    data: YearlyReviewData['media']['tvShows'];
}

export const TvSlide: React.FC<TvSlideProps> = ({ data }) => {
    const topItems = data.items.slice(0, 9);

    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-5 pt-10 pb-safe">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-2"
                >
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-pink-500/20 rounded-xl">
                            <Tv className="w-5 h-5 text-pink-400" />
                        </div>
                        <h2 className="text-xl font-bold">剧集</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-pink-400">{data.total}</span>
                        <span className="text-sm text-pink-400/60 ml-1">部</span>
                    </div>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/50 text-sm mb-3">
                    未完待续的故事
                </motion.p>

                {/* 3x3 Grid */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-[320px] mx-auto">
                    {topItems.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + (i * 0.02), duration: 0.3 }} className="flex flex-col">
                            <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative shadow-lg">
                                {item.cover_image_cdn ? <img src={item.cover_image_cdn} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center p-1 text-center text-[8px] text-white/50">{item.title}</div>}
                                {item.my_rating && <div className="absolute top-0.5 right-0.5 bg-black/70 px-1 py-0.5 rounded text-[8px] text-yellow-400 font-bold">★{item.my_rating}</div>}
                            </div>
                            <p className="mt-1 text-[10px] text-white/50 text-center line-clamp-1">{item.title}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 text-center">
                    <p className="text-sm text-white/40 italic">"追逐着精彩的平行世界"</p>
                </motion.div>
            </div>
        </div>
    );
};
