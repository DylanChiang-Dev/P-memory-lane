import React, { useState, useEffect } from 'react';
import { Loader2, Filter, Grid3x3, List } from 'lucide-react';
import { fetchMediaItems } from '../../lib/api';
import { MediaCard } from './MediaCard';

interface MediaLibraryPageProps {
    mediaType: 'movies' | 'tv-shows' | 'books' | 'games' | 'podcasts' | 'documentaries' | 'anime';
    title: string;
    description: string;
    showAddButton?: boolean;
}

export const MediaLibraryPage: React.FC<MediaLibraryPageProps> = ({
    mediaType,
    title,
    description,
    showAddButton = false,
}) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'watched' | 'watching' | 'want_to_watch'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadData();
    }, [filter, mediaType]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchMediaItems(mediaType, filter === 'all' ? undefined : filter);
            setItems(data);
        } catch (error) {
            console.error('Failed to load media:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOptions = [
        { value: 'all', label: '全部' },
        { value: 'watched', label: '已完成' },
        { value: 'watching', label: '进行中' },
        { value: 'want_to_watch', label: '计划中' },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        {title}
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">{description}</p>
                </div>

                {/* Filters & View Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-white/10">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value as any)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === option.value
                                    ? 'bg-teal-500 text-white shadow-md'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                                ? 'bg-teal-500 text-white'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <Grid3x3 size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                                ? 'bg-teal-500 text-white'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-zinc-500" size={32} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                            暂无{title}记录
                        </p>
                    </div>
                ) : (
                    <div
                        className={
                            viewMode === 'grid'
                                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6'
                                : 'space-y-4'
                        }
                    >
                        {items.map((item) => (
                            <MediaCard
                                key={item.id}
                                item={item}
                                mediaType={mediaType}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
