import React from 'react';
import { Star } from 'lucide-react';

export interface MediaItem {
    id: number;
    title: string;
    image: string;
    rating?: number;
    year?: string;
    status?: string;
}

interface MediaCardProps {
    item: MediaItem;
    type: 'movie' | 'tv' | 'book' | 'game';
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, type }) => {
    return (
        <div className="flex-shrink-0 w-[140px] md:w-[160px] group cursor-pointer">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-lg bg-zinc-800">
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    {item.rating && (
                        <div className="flex items-center gap-1 text-yellow-400 mb-1">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-bold">{item.rating}</span>
                        </div>
                    )}
                    <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-medium">
                        {item.year}
                    </span>
                </div>
            </div>
            <h3 className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                {item.title}
            </h3>
        </div>
    );
};
