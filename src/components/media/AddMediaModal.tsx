import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Star, Calendar, Loader2, Trash2, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { getIGDBImageUrl } from '../../lib/igdb';
import { uploadMedia } from '../../lib/api';

const PLATFORMS = ['PC', 'PS5', 'PS4', 'Switch', 'Xbox Series', 'Xbox One', 'iOS', 'Android', 'macOS'];

type MediaType = 'movies' | 'tv-shows' | 'books' | 'games' | 'podcasts' | 'documentaries' | 'anime';

interface AddMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    type: MediaType;
    onSave: (data: any) => void;
    saving: boolean;
    onDelete?: (id: number) => void;
}

export const AddMediaModal: React.FC<AddMediaModalProps> = ({ isOpen, onClose, item, type, onSave, saving, onDelete }) => {
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

    // Cover upload
    const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (item) {
            // Pre-fill data if editing an existing item, otherwise reset to defaults
            setRating(item.my_rating !== undefined ? Number(item.my_rating) : 0);
            setStatus(item.status || 'completed');
            setReview(item.review || '');

            // Date
            if (item.date) setDate(item.date.split('T')[0]);
            else if (item.completed_date) setDate(item.completed_date.split('T')[0]);
            else setDate(new Date().toISOString().split('T')[0]);

            // Type specific
            setPlatform(item.platform || '');
            setSeason(item.current_season || 1);
            setEpisode(item.current_episode || 1);
            setEpisodesWatched(item.episodes_watched || item.episodes_listened || 0);
            setTotalEpisodes(item.total_episodes || 0);
            setCustomCoverUrl(null); // Reset custom cover when item changes
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadMedia(file);
            if (result.success && result.url) {
                setCustomCoverUrl(result.url);
            } else {
                alert('封面上傳失敗: ' + (result.error || '未知錯誤'));
            }
        } catch (err) {
            console.error('Cover upload failed:', err);
            alert('封面上傳失敗');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            item,
            type,
            rating,
            status,
            review,
            date,
            customCoverUrl, // Pass custom cover URL if uploaded
            ...(type === 'games' && { platform }),
            ...(type === 'tv-shows' && { season, episode }),
            ...(type === 'anime' && { episodes_watched: episodesWatched, total_episodes: totalEpisodes }),
            ...(type === 'podcasts' && { episodes_listened: episodesWatched, total_episodes: totalEpisodes }),
        };
        onSave(data);
        // Don't close here - let parent close after successful save
    };

    const isEditing = !!item.created_at;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-zinc-200 dark:border-white/10">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            {isEditing ? '編輯媒體' : '添加媒體'}
                            {isEditing && <span className="text-xs font-normal px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">已存在</span>}
                        </h2>
                        {isEditing && item.updated_at && (
                            <p className="text-xs text-zinc-500 mt-0.5">
                                上次更新: {new Date(item.updated_at).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Selected Item Preview with Upload */}
                    <div className="flex gap-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                        <div className="relative w-16 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden group">
                            <img
                                src={customCoverUrl || getItemImage(item, type)}
                                alt={getItemTitle(item, type)}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                            />
                            {/* Upload overlay - only show for books */}
                            {type === 'books' && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    title="上傳封面"
                                >
                                    {uploading ? (
                                        <Loader2 size={20} className="text-white animate-spin" />
                                    ) : (
                                        <Upload size={20} className="text-white" />
                                    )}
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCoverUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{getItemTitle(item, type)}</h4>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{getItemSubtitle(item, type)}</p>
                            {type === 'books' && (
                                <p className="text-xs text-indigo-500 mt-2">
                                    {customCoverUrl ? '✓ 已上傳自訂封面' : '滑鼠移至封面可上傳'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">評分 (0-10)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={rating}
                                onChange={(e) => setRating(parseFloat(e.target.value))}
                                className="w-24 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-center font-bold text-lg"
                            />
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={rating}
                                    onChange={(e) => setRating(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">狀態</label>
                        <div className="grid grid-cols-3 gap-2">
                            {getStatusOptions(type).map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={clsx(
                                        "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                                        status === opt.value
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white"
                                            : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800"
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
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">平台</label>
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
                                                    : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
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
                                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                            />
                        </div>
                    )}

                    {type === 'tv-shows' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">季 (Season)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={season}
                                    onChange={(e) => setSeason(parseInt(e.target.value))}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">集 (Episode)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={episode}
                                    onChange={(e) => setEpisode(parseInt(e.target.value))}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {(type === 'anime' || type === 'podcasts') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                                    {type === 'podcasts' ? '已聽集數' : '已看集數'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={episodesWatched}
                                    onChange={(e) => setEpisodesWatched(parseInt(e.target.value))}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">總集數</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={totalEpisodes}
                                    onChange={(e) => setTotalEpisodes(parseInt(e.target.value))}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Type specific inputs */}
                    {type === 'books' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">作者</label>
                                <input
                                    type="text"
                                    value={item.authors ? (typeof item.authors === 'string' ? item.authors.replace(/^"|"$/g, '') : item.authors) : ''}
                                    readOnly
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white opacity-60 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">頁數</label>
                                <input
                                    type="text"
                                    value={item.page_count || '-'}
                                    readOnly
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white opacity-60 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">日期</label>
                        <div className="relative flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-colors">
                            <Calendar className="text-zinc-400 dark:text-zinc-500 mr-2" size={18} />

                            {/* Year */}
                            <input
                                type="text"
                                placeholder="YYYY"
                                value={date.split('-')[0]}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    const parts = date.split('-');
                                    setDate(`${val}-${parts[1] || ''}-${parts[2] || ''}`);
                                    if (val.length === 4) {
                                        const next = e.target.nextElementSibling?.nextElementSibling as HTMLInputElement;
                                        next?.focus();
                                    }
                                }}
                                className="w-16 bg-transparent text-center text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                            />
                            <span className="text-zinc-400 dark:text-zinc-600">/</span>

                            {/* Month */}
                            <input
                                type="text"
                                placeholder="MM"
                                value={date.split('-')[1]}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                    const parts = date.split('-');
                                    setDate(`${parts[0] || ''}-${val}-${parts[2] || ''}`);
                                    if (val.length === 2) {
                                        const next = e.target.nextElementSibling?.nextElementSibling as HTMLInputElement;
                                        next?.focus();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && !e.currentTarget.value) {
                                        const prev = e.currentTarget.previousElementSibling?.previousElementSibling as HTMLInputElement;
                                        prev?.focus();
                                    }
                                }}
                                className="w-10 bg-transparent text-center text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                            />
                            <span className="text-zinc-400 dark:text-zinc-600">/</span>

                            {/* Day */}
                            <input
                                type="text"
                                placeholder="DD"
                                value={date.split('-')[2]}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                    const parts = date.split('-');
                                    setDate(`${parts[0] || ''}-${parts[1] || ''}-${val}`);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && !e.currentTarget.value) {
                                        const prev = e.currentTarget.previousElementSibling?.previousElementSibling as HTMLInputElement;
                                        prev?.focus();
                                    }
                                }}
                                className="w-10 bg-transparent text-center text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Review */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">簡評</label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows={3}
                            placeholder="寫下你的想法..."
                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        {!!item.created_at && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete(item.id);
                                    onClose();
                                }}
                                className="px-5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center"
                                title="刪除此項目"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className={clsx(
                                "flex-1 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2",
                                saving
                                    ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-400 cursor-not-allowed"
                                    : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                            )}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    保存中...
                                </>
                            ) : (
                                <>
                                    保存到媒體庫
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Helpers
function getItemTitle(item: any, type: MediaType) {
    // 優先使用後端返回的 title 字段（編輯已存在項目時）
    if (typeof item.title === 'string' && item.title) return item.title;

    // 搜索結果格式（新增時從第三方 API 獲取）
    if (type === 'movies') return item.title;
    if (type === 'tv-shows' || type === 'documentaries') return item.name || item.title;
    if (type === 'anime') return item.title?.native || item.title?.romaji || item.title?.english || item.name;
    if (type === 'books') return item.volumeInfo?.title || item.title;
    if (type === 'games') return item.name || item.title;
    if (type === 'podcasts') return item.collectionName || item.title;
    return item.title || item.name || 'Unknown Title';
}

function getItemSubtitle(item: any, type: MediaType) {
    if (type === 'movies') return item.release_date;
    if (type === 'tv-shows' || type === 'documentaries') return item.first_air_date || item.release_date;
    if (type === 'anime') return item.startDate?.year || item.release_date;
    if (type === 'books') {
        const authors = item.authors || item.volumeInfo?.authors;
        if (Array.isArray(authors)) return authors.join(', ');
        if (typeof authors === 'string') {
            // Handle "stringified" string or array
            try {
                if (authors.startsWith('[')) {
                    const parsed = JSON.parse(authors);
                    if (Array.isArray(parsed)) return parsed.join(', ');
                }
                // Remove surrounding quotes if it's like "\"Author\""
                return authors.replace(/^"|"$/g, '');
            } catch (e) {
                return authors;
            }
        }
        return '';
    }
    if (type === 'games') return item.released || item.release_date;
    if (type === 'podcasts') return item.artist_name || item.artistName || item.publisher || item.host;
    return '';
}

function getItemImage(item: any, type: MediaType) {
    if (!item) return '/placeholder.png';

    // 優先使用新字段（編輯已存在項目時）
    if (item.cover_image_cdn) return item.cover_image_cdn;
    if (item.cover_image_local) return item.cover_image_local;
    if (item.cover_url) return item.cover_url;

    // 搜索結果格式（新增時從第三方 API 獲取）
    if (type === 'movies' || type === 'documentaries' || type === 'tv-shows') {
        if (item.poster_path) return `https://image.tmdb.org/t/p/w200${item.poster_path}`;
        return '/placeholder.png';
    }
    if (type === 'anime') return item.coverImage?.large || item.coverImage?.medium || '/placeholder.png';
    if (type === 'books') return item.volumeInfo?.imageLinks?.thumbnail || '/placeholder.png';
    if (type === 'games') {
        if (item.cover?.image_id) return getIGDBImageUrl(item.cover.image_id);
        return item.background_image || '/placeholder.png';
    }
    if (type === 'podcasts') return item.artworkUrl600 || item.artworkUrl100 || item.artwork_url || '/placeholder.png';

    return '/placeholder.png';
}

function getStatusOptions(type: MediaType) {
    // Movies, TV Shows, Documentaries - use watched/watching/want_to_watch
    if (type === 'movies' || type === 'tv-shows' || type === 'documentaries') {
        return [
            { value: 'watched', label: '已看' },
            { value: 'watching', label: '在追' },
            { value: 'want_to_watch', label: '想看' },
        ];
    }

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
            { value: 'completed', label: '已聽' },    // Backend uses completed
            { value: 'listening', label: '在聽' },
            { value: 'plan_to_listen', label: '想聽' }, // Backend uses plan_to_listen
        ];
    }

    if (type === 'anime') {
        return [
            { value: 'watched', label: '已看' },
            { value: 'watching', label: '在追' },
            { value: 'want_to_watch', label: '想看' },
        ];
    }

    // Default fallback
    return [
        { value: 'watched', label: '已看' },
        { value: 'watching', label: '在追' },
        { value: 'want_to_watch', label: '想看' },
    ];
}

