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
            const apiType =
                data.type === 'movie' ? 'movies' :
                    data.type === 'tv' ? 'tv-shows' :
                        data.type === 'documentary' ? 'documentaries' :
                            data.type === 'podcast' ? 'podcasts' :
                                data.type === 'anime' ? 'anime' :
                                    data.type === 'book' ? 'books' :
                                        'games';

            // Prepare payload based on type
            let payload: any = {
                my_rating: data.rating,
                status: data.status,
                review: data.review,
                my_review: data.review,
                completed_date: data.date,
            };
            if (data.customCoverUrl) payload.cover_image_cdn = data.customCoverUrl;

            if (data.type === 'movie') {
                const isManual = !!data.item?.__manual;
                payload.tmdb_id = isManual ? null : data.item.id;
                if (data.item?.__manual) {
                    payload.title = data.title;
                    payload.overview = data.overview ?? null;
                } else {
                    payload.title = data.item.title;
                    payload.original_title = data.item.original_title ?? null;
                    payload.overview = data.item.overview ?? null;
                    payload.external_rating = data.item.vote_average ?? null;
                    payload.release_date = data.item.release_date ?? null;
                    if (!payload.cover_image_cdn && data.item.poster_path) {
                        payload.cover_image_cdn = data.item.poster_path.startsWith('http')
                            ? data.item.poster_path
                            : `https://image.tmdb.org/t/p/w500${data.item.poster_path}`;
                    }
                    if (data.item.backdrop_path) {
                        payload.backdrop_image_cdn = data.item.backdrop_path.startsWith('http')
                            ? data.item.backdrop_path
                            : `https://image.tmdb.org/t/p/original${data.item.backdrop_path}`;
                    }
                }
            } else if (data.type === 'tv') {
                const isManual = !!data.item?.__manual;
                payload.tmdb_id = isManual ? null : data.item.id;
                if (data.item?.__manual) {
                    payload.title = data.title;
                    payload.overview = data.overview ?? null;
                } else {
                    payload.title = data.item.name;
                    payload.original_title = data.item.original_name ?? null;
                    payload.overview = data.item.overview ?? null;
                    payload.external_rating = data.item.vote_average ?? null;
                    // Some backends store tv first_air_date in release_date; send both for compatibility.
                    payload.first_air_date = data.item.first_air_date ?? null;
                    payload.release_date = data.item.first_air_date ?? null;
                    if (typeof data.season === 'number') payload.current_season = data.season;
                    if (typeof data.episode === 'number') payload.current_episode = data.episode;
                    if (!payload.cover_image_cdn && data.item.poster_path) {
                        payload.cover_image_cdn = data.item.poster_path.startsWith('http')
                            ? data.item.poster_path
                            : `https://image.tmdb.org/t/p/w500${data.item.poster_path}`;
                    }
                    if (data.item.backdrop_path) {
                        payload.backdrop_image_cdn = data.item.backdrop_path.startsWith('http')
                            ? data.item.backdrop_path
                            : `https://image.tmdb.org/t/p/original${data.item.backdrop_path}`;
                    }
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
                if (!data.item?.__manual) {
                    payload.source = 'igdb';
                    payload.source_id = data.item.id;
                    payload.igdb_id = data.item.id;
                } else {
                    payload.source = 'manual';
                    payload.source_id = null;
                }
                payload.platform = data.platform;
                payload.title_zh = typeof data.title_zh === 'string' ? data.title_zh.trim() : '';
                if (data.item?.__manual) {
                    payload.title = data.title;
                    payload.name = data.title; // some backends accept name instead of title
                    payload.overview = data.overview ?? null;
                }
                payload.playtime_hours = 0; // Default
            } else if (data.type === 'documentary') {
                const isManual = !!data.item?.__manual;
                payload.tmdb_id = isManual ? null : data.item.id;
                if (isManual) {
                    payload.title = data.title;
                    payload.overview = data.overview ?? null;
                } else {
                    payload.title = data.item.name || data.item.title;
                    payload.original_title = data.item.original_name || data.item.original_title || null;
                    payload.overview = data.item.overview ?? null;
                    payload.external_rating = data.item.vote_average ?? null;
                    payload.first_air_date = data.item.first_air_date ?? null;
                    payload.release_date = data.item.first_air_date || data.item.release_date || null;
                    if (!payload.cover_image_cdn && data.item.poster_path) {
                        payload.cover_image_cdn = data.item.poster_path.startsWith('http')
                            ? data.item.poster_path
                            : `https://image.tmdb.org/t/p/w500${data.item.poster_path}`;
                    }
                    if (data.item.backdrop_path) {
                        payload.backdrop_image_cdn = data.item.backdrop_path.startsWith('http')
                            ? data.item.backdrop_path
                            : `https://image.tmdb.org/t/p/original${data.item.backdrop_path}`;
                    }
                }
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
