import React, { useState } from 'react';
import { X, Save, Star, Calendar, Clock } from 'lucide-react';
import { clsx } from 'clsx';

type MediaType = 'movie' | 'tv' | 'book' | 'game';

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
            ...(type === 'game' && { platform }),
            ...(type === 'tv' && { season, episode }),
        };
        onSave(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-800/50">
                    <h3 className="text-lg font-semibold text-white">添加到媒體庫</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Selected Item Preview */}
                    <div className="flex gap-4 bg-zinc-800/30 p-4 rounded-xl border border-white/5">
                        <div className="w-16 h-24 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
                            {/* Image would go here, using a placeholder for now or passing image url from item */}
                            <div className="w-full h-full bg-zinc-700 animate-pulse"></div>
                        </div>
                        <div>
                            <h4 className="font-bold text-white line-clamp-1">{getItemTitle(item, type)}</h4>
                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{getItemSubtitle(item, type)}</p>
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">評分</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={clsx(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                                        rating >= star ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                                    )}
                                >
                                    {star}
                                </button>
                            ))}
                        </div>
                        <div className="text-right text-xs text-zinc-500 mt-1">{rating}/10</div>
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
                    {type === 'game' && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">平台</label>
                            <input
                                type="text"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                placeholder="PC, PS5, Switch..."
                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    )}

                    {type === 'tv' && (
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
    if (type === 'movie') return item.title;
    if (type === 'tv') return item.name;
    if (type === 'book') return item.volumeInfo?.title;
    if (type === 'game') return item.name;
    return 'Unknown Title';
}

function getItemSubtitle(item: any, type: MediaType) {
    if (type === 'movie') return item.release_date;
    if (type === 'tv') return item.first_air_date;
    if (type === 'book') return item.volumeInfo?.authors?.join(', ');
    if (type === 'game') return item.released;
    return '';
}

function getStatusOptions(type: MediaType) {
    const common = [
        { value: 'completed', label: '已完成' },
        { value: 'progress', label: '進行中' },
        { value: 'planned', label: '想看/玩' },
    ];

    if (type === 'book') {
        return [
            { value: 'read', label: '已讀' },
            { value: 'reading', label: '閱讀中' },
            { value: 'want_to_read', label: '想讀' },
        ];
    }

    if (type === 'game') {
        return [
            { value: 'played', label: '已玩' },
            { value: 'playing', label: '遊玩中' },
            { value: 'want_to_play', label: '想玩' },
        ];
    }

    return [
        { value: 'watched', label: '已看' },
        { value: 'watching', label: '在追' },
        { value: 'want_to_watch', label: '想看' },
    ];
}
