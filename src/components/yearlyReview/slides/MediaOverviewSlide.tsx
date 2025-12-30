import React from 'react';
import { motion } from 'framer-motion';
import { Film, Book, Gamepad2, Tv, Clapperboard, Mic, MonitorPlay } from 'lucide-react';
import type { YearlyReviewData } from '../../../lib/yearlyReview';

interface MediaOverviewSlideProps {
    media: YearlyReviewData['media'];
}

export const MediaOverviewSlide: React.FC<MediaOverviewSlideProps> = ({ media }) => {
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
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-8 pt-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-12"
                >
                    <div className="p-3 bg-indigo-500/20 rounded-2xl">
                        <Film className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">视听盛宴</h2>
                        <p className="text-white/40 text-sm">Media Consumption</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="mb-8"
                    >
                        <h3 className="text-lg text-white/60 mb-2">穿梭于不同世界</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-6xl font-black text-indigo-400">
                                {totalMediaCount}
                            </span>
                            <span className="text-xl font-medium text-indigo-400/60">部作品</span>
                        </div>
                    </motion.div>

                    {/* Media Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {categories.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                                className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors"
                            >
                                <div className={`flex items-start justify-between mb-4 ${item.color}`}>
                                    <div className={`p-2 rounded-lg ${item.bg}`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-bold">{item.count}</span>
                                </div>
                                <div className="text-sm text-white/60">{item.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
