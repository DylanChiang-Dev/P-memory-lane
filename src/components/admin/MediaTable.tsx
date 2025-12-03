import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Film, Tv, Book, Gamepad2, Search } from 'lucide-react';
import { fetchMediaItems, deleteMediaItem } from '../../lib/api';
import { SearchDialog } from '../media/SearchDialog';

type MediaType = 'movies' | 'tv-shows' | 'books' | 'games';

const TABS = [
    { id: 'movies', label: '電影', icon: Film },
    { id: 'tv-shows', label: '劇集', icon: Tv },
    { id: 'books', label: '書籍', icon: Book },
    { id: 'games', label: '遊戲', icon: Gamepad2 },
];

export const MediaTable: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MediaType>('movies');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await fetchMediaItems(activeTab);
            setItems(data);
        } catch (error) {
            console.error('Failed to load media items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [activeTab]);

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這個項目嗎？')) return;
        try {
            await deleteMediaItem(activeTab, id);
            setItems(items.filter(item => item.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('刪除失敗');
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as MediaType)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
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
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">評分</th>
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">狀態</th>
                            <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500">加載中...</td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500">暫無數據</td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="p-4 w-20">
                                        <img
                                            src={item.poster_path || item.cover_url || item.background_image}
                                            alt={item.title || item.name}
                                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                                        />
                                    </td>
                                    <td className="p-4 font-medium text-zinc-900 dark:text-white">
                                        {item.title || item.name}
                                    </td>
                                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                                        <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-bold">
                                            {item.my_rating || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
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
                onClose={() => {
                    setIsSearchOpen(false);
                    loadItems(); // Refresh list after adding
                }}
            />
        </div>
    );
};
