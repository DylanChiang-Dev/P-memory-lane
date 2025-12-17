import React, { useEffect, useState } from 'react';
import { fetchMediaItemById, type MediaType } from '../../lib/api';
import { ArrowLeft, Star, Calendar, Clock, User, BookOpen, Gamepad2, Film, Tv, Mic, Video, Sparkles } from 'lucide-react';

interface MediaDetailPageProps {
    mediaType: MediaType;
    // id 現在從 URL 獲取，而不是 prop
}

export const MediaDetailPage: React.FC<MediaDetailPageProps> = ({ mediaType }) => {
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [id, setId] = useState<number | null>(null);

    // 從 URL 獲取 ID：支持 /books/123 和 /book-detail?id=123 兩種格式
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let numericId: number | null = null;

            // 方式 1：從 query 參數獲取（?id=123）
            const urlParams = new URLSearchParams(window.location.search);
            const idParam = urlParams.get('id');
            if (idParam) {
                const parsed = parseInt(idParam, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    numericId = parsed;
                }
            }

            // 方式 2：從 URL 路徑獲取（/books/123）
            if (numericId === null) {
                const pathParts = window.location.pathname.split('/');
                const lastPart = pathParts[pathParts.length - 1];
                const parsed = parseInt(lastPart, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    numericId = parsed;
                }
            }

            if (numericId !== null) {
                setId(numericId);
            } else {
                setError('無效的 ID');
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (id === null) return;

        const loadItem = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchMediaItemById(mediaType, id);
                if (data) {
                    setItem(data);
                } else {
                    setError('找不到該項目');
                }
            } catch (err) {
                setError('載入失敗');
            } finally {
                setLoading(false);
            }
        };
        loadItem();
    }, [mediaType, id]);

    const getBackUrl = () => {
        const urlMap: Record<MediaType, string> = {
            'movies': '/movies',
            'tv-shows': '/tv',
            'books': '/books',
            'games': '/games',
            'podcasts': '/podcasts',
            'documentaries': '/documentaries',
            'anime': '/anime',
        };
        return urlMap[mediaType] || '/';
    };

    const getTypeIcon = () => {
        const iconMap: Record<MediaType, React.ReactNode> = {
            'movies': <Film className="w-5 h-5" />,
            'tv-shows': <Tv className="w-5 h-5" />,
            'books': <BookOpen className="w-5 h-5" />,
            'games': <Gamepad2 className="w-5 h-5" />,
            'podcasts': <Mic className="w-5 h-5" />,
            'documentaries': <Video className="w-5 h-5" />,
            'anime': <Sparkles className="w-5 h-5" />,
        };
        return iconMap[mediaType];
    };

    const getTypeLabel = () => {
        const labelMap: Record<MediaType, string> = {
            'movies': '電影',
            'tv-shows': '劇集',
            'books': '書籍',
            'games': '遊戲',
            'podcasts': '播客',
            'documentaries': '節目',
            'anime': '動畫',
        };
        return labelMap[mediaType] || mediaType;
    };

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            'watched': '已看', 'watching': '在追', 'want_to_watch': '想看',
            'completed': '已完成', 'progress': '進行中', 'planned': '計劃中',
            'read': '已讀', 'reading': '閱讀中', 'want_to_read': '想讀',
            'played': '已玩', 'playing': '遊玩中', 'want_to_play': '想玩',
            'listened': '已聽', 'listening': '在聽', 'want_to_listen': '想聽',
        };
        return statusMap[status] || status;
    };

    const getCoverImage = () => {
        if (!item) return '/placeholder.png';
        return item.cover_image_cdn || item.cover_image_local || item.cover_url || '/placeholder.png';
    };

    const getTitle = () => {
        if (!item) return '';
        return item.title || item.name || 'Unknown';
    };

    const getOriginalTitle = () => {
        if (!item) return null;
        const orig = item.original_title || item.original_name;
        if (orig && orig !== getTitle()) return orig;
        return null;
    };

    const getAuthors = () => {
        if (!item) return null;
        const authors = item.authors || item.author;
        if (!authors) return null;
        if (Array.isArray(authors)) return authors.join(', ');
        if (typeof authors === 'string') {
            try {
                if (authors.startsWith('[')) {
                    const parsed = JSON.parse(authors);
                    if (Array.isArray(parsed)) return parsed.join(', ');
                }
                return authors;
            } catch {
                return authors;
            }
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-zinc-500 text-lg">{error || '找不到該項目'}</p>
                <a href={getBackUrl()} className="text-emerald-500 hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    返回列表
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Back Button */}
            <a
                href={getBackUrl()}
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                返回{getTypeLabel()}列表
            </a>

            {/* Main Content */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg overflow-hidden">
                {/* Hero Section */}
                <div className="relative">
                    {/* Backdrop */}
                    {item.backdrop_image_cdn && (
                        <div className="absolute inset-0 h-64 overflow-hidden">
                            <img
                                src={item.backdrop_image_cdn}
                                alt=""
                                className="w-full h-full object-cover opacity-20 blur-sm"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-zinc-900"></div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6">
                        {/* Cover Image */}
                        <div className="flex-shrink-0">
                            <img
                                src={getCoverImage()}
                                alt={getTitle()}
                                className="w-48 h-72 object-cover rounded-xl shadow-lg mx-auto md:mx-0"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-4">
                            {/* Type Badge */}
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                {getTypeIcon()}
                                <span className="text-sm font-medium">{getTypeLabel()}</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
                                {getTitle()}
                            </h1>

                            {/* Original Title */}
                            {getOriginalTitle() && (
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                    {getOriginalTitle()}
                                </p>
                            )}

                            {/* Meta Info */}
                            <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                                {/* Authors (for books) */}
                                {getAuthors() && (
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        <span>{getAuthors()}</span>
                                    </div>
                                )}

                                {/* Release Date */}
                                {(item.release_date || item.published_date || item.first_air_date) && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        <span>{(item.release_date || item.published_date || item.first_air_date)?.split('-')[0]}</span>
                                    </div>
                                )}

                                {/* Runtime (for movies) */}
                                {item.runtime && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        <span>{item.runtime} 分鐘</span>
                                    </div>
                                )}

                                {/* Page Count (for books) */}
                                {item.page_count && (
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{item.page_count} 頁</span>
                                    </div>
                                )}

                                {/* Publisher (for books) */}
                                {item.publisher && (
                                    <span className="text-zinc-500">{item.publisher}</span>
                                )}
                            </div>

                            {/* Ratings */}
                            <div className="flex flex-wrap gap-4">
                                {/* My Rating */}
                                {item.my_rating && (
                                    <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-full">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold">{Number(item.my_rating).toFixed(1)}</span>
                                        <span className="text-xs opacity-75">我的評分</span>
                                    </div>
                                )}

                                {/* External Rating */}
                                {item.external_rating && (
                                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1.5 rounded-full">
                                        <Star className="w-4 h-4" />
                                        <span className="font-medium">{Number(item.external_rating).toFixed(1)}</span>
                                        <span className="text-xs opacity-75">外部評分</span>
                                    </div>
                                )}
                            </div>

                            {/* Status & Date */}
                            <div className="flex flex-wrap gap-2">
                                {item.status && (
                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                                        {getStatusLabel(item.status)}
                                    </span>
                                )}
                                {item.completed_date && (
                                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-sm">
                                        {item.completed_date.split('T')[0]}
                                    </span>
                                )}
                            </div>

                            {/* Genres */}
                            {item.genres && (
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        try {
                                            const genres = Array.isArray(item.genres) ? item.genres : JSON.parse(item.genres || '[]');
                                            return genres.map((genre: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs"
                                                >
                                                    {genre}
                                                </span>
                                            ));
                                        } catch {
                                            return null;
                                        }
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Overview */}
                {item.overview && (
                    <div className="px-6 md:px-8 pb-6 md:pb-8">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">簡介</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                            {item.overview}
                        </p>
                    </div>
                )}

                {/* My Review */}
                {item.my_review && (
                    <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">我的評論</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                            {item.my_review}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
