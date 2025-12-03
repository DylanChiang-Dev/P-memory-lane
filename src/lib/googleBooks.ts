const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

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
        // Google Books API is public and doesn't strictly require an API key for basic search,
        // but using one is recommended for higher quotas. 
        // We'll use it without key for now as per requirements, or add key if provided later.
        const response = await fetch(
            `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=20&printType=books`
        );

        if (!response.ok) {
            throw new Error(`Google Books API Error: ${response.statusText}`);
        }

        const data: GoogleBooksResponse = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error searching Google Books:', error);
        return [];
    }
}

export function getGoogleBookImageUrl(link: string | undefined): string {
    if (!link) return '/placeholder-book.png';
    // Google Books image links are often http, upgrade to https
    return link.replace('http://', 'https://');
}
