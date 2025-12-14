import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Film, Tv, Book, Gamepad2, Plus, Mic, Video, Clapperboard } from 'lucide-react';
import { searchTMDB, getTMDBImageUrl, searchDocumentaries, type TMDBResult } from '../../lib/tmdb';
import { searchGoogleBooks, getGoogleBookImageUrl, type GoogleBookResult } from '../../lib/googleBooks';
import { searchIGDB, getIGDBImageUrl, type IGDBGameResult } from '../../lib/igdb';
import { searchPodcasts, type ITunesPodcastResult } from '../../lib/itunes';
import { searchAnime, type AnilistResult } from '../../lib/anilist';
import { toast } from '../ui/Toast';
import { fetchIntegrationStatus } from '../../lib/api';
import { clsx } from 'clsx';

type SearchType = 'movie' | 'tv' | 'book' | 'game' | 'podcast' | 'documentary' | 'anime';

interface SearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: any, type: SearchType) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [type, setType] = useState<SearchType>('movie');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500);
        return () => clearTimeout(timer);
    }, [query]);

    // Perform search
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                let data = [];
                switch (type) {
                    case 'movie':
                        data = await searchTMDB(debouncedQuery, 'movie');
                        break;
                    case 'tv':
                        data = await searchTMDB(debouncedQuery, 'tv');
                        break;
                    case 'book':
                        data = await searchGoogleBooks(debouncedQuery);
                        break;
                    case 'game':
                        data = await searchIGDB(debouncedQuery);
                        break;
                    case 'podcast':
                        data = await searchPodcasts(debouncedQuery);
                        break;
                    case 'documentary':
                        data = await searchDocumentaries(debouncedQuery);
                        break;
                    case 'anime':
                        data = await searchAnime(debouncedQuery);
                        break;
                }
                setResults(data);
            } catch (error) {
                if (error instanceof Error && error.message === 'Unauthorized') {
                    try {
                        if (type === 'game') {
                            const status = await fetchIntegrationStatus();
                            if (status?.igdb?.configured === false) {
                                toast.warning('IGDB 未配置，請到 /admin/settings 設定後再試', 5000);
                                return;
                            }
                        }
                    } catch {
                        // ignore
                    }
                    toast.error('未授權（可能登入已失效），請重新登入後再試');
                    onClose();
                    return;
                }
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center gap-4">
                    <Search className="text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder={`搜索${getTypeName(type)}...`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-lg"
                        autoFocus
                    />
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs - Scrollable for mobile */}
                <div className="flex border-b border-white/5 bg-zinc-900/50 overflow-x-auto no-scrollbar">
                    <TabButton active={type === 'movie'} onClick={() => setType('movie')} icon={<Film size={16} />} label="電影" />
                    <TabButton active={type === 'tv'} onClick={() => setType('tv')} icon={<Tv size={16} />} label="劇集" />
                    <TabButton active={type === 'book'} onClick={() => setType('book')} icon={<Book size={16} />} label="書籍" />
                    <TabButton active={type === 'game'} onClick={() => setType('game')} icon={<Gamepad2 size={16} />} label="遊戲" />
                    <TabButton active={type === 'podcast'} onClick={() => setType('podcast')} icon={<Mic size={16} />} label="播客" />
                    <TabButton active={type === 'documentary'} onClick={() => setType('documentary')} icon={<Video size={16} />} label="節目" />
                    <TabButton active={type === 'anime'} onClick={() => setType('anime')} icon={<Clapperboard size={16} />} label="動畫" />
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                            <Loader2 className="animate-spin" /> 搜索中...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {results.map((item) => (
                                <ResultItem
                                    key={item.id || item.collectionId}
                                    item={item}
                                    type={type}
                                    onSelect={() => onSelect(item, type)}
                                />
                            ))}
                        </div>
                    ) : query ? (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                            沒有找到相關結果
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-600">
                            輸入關鍵字開始搜索
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-w-[80px]",
            active ? "text-white border-indigo-500 bg-white/5" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
        )}
    >
        {icon} {label}
    </button>
);

const ResultItem = ({ item, type, onSelect }: { item: any, type: SearchType, onSelect: () => void }) => {
    let title, image, subtitle, rating;

    switch (type) {
        case 'movie':
            const movie = item as TMDBResult;
            title = movie.title;
            image = getTMDBImageUrl(movie.poster_path, 'w200');
            subtitle = movie.release_date?.split('-')[0] || 'Unknown Year';
            rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
            break;
        case 'documentary':
        case 'tv':
            const tv = item as TMDBResult;
            title = tv.name;
            image = getTMDBImageUrl(tv.poster_path, 'w200');
            subtitle = tv.first_air_date?.split('-')[0] || 'Unknown Year';
            rating = tv.vote_average ? tv.vote_average.toFixed(1) : null;
            break;
        case 'book':
            const book = item as GoogleBookResult;
            title = book.volumeInfo.title;
            image = getGoogleBookImageUrl(book.volumeInfo.imageLinks?.thumbnail);
            subtitle = book.volumeInfo.authors?.join(', ') || 'Unknown Author';
            rating = book.volumeInfo.averageRating;
            break;
        case 'game':
            const game = item as IGDBGameResult;
            title = game.name;
            image = getIGDBImageUrl(game.cover?.image_id, 'cover_big');
            subtitle = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear().toString() : 'Unknown Year';
            rating = game.total_rating ? (game.total_rating / 10).toFixed(1) : null;
            break;
        case 'podcast':
            const podcast = item as ITunesPodcastResult;
            title = podcast.collectionName;
            image = podcast.artworkUrl600;
            subtitle = podcast.artistName;
            rating = null;
            break;
        case 'anime':
            const anime = item as AnilistResult;
            title = anime.title?.native || anime.title?.english || anime.title?.romaji || 'Unknown Title';
            image = anime.coverImage?.large || anime.coverImage?.medium || '';
            subtitle = `${anime.startDate?.year || 'Unknown'} · ${anime.episodes || '?'} 集`;
            rating = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
            break;
    }

    return (
        <div className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10" onClick={onSelect}>
            <img
                src={image || '/placeholder.png'}
                alt={title}
                className="w-16 h-24 object-cover rounded-lg bg-zinc-800 shrink-0"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-medium text-white truncate">{title}</h4>
                <p className="text-sm text-zinc-500 truncate">{subtitle}</p>
                {rating && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium text-amber-400">
                        ★ {rating}
                    </div>
                )}
            </div>
            <button className="self-center p-2 rounded-full bg-indigo-500/10 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white">
                <Plus size={20} />
            </button>
        </div>
    );
};

function getTypeName(type: SearchType) {
    switch (type) {
        case 'movie': return '電影';
        case 'tv': return '劇集';
        case 'book': return '書籍';
        case 'game': return '遊戲';
        case 'podcast': return '播客';
        case 'documentary': return '節目';
        case 'anime': return '動畫';
    }
}
