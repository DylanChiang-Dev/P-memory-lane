import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { YearlyReviewData, YearlyMediaItem } from '../../../lib/yearlyReview';
import { YearHeatmap } from '../../habits/YearHeatmap';
import { ShareButton } from '../ShareButton';

interface ReadingSlideProps {
    data: YearlyReviewData['habits']['reading'];
    books: YearlyMediaItem[];
}

export const ReadingSlide: React.FC<ReadingSlideProps> = ({ data, books }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // Only show books that were actually completed (has rating > 0)
    const completedBooks = books.filter(book => book.my_rating && book.my_rating > 0);
    const completedCount = completedBooks.length;

    return (
        <div ref={containerRef} className="w-full h-full relative snap-start flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col h-full p-6 pt-10 pb-safe">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-4"
                >
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                        <BookOpen className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">阅读</h2>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Knowledge & Wisdom</p>
                    </div>
                </motion.div>

                {/* Main Stats */}
                <div className="flex-1 flex flex-col space-y-4 justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h3 className="text-base text-white/60 mb-1">在书页间寻找答案</h3>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-5xl font-black text-blue-400">
                                {data.totalPages?.toLocaleString() || 0}
                            </span>
                            <span className="text-lg font-medium text-blue-400/60">页</span>
                        </div>
                        <p className="text-white/40 text-xs mt-1">
                            完成了 {completedCount} 本书，坚持 {data.totalDays} 天
                        </p>
                    </motion.div>

                    {/* Completed Books */}
                    {completedCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-2">今年读完的书</h4>
                            <div className="flex gap-2">
                                {completedBooks.slice(0, 4).map((book, i) => (
                                    <motion.div
                                        key={book.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                                        className="w-16 aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative shadow-lg flex-shrink-0"
                                    >
                                        {book.cover_image_cdn ? (
                                            <img
                                                src={book.cover_image_cdn}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center p-1 text-center text-[6px] text-white/50 bg-slate-800">
                                                {book.title}
                                            </div>
                                        )}
                                        {book.my_rating && (
                                            <div className="absolute top-0.5 right-0.5 bg-black/60 px-1 py-0.5 rounded text-[8px] text-yellow-400 font-bold">
                                                ★{book.my_rating}
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
                        className="space-y-2 scale-90 origin-left"
                    >
                        <h4 className="text-[10px] uppercase tracking-widest text-white/30">每日阅读热力图</h4>
                        <YearHeatmap data={data.heatmapData || []} color="blue" year={2025} />
                    </motion.div>
                </div>
            </div>

            <ShareButton targetRef={containerRef} fileName="reading-stats" />
        </div>
    );
};
