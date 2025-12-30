import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import type { YearlyReviewData, YearlyMediaItem } from '../../../lib/yearlyReview';

interface TopPicksSlideProps {
    media: YearlyReviewData['media'];
}

export const TopPicksSlide: React.FC<TopPicksSlideProps> = ({ media }) => {
    // Helper to get top item
    const getTopItem = (items: YearlyMediaItem[]) => items.length > 0 ? items[0] : null;

    const topMovie = getTopItem(media.movies.items);
    const topBook = getTopItem(media.books.items);
    const topGame = getTopItem(media.games.items);

    const categories = [
        { label: 'Movie of the Year', item: topMovie, bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        { label: 'Book of the Year', item: topBook, bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
        { label: 'Game of the Year', item: topGame, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    ].filter(c => c.item !== null);

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
                        <Trophy className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">年度之最</h2>
                        <p className="text-white/40 text-sm">Hall of Fame</p>
                    </div>
                </motion.div>

                {/* Vertical List of Top Picks */}
                <div className="flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar pb-8">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (i * 0.2), duration: 0.6 }}
                            className={`relative rounded-2xl overflow-hidden border ${cat.border} group`}
                        >
                            {/* Background Image (blurred) */}
                            {cat.item?.cover_image_cdn && (
                                <div className="absolute inset-0">
                                    <img src={cat.item.cover_image_cdn} alt="" className="w-full h-full object-cover opacity-20 blur-sm scale-110 group-hover:scale-100 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                                </div>
                            )}

                            <div className="relative p-5 flex items-start space-x-4">
                                {/* Small Cover */}
                                <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-lg">
                                    {cat.item?.cover_image_cdn ? (
                                        <img src={cat.item.cover_image_cdn} alt={cat.item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-2 text-xs text-white/40">{cat.item?.title}</div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 py-1">
                                    <div className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-1">
                                        {cat.label}
                                    </div>
                                    <h3 className="text-xl font-bold leading-tight line-clamp-2 mb-2">
                                        {cat.item?.title}
                                    </h3>
                                    {cat.item?.my_rating && (
                                        <div className="flex items-center text-yellow-400 space-x-1">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-bold">{cat.item.my_rating}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {categories.length === 0 && (
                        <div className="text-center text-white/40 py-12">
                            暂无最佳记录
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
