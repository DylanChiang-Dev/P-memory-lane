import React, { useState, useEffect } from 'react';
import { X, Save, Star, Calendar, Clock, Mic, Video, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { getIGDBImageUrl } from '../../lib/igdb';

const PLATFORMS = ['PC', 'PS5', 'PS4', 'Switch', 'Xbox Series', 'Xbox One', 'iOS', 'Android', 'macOS'];

type MediaType = 'movies' | 'tv-shows' | 'books' | 'games' | 'podcasts' | 'documentaries' | 'anime';

interface AddMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    type: MediaType;
    onSave: (data: any) => void;
}

export const AddMediaModal: React.FC<AddMediaModalProps> = ({ isOpen, onClose, item, type, onSave }) => {
    const [rating, setRating] = useState(0);
    const [status, setStatus] = useState('completed');
    const [review, setReview] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Type specific fields
    const [platform, setPlatform] = useState('');
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [episodesWatched, setEpisodesWatched] = useState(0);
    const [totalEpisodes, setTotalEpisodes] = useState(0);

    useEffect(() => {
        if (item) {
            // Pre-fill data if editing an existing item
            if (item.my_rating !== undefined) setRating(Number(item.my_rating));
            if (item.status) setStatus(item.status);
            if (item.review) setReview(item.review);

            // Type specific
            if (item.platform) setPlatform(item.platform);
            if (item.current_season) setSeason(item.current_season);
            if (item.current_episode) setEpisode(item.current_episode);
            if (item.episodes_watched !== undefined) setEpisodesWatched(item.episodes_watched);
            if (item.episodes_listened !== undefined) setEpisodesWatched(item.episodes_listened);
            if (item.total_episodes !== undefined) setTotalEpisodes(item.total_episodes);
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            item,
            type,
            rating,
            status,
            review,
            date,
            ...(type === 'games' && { platform }),
            ...(type === 'tv-shows' && { season, episode }),
            ...(type === 'anime' && { episodes_watched: episodesWatched, total_episodes: totalEpisodes }),
            ...(type === 'podcasts' && { episodes_listened: episodesWatched, total_episodes: totalEpisodes }),
        };
        onSave(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-800/50">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {type === 'podcasts' && <Mic size={20} className="text-pink-500" />}
                        {type === 'documentaries' && <Video size={20} className="text-amber-500" />}
                        {type === 'anime' && <Sparkles size={20} className="text-rose-500" />}
                        {item?.id && item?.my_rating ? '編輯媒體' : '添加到媒體庫'}
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Selected Item Preview */}
                    <div className="flex gap-4 bg-zinc-800/30 p-4 rounded-xl border border-white/5">
                        <div className="w-16 h-24 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                            <img
                                src={getItemImage(item, type)}
                                alt={getItemTitle(item, type)}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                            />
                        </div>
                        <div>
                            <h4 className="font-bold text-white line-clamp-1">{getItemTitle(item, type)}</h4>
                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{getItemSubtitle(item, type)}</p>
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">評分 (0-10)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={rating}
                                onChange={(e) => setRating(parseFloat(e.target.value))}
                                className="w-24 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-center font-bold text-lg"
                            />
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={rating}
                                    onChange={(e) => setRating(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xl w-16 justify-end">
                                <Star fill="currentColor" size={20} />
                                {Number(rating).toFixed(1)}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">狀態</label>
                        <div className="grid grid-cols-3 gap-2">
                            {getStatusOptions(type).map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={clsx(
                                        "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                                        status === opt.value
                                            ? "bg-white text-black border-white"
                                            : "bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-zinc-800"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    {type === 'games' && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">平台</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PLATFORMS.map(p => {
                                    const isSelected = platform.split(', ').includes(p);
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                const current = platform ? platform.split(', ') : [];
                                                if (isSelected) {
                                                    setPlatform(current.filter(i => i !== p).join(', '));
                                                } else {
                                                    setPlatform([...current, p].join(', '));
                                                }
                                            }}
                                            className={clsx(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                                                isSelected
                                                    ? "bg-indigo-500 border-indigo-500 text-white"
                                                    : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                            <input
                                type="text"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                placeholder="其他平台..."
                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                            />
                        </div>
                    )}

                    {type === 'tv-shows' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">季 (Season)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={season}
                                    onChange={(e) => setSeason(parseInt(e.target.value))}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">集 (Episode)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={episode}
                                    onChange={(e) => setEpisode(parseInt(e.target.value))}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {(type === 'anime' || type === 'podcasts') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                                    {type === 'podcasts' ? '已聽集數' : '已看集數'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={episodesWatched}
                                    onChange={(e) => setEpisodesWatched(parseInt(e.target.value))}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">總集數</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={totalEpisodes}
                                    onChange={(e) => setTotalEpisodes(parseInt(e.target.value))}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">日期</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Review */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">簡評</label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows={3}
                            placeholder="寫下你的想法..."
                            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        保存到媒體庫
                    </button>
                </form>
            </div>
        </div>
    );
};

// Helpers
function getItemTitle(item: any, type: MediaType) {
    if (type === 'movies') return item.title;
    if (type === 'tv-shows' || type === 'documentaries') return item.name;
    if (type === 'anime') return item.title?.native || item.title?.romaji || item.title?.english || item.name;
    if (type === 'books') return item.volumeInfo?.title;
    if (type === 'games') return item.name;
    if (type === 'podcasts') return item.collectionName || item.title;
    return 'Unknown Title';
}

function getItemSubtitle(item: any, type: MediaType) {
    if (type === 'movies') return item.release_date;
    if (type === 'tv-shows' || type === 'documentaries') return item.first_air_date;
    if (type === 'anime') return item.startDate?.year || item.first_air_date;
    if (type === 'books') return item.volumeInfo?.authors?.join(', ');
    if (type === 'games') return item.released;
    if (type === 'podcasts') return item.artistName || item.publisher || item.host;
    return '';
}

function getItemImage(item: any, type: MediaType) {
    if (!item) return '/placeholder.png';

    if (type === 'movies' || type === 'documentaries' || type === 'tv-shows') {
        if (item.poster_path) return `https://image.tmdb.org/t/p/w200${item.poster_path}`;
        return '/placeholder.png';
    }
    if (type === 'anime') return item.coverImage?.large || item.coverImage?.medium || '/placeholder.png';
    if (type === 'books') return item.volumeInfo?.imageLinks?.thumbnail || '/placeholder.png';
    if (type === 'games') {
        if (item.cover?.image_id) return getIGDBImageUrl(item.cover.image_id);
        return item.background_image || item.cover_url || '/placeholder.png';
    }
    if (type === 'podcasts') return item.artworkUrl600 || item.artworkUrl100 || item.artwork_url || '/placeholder.png';

    return '/placeholder.png';
}

function getStatusOptions(type: MediaType) {
    const common = [
        { value: 'completed', label: '已完成' },
        { value: 'progress', label: '進行中' },
        { value: 'planned', label: '想看/玩' },
    ];

    if (type === 'books') {
        return [
            { value: 'read', label: '已讀' },
            { value: 'reading', label: '閱讀中' },
            { value: 'want_to_read', label: '想讀' },
        ];
    }

    if (type === 'games') {
        return [
            { value: 'played', label: '已玩' },
            { value: 'playing', label: '遊玩中' },
            { value: 'want_to_play', label: '想玩' },
        ];
    }

    if (type === 'podcasts') {
        return [
            { value: 'listened', label: '已聽' },
            { value: 'listening', label: '在聽' },
            { value: 'want_to_listen', label: '想聽' },
        ];
    }

    if (type === 'anime') {
        return [
            { value: 'watched', label: '已看' },
            { value: 'watching', label: '在追' },
            { value: 'want_to_watch', label: '想看' },
        ];
    }

    return [
        { value: 'watched', label: '已看' },
        { value: 'watching', label: '在追' },
        { value: 'want_to_watch', label: '想看' },
    ];
}
