import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { MediaCard, type MediaItem } from './MediaCard';
import { fetchMediaItems } from '../../lib/api';

interface MediaRowProps {
    title: string;
    type: 'movie' | 'tv' | 'book' | 'game' | 'podcast' | 'documentary' | 'anime';
    moreLink: string;
}

export const MediaRow: React.FC<MediaRowProps> = ({ title, type, moreLink }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async (retry = true) => {
            setLoading(true);
            setError(null);
            try {
                // Map frontend type to API type
                const apiType =
                    type === 'movie' ? 'movies' :
                        type === 'tv' ? 'tv-shows' :
                            type === 'book' ? 'books' :
                                type === 'game' ? 'games' :
                                    type === 'podcast' ? 'podcasts' :
                                        type === 'documentary' ? 'documentaries' :
                                            'anime';

                const data = await fetchMediaItems(apiType);
                setItems(data);
            } catch (err) {
                if (err instanceof Error && err.message === 'Unauthorized' && retry) {
                    // Token was likely invalid and cleared by fetchWithAuth
                    // Retry once to fetch as public user
                    await loadData(false);
                    return;
                }
                console.error('Failed to load media items', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [type]);

    // Retry logic for auth race conditions
    useEffect(() => {
        if (!loading && items.length === 0) {
            const timer = setTimeout(() => {
                const token = localStorage.getItem('access_token');
                if (token) {
                    // Retry fetching if we have a token but got no items (likely 401 or network error)
                    fetchMediaItems(
                        type === 'movie' ? 'movies' :
                            type === 'tv' ? 'tv-shows' :
                                type === 'book' ? 'books' :
                                    type === 'game' ? 'games' :
                                        type === 'podcast' ? 'podcasts' :
                                            type === 'documentary' ? 'documentaries' :
                                                'anime'
                    ).then(data => {
                        if (data.length > 0) {
                            setItems(data);
                            setError(null);
                        }
                    });
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, items.length, type]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 py-4">
                <div className="h-8 bg-zinc-800/50 rounded-lg w-48 animate-pulse ml-4 md:ml-0"></div>
                <div className="flex gap-4 overflow-hidden px-4 md:px-0">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-[140px] md:w-[160px] aspect-[2/3] bg-zinc-800/50 rounded-xl animate-pulse flex-shrink-0"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Color mapping for different media types
    const colorMap = {
        movie: 'bg-blue-500',
        tv: 'bg-purple-500',
        book: 'bg-emerald-500',
        game: 'bg-orange-500',
        podcast: 'bg-pink-500',
        documentary: 'bg-amber-500',
        anime: 'bg-rose-500',
    };

    if (items.length === 0) {
        // Show header even if empty, so it doesn't disappear
        return (
            <div className="space-y-4 py-4 opacity-50">
                <div className="flex items-center justify-between px-4 md:px-0">
                    <h2 className="text-xl font-bold text-zinc-500 flex items-center gap-2">
                        <span className={`w-1 h-5 rounded-full ${colorMap[type]} grayscale`}></span>
                        {title}
                    </h2>
                </div>
                <div className="px-4 md:px-0 text-sm text-zinc-500">暂无內容</div>
            </div>
        );
    }

    return (
        <div className="space-y-4 py-4">
            <div className="flex items-center justify-between px-4 md:px-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className={`w-1 h-5 rounded-full ${colorMap[type]}`}></span>
                    {title}
                </h2>
                <a
                    href={moreLink}
                    className="group flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
                >
                    更多
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
            </div>

            <div className="relative group/row">
                {/* Left Scroll Button */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover/row:opacity-100 transition-opacity disabled:opacity-0 -ml-4 hidden md:block hover:bg-black/80"
                >
                    <ChevronRight size={24} className="rotate-180" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-0 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item) => (
                        <div key={item.id} className="snap-start flex-shrink-0 w-[140px] md:w-[160px]">
                            <MediaCard item={item} type={type} />
                        </div>
                    ))}

                    {/* View All Card */}
                    <a
                        href={moreLink}
                        className="flex-shrink-0 w-[140px] md:w-[160px] aspect-[2/3] rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all cursor-pointer snap-start"
                    >
                        <div className="p-3 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                            <ArrowRight size={20} />
                        </div>
                        <span className="text-sm font-medium">查看更多</span>
                    </a>
                </div>

                {/* Right Scroll Button */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover/row:opacity-100 transition-opacity disabled:opacity-0 -mr-4 hidden md:block hover:bg-black/80"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};
