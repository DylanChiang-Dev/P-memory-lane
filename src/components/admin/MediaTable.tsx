import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Film, Tv, Book, Gamepad2, Mic, Video, Sparkles, Eye, Pencil } from 'lucide-react';
import { fetchMediaItems, deleteMediaItem, addMediaItem, updateMediaItem, type MediaType } from '../../lib/api';
import { getTMDBDetails, getTMDBImageUrl } from '../../lib/tmdb';
import { getPodcastDetails } from '../../lib/itunes';
import { getAnimeDetails } from '../../lib/anilist';
import { getIGDBImageUrl } from '../../lib/igdb';
import { SearchDialog } from '../media/SearchDialog';
import { AddMediaModal } from '../media/AddMediaModal';
import { DeleteConfirmModal } from '../media/DeleteConfirmModal';

const TABS = [
    { id: 'movies', label: '電影', icon: Film },
    { id: 'tv-shows', label: '劇集', icon: Tv },
    { id: 'books', label: '書籍', icon: Book },
    { id: 'games', label: '遊戲', icon: Gamepad2 },
    { id: 'podcasts', label: '播客', icon: Mic },
    { id: 'documentaries', label: '節目', icon: Video },
    { id: 'anime', label: '動畫', icon: Sparkles },
];

export const MediaTable: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MediaType>('movies');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [modalMediaType, setModalMediaType] = useState<MediaType | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await fetchMediaItems(activeTab);
            setItems(data);
        } catch (error) {
            console.error('Failed to load items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [activeTab]);

    const handleDelete = (id: number) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteMediaItem(activeTab, itemToDelete);
            setItems(items.filter(item => item.id !== itemToDelete));
        } catch (error) {
            console.error('Delete failed:', error);
            // alert('刪除失敗'); // Removed alert, maybe show toast later?
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
        try {
            let result;
            if (data.item.my_rating !== undefined) {
                // Editing existing item - Flatten data for PUT request
                const updateData = {
                    my_rating: data.rating,
                    status: data.status,
                    review: data.review,
                    date: data.date,
                    // Type specific fields
                    platform: data.platform,
                    current_season: data.season,
                    current_episode: data.episode,
                    episodes_watched: data.episodes_watched,
                    episodes_listened: data.episodes_listened,
                    total_episodes: data.total_episodes
                };
                result = await updateMediaItem(currentType, data.item.id, updateData);
            } else {
                // Adding new item - Flatten data for POST request
                const createData = {
                    // Common fields
                    my_rating: data.rating,
                    status: data.status,
                    review: data.review,
                    date: data.date,

                    // ID mapping based on type
                    ...(currentType === 'movies' && { tmdb_id: data.item.id, title: data.item.title, poster_path: data.item.poster_path, release_date: data.item.release_date }),
                    ...(currentType === 'tv-shows' && { tmdb_id: data.item.id, name: data.item.name, poster_path: data.item.poster_path, first_air_date: data.item.first_air_date }),
                    ...(currentType === 'anime' && {
                        anilist_id: data.item.id,
                        title: data.item.title?.native || data.item.title?.romaji || data.item.title?.english,
                        cover_url: data.item.coverImage?.large || data.item.coverImage?.medium,
                        release_date: data.item.startDate?.year ? `${data.item.startDate.year}-01-01` : null
                    }),
                    ...(currentType === 'podcasts' && { itunes_id: data.item.collectionId, title: data.item.collectionName, artwork_url: data.item.artworkUrl600, release_date: data.item.releaseDate }),
                    ...(currentType === 'documentaries' && { tmdb_id: data.item.id, name: data.item.name, poster_path: data.item.poster_path, first_air_date: data.item.first_air_date }),
                    // Books and Games might need specific ID fields if backend requires them, assuming google_books_id / rawg_id or similar
                    ...(currentType === 'books' && { google_books_id: data.item.id, title: data.item.volumeInfo?.title, authors: data.item.volumeInfo?.authors, published_date: data.item.volumeInfo?.publishedDate, image_url: data.item.volumeInfo?.imageLinks?.thumbnail }),
                    ...(currentType === 'games' && { igdb_id: data.item.id, name: data.item.name, cover_url: data.item.cover?.image_id ? getIGDBImageUrl(data.item.cover.image_id) : null, released: data.item.first_release_date ? new Date(data.item.first_release_date * 1000).toISOString().split('T')[0] : null }),

                    // Type specific fields
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
                loadItems();
            } else {
                alert('保存失敗: ' + (result?.error || '未知錯誤'));
                if (result?.error === 'Network error' || result?.error === 'Unauthorized') {
                    // Optional: Redirect to login or show login modal
                    // window.location.href = '/admin/login'; // Removed: causing 404
                    console.warn('Save failed due to auth or network error');
                }
            }
        } catch (error) {
            console.error('Failed to save media:', error);
            alert('保存失敗');
        }
    };

    const getPreviewUrl = (type: MediaType, id: number) => {
        // Map internal type to URL path
        const map: Record<string, string> = {
            'movies': 'movies',
            'tv-shows': 'tv',
            'books': 'books',
            'games': 'games',
            'podcasts': 'podcasts',
            'documentaries': 'documentaries',
            'anime': 'anime'
        };
        return `/${map[type] || type}/${id}`; // Assuming detail pages use ID
        // Wait, detail pages currently don't exist for individual items in this project structure?
        // The user request said "Preview... view the public page".
        // The project has /movies, /tv etc which list items.
        // Does it have detail pages?
        // Checking file list... /src/pages/movies.astro exists. /src/pages/movies/[id].astro?
        // I don't see dynamic routes for details in the file list I saw earlier.
        // Let's check if detail pages exist.
        // If not, maybe preview just links to the list page?
        // User said: "Preview... click eye icon... jump to that item's detail page (e.g. /movies/123)".
        // I should assume they exist or will exist.
    };

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as MediaType)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium shadow-lg shadow-teal-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus size={18} />
                    添加新項目
                </button>
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
                                                return statusMap[item.status] || item.status;
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

            <SearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleSearchSelect}
            />

            <AddMediaModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                item={selectedItem}
                type={modalMediaType || activeTab}
                onSave={handleSaveMedia}
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
    if (type === 'movies') return item.title;
    if (type === 'tv-shows' || type === 'documentaries') return item.name;
    if (type === 'anime') return item.title?.native || item.title?.romaji || item.title?.english || item.name || item.title;
    if (type === 'books') return item.volumeInfo?.title || item.title;
    if (type === 'games') return item.name;
    if (type === 'podcasts') return item.collectionName || item.title;
    return item.title || item.name || 'Unknown Title';
}

function getItemImage(item: any, type: MediaType) {
    if (!item) return '/placeholder.png';

    if (type === 'movies' || type === 'documentaries' || type === 'tv-shows') {
        if (item.poster_path) return item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w200${item.poster_path}`;
        return item.cover_url || item.image || '/placeholder.png';
    }
    if (type === 'anime') return item.coverImage?.large || item.coverImage?.medium || item.cover_url || '/placeholder.png';
    if (type === 'books') return item.volumeInfo?.imageLinks?.thumbnail || item.cover_url || item.image || '/placeholder.png';
    if (type === 'games') {
        if (item.cover?.image_id) return getIGDBImageUrl(item.cover.image_id);
        return item.background_image || item.cover_url || '/placeholder.png';
    }
    if (type === 'podcasts') return item.artworkUrl600 || item.artworkUrl100 || item.artwork_url || item.cover_url || '/placeholder.png';

    return item.cover_url || item.image || '/placeholder.png';
}
