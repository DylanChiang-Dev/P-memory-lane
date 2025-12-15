import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, MoreVertical, Search, Loader2, Film, Tv, Book, Gamepad2, Mic, Video, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchMediaItems, deleteMediaItem, addMediaItem, updateMediaItem, type MediaType } from '../../lib/api';
import { getTMDBImageUrl } from '../../lib/tmdb';
import { getPodcastDetails } from '../../lib/itunes';
import { getAnimeDetails } from '../../lib/anilist';
import { getIGDBImageUrl } from '../../lib/igdb';
import { SearchDialog } from '../media/SearchDialog';
import { AddMediaModal } from '../media/AddMediaModal';
import { DeleteConfirmModal } from '../media/DeleteConfirmModal';
import { toast } from '../ui/Toast';

const TABS = [
    { id: 'books', label: '書籍', icon: Book },
    { id: 'podcasts', label: '播客', icon: Mic },
    { id: 'games', label: '遊戲', icon: Gamepad2 },
    { id: 'movies', label: '電影', icon: Film },
    { id: 'tv-shows', label: '劇集', icon: Tv },
    { id: 'anime', label: '動畫', icon: Sparkles },
    { id: 'documentaries', label: '節目', icon: Video },
];

// TMDB Genre ID to Name mapping
const TMDB_GENRES: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    // TV genres
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

// Helper to convert genre_ids to names
const convertGenreIds = (genreIds: number[] | undefined): string[] | undefined => {
    if (!genreIds) return undefined;
    return genreIds.map(id => TMDB_GENRES[id] || `Unknown(${id})`);
};


