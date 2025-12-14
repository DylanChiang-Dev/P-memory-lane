import { fetchWithAuth } from './api';

export interface GoogleBookResult {
    id: string;
    volumeInfo: {
        title: string;
        authors?: string[];
        publishedDate?: string;
        description?: string;
        imageLinks?: {
            thumbnail: string;
            smallThumbnail: string;
        };
        averageRating?: number;
        ratingsCount?: number;
    };
}

export interface GoogleBooksResponse {
    kind: string;
    totalItems: number;
    items?: GoogleBookResult[];
}

export async function searchGoogleBooks(query: string): Promise<GoogleBookResult[]> {
    try {
        const response = await fetchWithAuth(`/api/search/google-books?query=${encodeURIComponent(query)}`);
        if (!response.ok) return [];
        const json = await response.json();
        const data: GoogleBooksResponse = json?.data ?? json;
        return data?.items || [];
    } catch (error) {
        console.error('Error searching Google Books:', error);
        return [];
    }
}

export function getGoogleBookImageUrl(link: string | undefined): string {
    if (!link) return '/placeholder.png';
    // Google Books image links are often http, upgrade to https
    return link.replace('http://', 'https://');
}

export async function getBookDetails(id: string): Promise<GoogleBookResult | null> {
    // Details are served by backend/library; no direct Google Books calls in frontend.
    return null;
}
