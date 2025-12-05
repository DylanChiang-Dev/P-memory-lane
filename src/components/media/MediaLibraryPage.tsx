import React, { useState, useEffect } from 'react';
import { Loader2, Grid3x3, List, Search, ArrowUpDown } from 'lucide-react';
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
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState<'all' | 'watched' | 'watching' | 'want_to_watch'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = React.useRef(null);

    // New state for search and sort
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<'completed_date_desc' | 'rating_desc' | 'rating_asc'>('completed_date_desc');

    const [totalItems, setTotalItems] = useState(0);

    // Debounce search query
    const [debouncedSearch] = useDebounceValue(searchQuery, 500);

    // Reset when filter, type, sort, or search changes
    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
        setTotalItems(0);
        loadData(1, true);
    }, [filter, mediaType, sort, debouncedSearch]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, page]);

    const loadData = async (pageNum: number, isInitial: boolean = false) => {
        try {
            if (!isInitial) setLoadingMore(true);

            const result = await fetchMediaItems(
                mediaType,
                filter === 'all' ? undefined : filter,
                pageNum,
                20, // Items per page
                sort,
                debouncedSearch
            );

            // Handle both new object return and potential old array return (safety)
            const newItems = Array.isArray(result) ? result : result.items;
            const pagination = Array.isArray(result) ? null : result.pagination;

            if (pagination) {
                setTotalItems(pagination.total);
            }

            if (isInitial) {
                setItems(newItems);
            } else {
                // Append new items (backend ensures no duplicates via proper sorting)
                setItems(prev => [...prev, ...newItems]);
            }

            // Update hasMore based on pagination data
            if (pagination) {
                setHasMore(pagination.page < Math.ceil(pagination.total / pagination.limit));
            } else {
                setHasMore(newItems.length === 20); // Fallback heuristic
            }

        } catch (error) {
            console.error('Failed to load media:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage);
    };

    const filterOptions = [
        { value: 'all', label: '全部' },
        { value: 'watched', label: '已完成' },
        { value: 'watching', label: '进行中' },
        { value: 'want_to_watch', label: '计划中' },
    ];

    const sortOptions = [
        { value: 'completed_date_desc', label: '觀看時間' },
        { value: 'rating_desc', label: '評分最高' },
        { value: 'rating_asc', label: '評分最低' },
    ];

    // Helper to group items by date - relies on backend sorting
    const groupedItems = React.useMemo(() => {
        if (sort !== 'completed_date_desc' || viewMode !== 'grid') return null;

        // Backend returns items in sorted order, just group by year-month
        const groupOrder: string[] = [];
        const groups: Record<string, any[]> = {};

        items.forEach(item => {
            const dateStr = item.completed_date || item.date;
            let key = '未知日期';
            if (dateStr) {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                key = `${year}年 ${month}月`;
            }
            if (!groups[key]) {
                groups[key] = [];
                groupOrder.push(key);
            }
            groups[key].push(item);
        });

        // Return groups in order of first appearance (which follows backend sort order)
        return groupOrder.map(key => [key, groups[key]] as [string, any[]]);
    }, [items, sort, viewMode]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-baseline gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
                            {title}
                        </h1>
                        {totalItems > 0 && (
                            <span className="text-xl text-zinc-500 font-medium">
                                {totalItems} 部
                            </span>
                        )}
                    </div>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">{description}</p>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                    {/* ... (keep existing controls) */}
                    {/* Left: Filters */}
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-white/10 overflow-x-auto max-w-full">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value as any)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${filter === option.value
                                    ? 'bg-teal-500 text-white shadow-md'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: Search, Sort, View Mode */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">

                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                placeholder="搜索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>

                        {/* Sort */}
                        <div className="relative w-full sm:w-40">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as any)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* View Mode */}
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-white/10">
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
                </div>

                {/* Content */}
                {loading && items.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-zinc-500" size={32} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                            {debouncedSearch ? '未找到相关内容' : `暂无${title}记录`}
                        </p>
                    </div>
                ) : (
                    <>
                        {groupedItems ? (
                            <div className="space-y-8">
                                {groupedItems.map(([dateKey, groupItems]) => (
                                    <div key={dateKey} className="space-y-4">
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white sticky top-0 bg-zinc-50/90 dark:bg-black/90 backdrop-blur-sm py-2 z-10">
                                            {dateKey}
                                            <span className="ml-2 text-sm font-normal text-zinc-500">
                                                ({groupItems.length})
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                                            {groupItems.map((item: any) => (
                                                <MediaCard
                                                    key={`${item.id}-${item.tmdb_id}`}
                                                    item={item}
                                                    type={getSingularType(mediaType)}
                                                    viewMode={viewMode}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
                                        key={`${item.id}-${item.tmdb_id}`}
                                        item={item}
                                        type={getSingularType(mediaType)}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Loading More Indicator & Sentinel */}
                        <div className="flex flex-col items-center justify-center mt-8 gap-4">
                            <div ref={observerTarget} className="h-4 w-full" />

                            {loadingMore && (
                                <Loader2 className="animate-spin text-zinc-500" size={24} />
                            )}

                            {!loadingMore && hasMore && (
                                <button
                                    onClick={loadMore}
                                    className="px-6 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    加载更多
                                </button>
                            )}

                            {!hasMore && items.length > 0 && (
                                <p className="text-zinc-400 text-sm">没有更多内容了</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

function getSingularType(pluralType: string): any {
    const map: Record<string, string> = {
        'movies': 'movie',
        'tv-shows': 'tv',
        'books': 'book',
        'games': 'game',
        'podcasts': 'podcast',
        'documentaries': 'documentary',
        'anime': 'anime'
    };
    return map[pluralType] || pluralType;
}

// Inline debounce hook
function useDebounceValue<T>(value: T, delay: number): [T] {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return [debouncedValue];
}
