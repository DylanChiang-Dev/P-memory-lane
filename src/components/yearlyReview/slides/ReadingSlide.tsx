import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { YearlyReviewData, YearlyMediaItem } from '../../../lib/yearlyReview';
import { YearHeatmap } from '../../habits/YearHeatmap';

interface ReadingSlideProps {
    data: YearlyReviewData['habits']['reading'];
    books: YearlyMediaItem[];
}

export const ReadingSlide: React.FC<ReadingSlideProps> = ({ data, books }) => {
    // Only show books that were actually completed
    // A book is considered "completed" if it has a rating (my_rating > 0)
    // Books without rating are likely "want to read" or "currently reading"
    const completedBooks = books.filter(book => {
        // Must have a rating to be considered completed
        return book.my_rating && book.my_rating > 0;
    });
    const completedCount = completedBooks.length;

    return (
        <div className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-8 pt-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-6"
                >
                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                        <BookOpen className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">阅读</h2>
                        <p className="text-white/40 text-sm">Knowledge & Wisdom</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col space-y-6 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-lg text-white/60 mb-2">在书页间寻找答案</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-6xl font-black text-blue-400">
                                {data.totalPages?.toLocaleString() || 0}
                            </span>
                            <span className="text-xl font-medium text-blue-400/60">页</span>
                        </div>
                        <p className="text-white/40 text-sm mt-2">
                            完成了 {completedCount} 本书，坚持 {data.totalDays} 天
                        </p>
                    </motion.div>

                    {/* Completed Books - Dynamic grid based on count */}
                    {completedCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            <h4 className="text-xs uppercase tracking-widest text-white/30 mb-3">今年读完的书</h4>
                            <div className={`grid gap-3 ${completedCount === 1 ? 'grid-cols-1 max-w-[120px]' : completedCount <= 3 ? 'grid-cols-3' : 'grid-cols-3'}`}>
                                {completedBooks.slice(0, 6).map((book, i) => (
                                    <motion.div
                                        key={book.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                                        className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative group shadow-lg"
                                    >
                                        {book.cover_image_cdn ? (
                                            <img
                                                src={book.cover_image_cdn}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-white/50 bg-slate-800">
                                                {book.title}
                                            </div>
                                        )}
                                        {/* Rating Badge */}
                                        {book.my_rating && (
                                            <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-yellow-400 font-bold">
                                                ★ {book.my_rating}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="space-y-3"
                    >
                        <h4 className="text-xs uppercase tracking-widest text-white/30">每日阅读热力图</h4>
                        <YearHeatmap data={data.heatmapData || []} color="blue" year={2025} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
