import React, { useState } from 'react';
import { SearchDialog } from './SearchDialog';
import { AddMediaModal } from './AddMediaModal';
import { Plus } from 'lucide-react';
import { addMediaItem } from '../../lib/api';
import { useToast } from '../ui/Toast';

export const MediaManager: React.FC = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<any>('movie');
    const { showToast } = useToast();

    const handleSelect = (item: any, type: any) => {
        setSelectedItem(item);
        setSelectedType(type);
        setIsSearchOpen(false);
        setIsAddOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            // Map frontend type to API type
            const apiType = data.type === 'movie' ? 'movies' :
                data.type === 'tv' ? 'tv-shows' :
                    data.type === 'book' ? 'books' : 'games';

            // Prepare payload based on type
            let payload: any = {
                my_rating: data.rating,
                status: data.status,
                my_review: data.review,
            };
            if (data.customCoverUrl) payload.cover_image_cdn = data.customCoverUrl;

            if (data.type === 'movie') {
                payload.tmdb_id = data.item?.__manual ? null : data.item.id;
                if (data.item?.__manual) {
                    payload.title = data.title;
                    payload.overview = data.overview ?? null;
                } else {
                    payload.release_date = data.item.release_date;
                }
                payload.completed_date = data.date;
            } else if (data.type === 'tv') {
                payload.tmdb_id = data.item?.__manual ? null : data.item.id;
                if (data.item?.__manual) {
                    payload.title = data.title;
                    payload.overview = data.overview ?? null;
                } else {
                    payload.first_air_date = data.item.first_air_date;
                    payload.current_season = data.season;
                    payload.current_episode = data.episode;
                }
            } else if (data.type === 'book') {
                payload.google_books_id = data.item?.__manual ? null : data.item.id;
                if (data.item?.__manual) {
                    payload.title = data.title;
                    payload.overview = data.overview ?? null;
                } else {
                    payload.isbn = data.item.volumeInfo?.industryIdentifiers?.[0]?.identifier;
                    payload.publication_date = data.item.volumeInfo?.publishedDate;
                }
            } else if (data.type === 'game') {
                const legacyManualRawgId = 900000000 + (Date.now() % 1000000000);
                if (!data.item?.__manual) {
                    payload.source = 'igdb';
                    payload.source_id = data.item.id;
                    payload.igdb_id = data.item.id;
                    payload.rawg_id = data.item.id; // legacy backends stored IGDB id in rawg_id
                } else {
                    payload.source = 'manual';
                    payload.rawg_id = legacyManualRawgId;
                }
                payload.platform = data.platform;
                payload.title_zh = typeof data.title_zh === 'string' ? data.title_zh.trim() : '';
                if (data.item?.__manual) {
                    payload.title = data.title;
                    payload.name = data.title; // some backends accept name instead of title
                    payload.overview = data.overview ?? null;
                }
                payload.playtime_hours = 0; // Default
            }

            const result = await addMediaItem(apiType, payload);

            if (result.success) {
                showToast('已成功添加到媒體庫！', 'success');
                setTimeout(() => window.location.reload(), 1000); // Delay reload to show toast
            } else {
                showToast('添加失敗: ' + (result.error || '未知錯誤'), 'error', 8000);
            }
        } catch (error) {
            console.error('Error adding media:', error);
            showToast('發生錯誤，請稍後再試', 'error', 8000);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsSearchOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40 group"
            >
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <SearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleSelect}
                manualAddEnabled={true}
            />

            <AddMediaModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                item={selectedItem}
                type={selectedType}
                onSave={handleSave}
            />
        </>
    );
};
