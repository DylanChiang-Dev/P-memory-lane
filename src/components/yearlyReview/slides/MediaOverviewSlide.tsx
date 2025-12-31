import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Film, Book, Gamepad2, Tv, Clapperboard, Mic, MonitorPlay, BarChart2 } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';
import { ShareButton } from '../ShareButton';

interface MediaOverviewSlideProps {
    media: YearlyReviewData['media'];
}

export const MediaOverviewSlide: React.FC<MediaOverviewSlideProps> = ({ media }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // Media categories config
    const categories = [
        { id: 'movies', label: 'Movie', icon: Film, count: media.movies.total, color: 'text-purple-400', bg: 'bg-purple-500/20' },
        { id: 'tv', label: 'TV Series', icon: Tv, count: media.tvShows.total, color: 'text-pink-400', bg: 'bg-pink-500/20' },
        { id: 'books', label: 'Book', icon: Book, count: media.books.total, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        { id: 'games', label: 'Game', icon: Gamepad2, count: media.games.total, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        { id: 'anime', label: 'Anime', icon: Clapperboard, count: media.anime.total, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
        { id: 'docs', label: 'Doc', icon: MonitorPlay, count: media.documentaries.total, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
        { id: 'podcasts', label: 'Podcast', icon: Mic, count: media.podcasts.total, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    ].filter(c => c.count > 0); // Only show categories with data

    const totalMediaCount = categories.reduce((sum, item) => sum + item.count, 0);

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white pb-safe">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-6 pt-10 pb-safe">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-6"
                >
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                        <BarChart2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">媒体概览</h2>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Content Consumption</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="text-center"
                    >
                        <div className="text-xs uppercase tracking-[0.3em] text-white/30 mb-2">Total Combined</div>
                        <div className="text-7xl font-black text-white selection:bg-white selection:text-black">
                            {totalMediaCount}
                        </div>
                        <div className="text-xs text-white/40 mt-2">不同的世界，同样的感动</div>
                    </motion.div>

                    {/* Breakdown Grid - Compact */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {categories.map((category, i) => (
                            <motion.div
                                key={category.label}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center"
                            >
                                <category.icon className="w-5 h-5 text-white/40 mb-2" />
                                <div className="text-2xl font-black text-white leading-none mb-1">
                                    {category.count}
                                </div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest leading-none">
                                    {category.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <ShareButton targetRef={containerRef} fileName="media-overview" />
        </div>
    );
};
