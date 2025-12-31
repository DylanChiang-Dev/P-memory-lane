import React from 'react';
import { motion } from 'framer-motion';
import { Clapperboard, Star } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';

interface AnimeSlideProps {
    data: YearlyReviewData['media']['anime'];
}

export const AnimeSlide: React.FC<AnimeSlideProps> = ({ data }) => {
    const topItems = data.items.slice(0, 6);
    const remainingItems = data.items.slice(6);

    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-5 pt-10 pb-safe">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-indigo-500/20 rounded-xl"><Clapperboard className="w-5 h-5 text-indigo-400" /></div>
                        <h2 className="text-xl font-bold">番剧</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-indigo-400">{data.total}</span>
                        <span className="text-sm text-indigo-400/60 ml-1">部</span>
                    </div>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/40 text-xs mb-2">二次元的羁绊</motion.p>

                <div className="grid grid-cols-3 gap-1.5">
                    {topItems.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + (i * 0.03), duration: 0.3 }} className="flex flex-col">
                            <div className="aspect-[2/3] bg-slate-800 rounded overflow-hidden relative shadow-lg">
                                {item.cover_image_cdn ? <img src={item.cover_image_cdn} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center p-1 text-center text-[8px] text-white/50">{item.title}</div>}
                                {item.my_rating && <div className="absolute top-0.5 right-0.5 bg-black/70 px-1 py-0.5 rounded text-[8px] text-yellow-400 font-bold">★{item.my_rating}</div>}
                            </div>
                            <p className="mt-0.5 text-[8px] text-white/50 text-center line-clamp-1">{item.title}</p>
                        </motion.div>
                    ))}
                </div>

                {remainingItems.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3 pt-2 border-t border-white/10">
                        <h4 className="text-[10px] text-white/30 mb-1.5">更多观看</h4>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            {remainingItems.map((item) => (
                                <span key={item.id} className="inline-flex items-center text-[10px] text-white/50">
                                    {item.my_rating && <span className="text-yellow-400/80 mr-0.5">★{item.my_rating}</span>}{item.title}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
