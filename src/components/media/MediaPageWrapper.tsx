import React from 'react';
import { MediaLibraryPage } from './MediaLibraryPage';
import { MediaManager } from './MediaManager';

interface MediaPageWrapperProps {
    mediaType: 'movies' | 'tv-shows' | 'books' | 'games' | 'podcasts' | 'documentaries' | 'anime';
    title: string;
    description: string;
    showAddButton?: boolean;
}

export const MediaPageWrapper: React.FC<MediaPageWrapperProps> = (props) => {
    return (
        <>
            <MediaLibraryPage {...props} />
            {props.showAddButton && <MediaManager />}
        </>
    );
};
