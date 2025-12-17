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
            // data.type 已經是正確的 API 類型（movies, tv-shows, books, games, podcasts, documentaries, anime）
            const apiType = data.type;

            // Prepare payload based on type
            let payload: any = {
                my_rating: data.rating,
                status: data.status,
                review: data.review,
                my_review: data.review,
                completed_date: data.date,
            };
            if (data.customCoverUrl) payload.cover_image_cdn = data.customCoverUrl;

            if (data.type === 'movies') {
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
            } else if (data.type === 'tv-shows') {
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
            } else if (data.type === 'books') {
                const isManual = !!data.item?.__manual;
                if (isManual) {
                    payload.google_books_id = null;
                    payload.title = data.title;
                    payload.overview = data.overview ?? null;
                } else if (data.item.volumeInfo) {
                    // Google Books 格式
                    payload.google_books_id = data.item.id;
                    payload.title = data.item.volumeInfo.title;
                    payload.authors = data.item.volumeInfo.authors?.join(', ') || null;
                    payload.overview = data.item.volumeInfo.description || null;
                    payload.isbn = data.item.volumeInfo.industryIdentifiers?.[0]?.identifier || null;
                    payload.release_date = data.item.volumeInfo.publishedDate || null;
                    payload.page_count = data.item.volumeInfo.pageCount || null;
                    payload.external_rating = data.item.volumeInfo.averageRating || null;
                    if (!payload.cover_image_cdn && data.item.volumeInfo.imageLinks?.thumbnail) {
                        payload.cover_image_cdn = data.item.volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
                    }
                } else {
                    // NeoDB 格式
                    payload.neodb_id = data.item.uuid || data.item.id;
                    payload.google_books_id = null; // NeoDB 沒有 Google Books ID
                    payload.title = data.item.title || data.item.display_title;
                    payload.authors = Array.isArray(data.item.author) ? data.item.author.join(', ') : (data.item.author || null);
                    payload.overview = data.item.brief || data.item.description || null;
                    payload.isbn = data.item.isbn || null;
                    payload.release_date = data.item.pub_year ? `${data.item.pub_year}-01-01` : null;
                    payload.page_count = data.item.pages || null;
                    payload.external_rating = data.item.rating || null;
                    if (!payload.cover_image_cdn && data.item.cover_image_url) {
                        payload.cover_image_cdn = data.item.cover_image_url;
                    }
                }
            } else if (data.type === 'games') {
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
            } else if (data.type === 'documentaries') {
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
                saving={false}
            />
        </>
    );
};