export const MediaTable: React.FC = () => {
    const ADMIN_PAGE_LIMIT = 1000;
    const [activeTab, setActiveTab] = useState<MediaType>('books');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [modalMediaType, setModalMediaType] = useState<MediaType>('books');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, total_pages: 0, limit: 20 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const loadItems = async () => {
        setLoading(true);
        try {
            // Admin list should default to "completed date" ordering, not recently-updated ordering.
            const sort = 'completed_date_desc';
            const result = await fetchMediaItems(activeTab, undefined, page, ADMIN_PAGE_LIMIT, sort, debouncedSearchQuery);

            if (Array.isArray(result)) {
                // Fallback for old API response format if any
                setItems(result);
                setPagination({ total: result.length, total_pages: 1, limit: ADMIN_PAGE_LIMIT });
            } else {
                const apiItems = result.items || [];
                const apiPagination = result.pagination || { total: 0, limit: ADMIN_PAGE_LIMIT };
                const backendLimit = apiPagination.limit || ADMIN_PAGE_LIMIT;
                const total = apiPagination.total || 0;

                // If backend clamps limit (e.g. public max=100), auto-stitch pages so admin UI can still show 1000 items per page.
                if (backendLimit < ADMIN_PAGE_LIMIT && total > backendLimit) {
                    const factor = Math.ceil(ADMIN_PAGE_LIMIT / backendLimit);
                    const startBackendPage = (page - 1) * factor + 1;

                    const stitched: any[] = [];
                    for (let i = 0; i < factor; i++) {
                        const backendPage = startBackendPage + i;
                        const pageResult = await fetchMediaItems(activeTab, undefined, backendPage, backendLimit, sort, debouncedSearchQuery);
                        if (Array.isArray(pageResult)) {
                            stitched.push(...pageResult);
                        } else {
                            stitched.push(...(pageResult.items || []));
                        }
                        if (stitched.length >= ADMIN_PAGE_LIMIT) break;
                    }

                    setItems(stitched.slice(0, ADMIN_PAGE_LIMIT));
                    setPagination({
                        total,
                        total_pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_LIMIT)),
                        limit: ADMIN_PAGE_LIMIT
                    });
                } else {
                    setItems(apiItems);
                    // Calculate total_pages if not provided by API
                    const totalPages = apiPagination.total_pages || Math.ceil(total / backendLimit);
                    setPagination({
                        total,
                        total_pages: totalPages,
                        limit: backendLimit
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (debouncedSearchQuery !== searchQuery) return;
        loadItems();
    }, [activeTab, page, debouncedSearchQuery, searchQuery]);

    const handleDelete = (id: number) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const result = await deleteMediaItem(activeTab, itemToDelete);
            if (result && result.success) {
                setItems(items.filter(item => item.id !== itemToDelete));
                toast.success('刪除成功');
            } else {
                toast.error('刪除失敗: ' + (result?.error || '未知錯誤'));
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('刪除失敗，請檢查網絡連接');
        }
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setModalMediaType(activeTab); // Use current tab type when editing
        setIsAddModalOpen(true);
    };

    const handleSearchSelect = (item: any, searchType: string) => {
        // Map search type to MediaType
        const typeMap: Record<string, MediaType> = {
            'movie': 'movies',
            'tv': 'tv-shows',
            'book': 'books',
            'game': 'games',
            'podcast': 'podcasts',
            'documentary': 'documentaries',
            'anime': 'anime'
        };
        setSelectedItem(item);
        setModalMediaType(typeMap[searchType] || activeTab);
        setIsSearchOpen(false);
        setIsAddModalOpen(true);
    };

    const handleSaveMedia = async (data: any) => {
        const currentType = modalMediaType || activeTab;
        setSaving(true);
        try {
            let result;
            if (data.item.my_rating !== undefined) {
                // Editing existing item - Flatten data for PUT request
                const normalizedTitleZh = typeof data.title_zh === 'string' ? data.title_zh.trim() : '';
                const updateData: any = {
                    my_rating: data.rating,
                    status: data.status,
                    review: data.review,
                    my_review: data.review, // Alias for backend compatibility
                    completed_date: data.date,
                    ...(currentType === 'games' ? { title_zh: normalizedTitleZh } : {}),
                    // Type specific fields
                    platform: data.platform,
                    current_season: data.season,
                    current_episode: data.episode,
                    episodes_watched: data.episodes_watched,
                    episodes_listened: data.episodes_listened,
                    total_episodes: data.total_episodes
                };
                // Add custom cover URL if provided
                if (data.customCoverUrl) {
                    updateData.cover_image_cdn = data.customCoverUrl;
                }
                result = await updateMediaItem(currentType, data.item.id, updateData);
            } else {
                // Adding new item - Use search result payload (details are served by backend)
                const itemDetails = data.item;
                const isManual = !!itemDetails?.__manual;

                // Adding new item - Flatten data for POST request with complete metadata
                const createData = {
                    // Common user fields
                    my_rating: data.rating,
                    status: data.status,
                    review: data.review,
                    my_review: data.review, // Alias for backend compatibility
                    completed_date: data.date,

                    // Type specific ID and metadata mapping
                    ...(currentType === 'movies' && {
                        ...(isManual
                            ? {
                                tmdb_id: null,
                                title: data.title,
                                original_title: null,
                                cover_image_cdn: data.customCoverUrl || null,
                                backdrop_image_cdn: null,
                                overview: data.overview || null,
                                genres: undefined,
                                external_rating: null,
                                release_date: null,
                                runtime: null
                            }
                            : {
                                tmdb_id: itemDetails.id,
                                title: itemDetails.title,
                                original_title: itemDetails.original_title,
                                cover_image_cdn: data.customCoverUrl || (itemDetails.poster_path ? `https://image.tmdb.org/t/p/w500${itemDetails.poster_path}` : null),
                                backdrop_image_cdn: itemDetails.backdrop_path ? `https://image.tmdb.org/t/p/original${itemDetails.backdrop_path}` : null,
                                overview: itemDetails.overview,
                                genres: itemDetails.genres?.map((g: any) => g.name || g) || convertGenreIds(itemDetails.genre_ids),
                                external_rating: itemDetails.vote_average,
                                release_date: itemDetails.release_date,
                                runtime: itemDetails.runtime
                            })
                    }),
                    ...(currentType === 'tv-shows' && {
                        ...(isManual
                            ? {
                                tmdb_id: null,
                                title: data.title,
                                original_title: null,
                                cover_image_cdn: data.customCoverUrl || null,
                                backdrop_image_cdn: null,
                                overview: data.overview || null,
                                genres: undefined,
                                external_rating: null,
                                release_date: null,
                                number_of_seasons: null,
                                number_of_episodes: null
                            }
                            : {
                                tmdb_id: itemDetails.id,
                                title: itemDetails.name,
                                original_title: itemDetails.original_name,
                                cover_image_cdn: data.customCoverUrl || (itemDetails.poster_path ? `https://image.tmdb.org/t/p/w500${itemDetails.poster_path}` : null),
                                backdrop_image_cdn: itemDetails.backdrop_path ? `https://image.tmdb.org/t/p/original${itemDetails.backdrop_path}` : null,
                                overview: itemDetails.overview,
                                genres: itemDetails.genres?.map((g: any) => g.name || g) || convertGenreIds(itemDetails.genre_ids),
                                external_rating: itemDetails.vote_average,
                                release_date: itemDetails.first_air_date,
                                number_of_seasons: itemDetails.number_of_seasons,
                                number_of_episodes: itemDetails.number_of_episodes
                            })
                    }),
                    ...(currentType === 'documentaries' && {
                        ...(isManual
                            ? {
                                tmdb_id: null,
                                title: data.title,
                                original_title: null,
                                cover_image_cdn: data.customCoverUrl || null,
                                backdrop_image_cdn: null,
                                overview: data.overview || null,
                                genres: undefined,
                                external_rating: null,
                                release_date: null,
                                number_of_seasons: null,
                                number_of_episodes: null
                            }
                            : {
                                tmdb_id: itemDetails.id,
                                title: itemDetails.name || itemDetails.title,
                                original_title: itemDetails.original_name || itemDetails.original_title,
                                cover_image_cdn: data.customCoverUrl || (itemDetails.poster_path ? `https://image.tmdb.org/t/p/w500${itemDetails.poster_path}` : null),
                                backdrop_image_cdn: itemDetails.backdrop_path ? `https://image.tmdb.org/t/p/original${itemDetails.backdrop_path}` : null,
                                overview: itemDetails.overview,
                                genres: itemDetails.genres?.map((g: any) => g.name || g) || convertGenreIds(itemDetails.genre_ids),
                                external_rating: itemDetails.vote_average,
                                release_date: itemDetails.first_air_date || itemDetails.release_date,
                                number_of_seasons: itemDetails.number_of_seasons,
                                number_of_episodes: itemDetails.number_of_episodes
                            })
                    }),
                    ...(currentType === 'anime' && {
                        ...(isManual
                            ? {
                                anilist_id: null,
                                title: data.title,
                                original_title: null,
                                cover_image_cdn: data.customCoverUrl || null,
                                backdrop_image_cdn: null,
                                overview: data.overview || null,
                                genres: undefined,
                                external_rating: null,
                                release_date: null,
                                episodes: null,
                                format: null,
                                studio: null
                            }
                            : {
                                anilist_id: data.item.id,
                                title: data.item.title?.native || data.item.title?.romaji || data.item.title?.english,
                                original_title: data.item.title?.romaji,
                                cover_image_cdn: data.customCoverUrl || data.item.coverImage?.large || data.item.coverImage?.medium,
                                backdrop_image_cdn: data.item.bannerImage,
                                overview: data.item.description,
                                genres: data.item.genres,
                                external_rating: data.item.averageScore ? data.item.averageScore / 10 : null,
                                release_date: data.item.startDate?.year ? `${data.item.startDate.year}-${String(data.item.startDate.month || 1).padStart(2, '0')}-${String(data.item.startDate.day || 1).padStart(2, '0')}` : null,
                                episodes: data.item.episodes,
                                format: data.item.format,
                                studio: data.item.studios?.nodes?.[0]?.name
                            })
                    }),
                    ...(currentType === 'books' && {
                        ...(isManual
                            ? {
                                google_books_id: null,
                                title: data.title,
                                original_title: null,
                                cover_image_cdn: data.customCoverUrl || null,
                                overview: data.overview || null,
                                genres: undefined,
                                external_rating: null,
                                release_date: null,
                                authors: null,
                                publisher: null,
                                page_count: null,
                                isbn_10: null,
                                isbn_13: null
                            }
                            : {
                                google_books_id: data.item.id,
                                title: data.item.volumeInfo?.title,
                                original_title: data.item.volumeInfo?.title,
                                cover_image_cdn: data.customCoverUrl || data.item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:'),
                                overview: data.item.volumeInfo?.description,
                                genres: data.item.volumeInfo?.categories,
                                external_rating: data.item.volumeInfo?.averageRating,
                                release_date: data.item.volumeInfo?.publishedDate,
                                authors: data.item.volumeInfo?.authors,
                                publisher: data.item.volumeInfo?.publisher,
                                page_count: data.item.volumeInfo?.pageCount,
                                isbn_10: data.item.volumeInfo?.industryIdentifiers?.find((i: any) => i.type === 'ISBN_10')?.identifier,
                                isbn_13: data.item.volumeInfo?.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier
                            })
                    }),
                    ...(currentType === 'games' && {
                        ...(data.item?.__manual
                            ? {
                                source: 'manual',
                                source_id: null,
                            }
                            : {
                                source: 'igdb',
                                source_id: typeof data.item?.id === 'number' ? data.item.id : null,
                                igdb_id: typeof data.item?.id === 'number' ? data.item.id : null,
                            }),
                        title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : data.item.name,
                        // Some backends accept "name" instead of "title" for manual items.
                        name: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : data.item.name,
                        title_zh: typeof data.title_zh === 'string' ? data.title_zh.trim() : '',
                        cover_image_cdn: data.customCoverUrl || (data.item.cover?.image_id ? getIGDBImageUrl(data.item.cover.image_id) : null),
                        backdrop_image_cdn: data.item.screenshots?.[0]?.image_id ? getIGDBImageUrl(data.item.screenshots[0].image_id, 'screenshot_med') : null,
                        overview: typeof data.overview === 'string' && data.overview.trim() ? data.overview.trim() : data.item.summary,
                        genres: data.item.genres?.map((g: any) => g.name),
                        external_rating: data.item.rating ? data.item.rating / 10 : null,
                        release_date: data.item.first_release_date ? new Date(data.item.first_release_date * 1000).toISOString().split('T')[0] : null,
                        platforms: data.item.platforms?.map((p: any) => p.name),
                        developers: data.item.involved_companies?.filter((c: any) => c.developer)?.map((c: any) => c.company?.name),
                        publishers: data.item.involved_companies?.filter((c: any) => c.publisher)?.map((c: any) => c.company?.name)
                    }),
                    ...(currentType === 'podcasts' && {
                        ...(isManual
                            ? {
                                podcast_id: null,
                                title: data.title,
                                cover_image_cdn: data.customCoverUrl || null,
                                overview: data.overview || null,
                                genres: undefined,
                                release_date: null,
                                host: null,
                                rss_feed: null,
                                total_episodes: null
                            }
                            : {
                                podcast_id: String(data.item.collectionId), // Backend expects podcast_id
                                title: data.item.collectionName,
                                cover_image_cdn: data.customCoverUrl || data.item.artworkUrl600 || data.item.artworkUrl100,
                                overview: data.item.description,
                                genres: data.item.genres,
                                release_date: data.item.releaseDate,
                                host: data.item.artistName, // Backend expects host, not artist_name
                                rss_feed: data.item.feedUrl, // Backend expects rss_feed, not feed_url
                                total_episodes: data.item.trackCount
                            })
                    }),

                    // Type specific user fields
                    platform: data.platform,
                    current_season: data.season,
                    current_episode: data.episode,
                    episodes_watched: data.episodes_watched,
                    episodes_listened: data.episodes_listened,
                    total_episodes: data.total_episodes
                };
                result = await addMediaItem(currentType, createData);
            }

            if (result && result.success) {
                setIsAddModalOpen(false);
                toast.success('保存成功！');
                loadItems();
            } else {
                const errorMsg = result?.error || '未知錯誤';
                if (errorMsg.includes('already in library')) {
                    toast.warning('該項目已在您的媒體庫中，正在為您查找...');

                    // Attempt to find the existing item
                    try {
                        const titleToSearch = data.item.title || data.item.name || data.item.collectionName;
                        if (titleToSearch) {
                            const searchResult = await fetchMediaItems(currentType, undefined, 1, 1, undefined, titleToSearch);
                            const foundItems = Array.isArray(searchResult) ? searchResult : (searchResult.items || []);

                            if (foundItems.length > 0) {
                                // Find exact match if possible, otherwise take the first one
                                const exactMatch = foundItems.find((i: any) =>
                                    (i.title === titleToSearch) ||
                                    (i.name === titleToSearch) ||
                                    (i.tmdb_id === data.item.id) // Also check ID in search results if returned
                                );
                                const targetItem = exactMatch || foundItems[0];

                                setSelectedItem(targetItem);
                                setModalMediaType(currentType);
                                setIsAddModalOpen(true);
                                toast.info(`已為您打開現有項目: ${targetItem.title || targetItem.name}`);
                            } else {
                                // Title search failed, try Deep Scan by ID
                                toast.info('標題搜索失敗，正在全庫深度掃描 ID (這可能需要一點時間)...', 5000);

                                const targetId = data.item.id;
                                let page = 1;
                                let found = null;
                                let hasMorePages = true;

                                while (!found && hasMorePages) {
                                    // Use default limit (20) to avoid backend constraints
                                    const res = await fetchMediaItems(currentType, undefined, page, 20);
                                    const items = Array.isArray(res) ? res : res.items;

                                    if (items.length === 0) {
                                        hasMorePages = false;
                                        break;
                                    }

                                    found = items.find((i: any) => {
                                        if (currentType === 'movies' || currentType === 'tv-shows' || currentType === 'documentaries') return i.tmdb_id == targetId;
                                        if (currentType === 'anime') return i.anilist_id == targetId;
                                        if (currentType === 'podcasts') return i.itunes_id == targetId;
                                        if (currentType === 'games') return i.igdb_id == targetId;
                                        if (currentType === 'books') return i.google_books_id == targetId;
                                        return false;
                                    });

                                    if (found) break;
                                    page++;
                                }

                                if (found) {
                                    setSelectedItem(found);
                                    setModalMediaType(currentType);
                                    setIsAddModalOpen(true);
                                    toast.success(`已定位到項目: ${found.title || found.name}`);
                                } else {
                                    toast.error(`無法定位項目 (ID: ${targetId})。請確認它是否在其他分類中 (如動畫)。`);
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error finding duplicate:', err);
                        toast.error('無法定位現有項目');
                    }
                } else {
                    toast.error('保存失敗: ' + errorMsg);
                }
            }
        } catch (error) {
            console.error('Failed to save media:', error);
            toast.error('保存失敗，請檢查網絡連接');
        } finally {
            setSaving(false);
        }
    };

    const getPreviewUrl = (type: MediaType, id: number) => {
        const map: Record<string, string> = {
            'movies': 'movies',
            'tv-shows': 'tv',
            'books': 'books',
            'games': 'games',
            'podcasts': 'podcasts',
            'documentaries': 'documentaries',
            'anime': 'anime'
        };
        return `/${map[type] || type}/${id}`;
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset pagination when search changes (avoid fetching until debounce settles)
    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/5 overflow-hidden">
            {/* Tabs & Actions */}
            <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    {(['books', 'podcasts', 'games', 'movies', 'tv-shows', 'anime', 'documentaries'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                if (type === activeTab) return;
                                setActiveTab(type);
                                setPage(1);
                            }}
                            className={clsx(
                                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                activeTab === type
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                            )}
                        >
                            {type === 'tv-shows' ? '劇集' :
                                type === 'movies' ? '電影' :
                                    type === 'books' ? '書籍' :
                                        type === 'games' ? '遊戲' :
                                            type === 'podcasts' ? '播客' :
                                                type === 'documentaries' ? '節目' : '動畫'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="搜索媒體庫..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                    >
                        <Plus size={16} />
                        <span>添加新項目</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 dark:bg-white/5 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">封面</th>
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">標題</th>
                            {activeTab === 'podcasts' && (
                                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">主播</th>
                            )}
                            {(activeTab === 'anime' || activeTab === 'tv-shows' || activeTab === 'podcasts') && (
                                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">進度</th>
                            )}
                            {activeTab === 'games' && (
                                <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">平台</th>
                            )}
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">評分</th>
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">狀態</th>
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-zinc-500">加載中...</td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-zinc-500">暫無數據</td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="p-4 w-20">
                                        <img
                                            src={getItemImage(item, activeTab)}
                                            alt={getItemTitle(item, activeTab)}
                                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder.png';
                                            }}
                                        />
                                    </td>
                                    <td className="p-4 font-medium text-zinc-900 dark:text-white">
                                        {getItemTitle(item, activeTab)}
                                    </td>
                                    {activeTab === 'podcasts' && (
                                        <td className="p-4 text-zinc-600 dark:text-zinc-400 text-sm">
                                            {item.host || '-'}
                                        </td>
                                    )}
                                    {(activeTab === 'anime' || activeTab === 'tv-shows') && (
                                        <td className="p-4 text-zinc-600 dark:text-zinc-400 text-sm">
                                            {item.episodes_watched !== undefined
                                                ? `${item.episodes_watched} / ${item.total_episodes || '?'}`
                                                : (item.current_season ? `S${item.current_season} E${item.current_episode}` : '-')}
                                        </td>
                                    )}
                                    {activeTab === 'podcasts' && (
                                        <td className="p-4 text-zinc-600 dark:text-zinc-400 text-sm">
                                            {item.episodes_listened !== undefined
                                                ? `${item.episodes_listened} / ${item.total_episodes || '?'}`
                                                : '-'}
                                        </td>
                                    )}
                                    {activeTab === 'games' && (
                                        <td className="p-4 text-zinc-600 dark:text-zinc-400 text-sm">
                                            {item.platform || '-'}
                                        </td>
                                    )}
                                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                                        <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-bold">
                                            {item.my_rating ? Number(item.my_rating).toFixed(1) : '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
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
                                                const label = statusMap[item.status] || item.status;
                                                const rawDate = item.completed_date || item.date;
                                                const date = typeof rawDate === 'string' && rawDate
                                                    ? rawDate.split('T')[0].split(' ')[0]
                                                    : '';
                                                return date ? `${label} ${date}` : label;
                                            })()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <a
                                            href={`/${activeTab === 'tv-shows' ? 'tv' : activeTab}/${item.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="預覽"
                                        >
                                            <Eye size={18} />
                                        </a>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-zinc-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="編輯"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="刪除"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <div className="p-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        顯示 {(page - 1) * pagination.limit + 1} 到 {Math.min(page * pagination.limit, pagination.total)} 條，共 {pagination.total} 條
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-300"
                        >
                            上一頁
                        </button>
                        <span className="text-sm font-medium px-2 text-zinc-700 dark:text-zinc-300">
                            {page} / {pagination.total_pages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                            disabled={page === pagination.total_pages}
                            className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-zinc-700 dark:text-zinc-300"
                        >
                            下一頁
                        </button>
                    </div>
                </div>
            )}

            <SearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleSearchSelect}
                manualAddEnabled={true}
                defaultType={
                    activeTab === 'movies' ? 'movie' :
                        activeTab === 'tv-shows' ? 'tv' :
                            activeTab === 'books' ? 'book' :
                                activeTab === 'games' ? 'game' :
                                    activeTab === 'podcasts' ? 'podcast' :
                                        activeTab === 'documentaries' ? 'documentary' :
                                            'anime'
                }
            />

            <AddMediaModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                item={selectedItem}
                type={modalMediaType || activeTab}
                onSave={handleSaveMedia}
                saving={saving}
                onDelete={handleDelete}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />
        </div>

    );
};

// Helpers
function getItemTitle(item: any, type: MediaType) {
    if (!item) return '';

    if (type === 'games' && typeof item.title_zh === 'string' && item.title_zh.trim()) return item.title_zh.trim();

    // 優先使用後端返回的 title 字段
    if (typeof item.title === 'string' && item.title) return item.title;

    // 向下兼容舊數據和搜索結果
    if (type === 'tv-shows' || type === 'documentaries') return item.name || item.title;
    if (type === 'anime') return item.title?.native || item.title?.romaji || item.title?.english || item.name;
    if (type === 'books') return item.volumeInfo?.title || item.title;
    if (type === 'games') return item.name || item.title;
    if (type === 'podcasts') return item.collectionName || item.title;

    return item.title || item.name || 'Unknown Title';
}

function getItemImage(item: any, type: MediaType) {
    if (!item) return '/placeholder.png';

    // 優先使用新字段：cover_image_cdn / cover_image_local
    if (item.cover_image_cdn) return item.cover_image_cdn;
    if (item.cover_image_local) return item.cover_image_local;

    // 向下兼容舊數據和搜索結果
    if (item.cover_url) return item.cover_url;

    if (type === 'movies' || type === 'documentaries' || type === 'tv-shows') {
        if (item.poster_path) return item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        return item.image || '/placeholder.png';
    }
    if (type === 'anime') return item.coverImage?.large || item.coverImage?.medium || '/placeholder.png';
    if (type === 'books') return item.volumeInfo?.imageLinks?.thumbnail || item.image || '/placeholder.png';
    if (type === 'games') {
        if (item.cover?.image_id) return getIGDBImageUrl(item.cover.image_id);
        return item.background_image || '/placeholder.png';
    }
    if (type === 'podcasts') return item.artworkUrl600 || item.artworkUrl100 || item.artwork_url || '/placeholder.png';

    return item.image || '/placeholder.png';
}
