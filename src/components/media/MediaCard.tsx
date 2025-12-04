import React from 'react';
import { Star } from 'lucide-react';
import { getIGDBImageUrl } from '../../lib/igdb';

export interface MediaItem {
    id: number;
    title?: string;
    name?: string; // Some APIs return name instead of title
    poster_path?: string;
    cover_url?: string;
    background_image?: string;
    image?: string; // Fallback
    my_rating?: number;
    rating?: number;
    release_date?: string;
    first_air_date?: string;
    published_date?: string;
    status?: string;
    // Specific fields
    host?: string;
    episodes_listened?: number;
    episodes_watched?: number;
    total_episodes?: number;
    platform?: string;
}

interface MediaCardProps {
    item: MediaItem;
    type: 'movie' | 'tv' | 'book' | 'game' | 'podcast' | 'documentary' | 'anime';
    viewMode?: 'grid' | 'list';
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, type, viewMode = 'grid' }) => {
    const title = getItemTitle(item, type);
    const image = getItemImage(item, type);
    const rating = item.my_rating || item.rating;
    const date = item.release_date || item.first_air_date || item.published_date;
    const year = date ? new Date(date).getFullYear() : '';

    // Type specific info
    const renderExtraInfo = () => {
        if (type === 'podcast') {
            return (
                <div className="text-xs text-zinc-400 mt-1">
                    {item.host && <span className="block">{item.host}</span>}
                    {item.episodes_listened !== undefined && (
                        <span>{item.episodes_listened} / {item.total_episodes || '?'} eps</span>
                    )}
                </div>
            );
        }
        if (type === 'anime' || type === 'tv') {
            return (
                <div className="text-xs text-zinc-400 mt-1">
                    {item.episodes_watched !== undefined && (
                        <span>{item.episodes_watched} / {item.total_episodes || '?'} eps</span>
                    )}
                </div>
            );
        }
        if (type === 'game' && item.platform) {
            return <div className="text-xs text-zinc-400 mt-1">{item.platform}</div>;
        }
        return null;
    };

    if (viewMode === 'list') {
        return (
            <div className="flex gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-teal-500/50 transition-colors group cursor-pointer">
                <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                    <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0 py-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate pr-4">{title}</h3>
                        {rating && (
                            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs font-bold">
                                <Star size={12} fill="currentColor" />
                                {Number(rating).toFixed(1)}
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{year}</div>
                    {renderExtraInfo()}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-shrink-0 w-full group cursor-pointer">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-lg bg-zinc-800 ring-1 ring-white/10">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">

                    <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-medium">
                        {year}
                    </span>
                    {type === 'podcast' && item.episodes_listened !== undefined && (
                        <div className="w-full bg-zinc-700 h-1 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-pink-500 h-full"
                                style={{ width: `${Math.min(100, (item.episodes_listened / (item.total_episodes || 1)) * 100)}%` }}
                            />
                        </div>
                    )}
                    {(type === 'anime' || type === 'tv') && item.episodes_watched !== undefined && (
                        <div className="w-full bg-zinc-700 h-1 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-teal-500 h-full"
                                style={{ width: `${Math.min(100, (item.episodes_watched / (item.total_episodes || 1)) * 100)}%` }}
                            />
                        </div>
                    )}
                </div>
                {item.status && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white border border-white/10">
                        {(() => {
                            const statusMap: Record<string, string> = {
                                'watched': '已看',
                                'watching': '在追',
                                'want_to_watch': '想看',
                                'completed': '已完成',
                                'progress': '進行中',
                                'planned': '計劃中',
                                'read': '已讀',
                                'reading': '閱讀中',
                                'want_to_read': '想讀',
                                'played': '已玩',
                                'playing': '遊玩中',
                                'want_to_play': '想玩',
                                'listened': '已聽',
                                'listening': '在聽',
                                'want_to_listen': '想聽',
                                // TMDB Statuses
                                'Released': '已上映',
                                'Ended': '已完結',
                                'Returning Series': '連載中',
                                'Canceled': '已取消',
                                'In Production': '製作中',
                                'Post Production': '後製中',
                                'Rumored': '傳聞中'
                            };
                            return statusMap[item.status] || item.status;
                        })()}
                    </div>
                )}
                {rating && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-yellow-500 border border-white/10 flex items-center gap-1 shadow-lg">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold">{Number(rating).toFixed(1)}</span>
                    </div>
                )}
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate group-hover:text-teal-600 dark:group-hover:text-white transition-colors">
                {title}
            </h3>
            {type === 'podcast' && item.host && (
                <p className="text-xs text-zinc-500 truncate">{item.host}</p>
            )}
        </div>
    );
};

// Helpers
function getItemTitle(item: any, type: string) {
    if (!item) return '';

    // Handle string title first
    if (typeof item.title === 'string') return item.title;

    // Handle anime title object
    if (type === 'anime' && item.title && typeof item.title === 'object') {
        return item.title.native || item.title.romaji || item.title.english || item.name || '';
    }

    // Handle book volumeInfo
    if (type === 'book' && item.volumeInfo?.title) return item.volumeInfo.title;

    // Handle podcast collectionName
    if (type === 'podcast') return item.collectionName || item.title || '';

    // Default: try name, then title
    return item.name || item.title || 'Untitled';
}

function getItemImage(item: any, type: string) {
    if (!item) return '/placeholder.png';

    // Check unified cover_url field first (set by api.ts data flatten)
    if (item.cover_url) return item.cover_url;

    if (type === 'movie' || type === 'documentary' || type === 'tv') {
        if (item.poster_path) return item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w200${item.poster_path}`;
        return item.image || '/placeholder.png';
    }
    if (type === 'anime') return item.coverImage?.large || item.coverImage?.medium || '/placeholder.png';
    if (type === 'book') return item.volumeInfo?.imageLinks?.thumbnail || item.image_url || '/placeholder.png';
    if (type === 'game') {
        if (item.cover?.image_id) return getIGDBImageUrl(item.cover.image_id);
        return item.background_image || '/placeholder.png';
    }
    if (type === 'podcast') return item.artworkUrl600 || item.artworkUrl100 || item.artwork_url || '/placeholder.png';

    return item.image || '/placeholder.png';
}
