export interface ITunesPodcastResult {
    collectionId: number;
    collectionName: string;
    artistName: string;
    artworkUrl600: string;
    artworkUrl100: string;
    releaseDate: string;
    trackCount: number;
    genres: string[];
}

export async function searchPodcasts(query: string): Promise<ITunesPodcastResult[]> {
    try {
        const response = await fetch(`https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(query)}&limit=20`);
        const data = await response.json();

        if (!data.results) return [];

        return data.results.map((item: any) => ({
            collectionId: item.collectionId,
            collectionName: item.collectionName,
            artistName: item.artistName,
            artworkUrl600: item.artworkUrl600,
            artworkUrl100: item.artworkUrl100,
            releaseDate: item.releaseDate,
            trackCount: item.trackCount,
            genres: item.genres || []
        }));
    } catch (error) {
        console.error('Error searching iTunes:', error);
        return [];
    }
}

export async function getPodcastDetails(id: string): Promise<ITunesPodcastResult | null> {
    try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) return null;

        const item = data.results[0];
        return {
            collectionId: item.collectionId,
            collectionName: item.collectionName,
            artistName: item.artistName,
            artworkUrl600: item.artworkUrl600,
            artworkUrl100: item.artworkUrl100,
            releaseDate: item.releaseDate,
            trackCount: item.trackCount,
            genres: item.genres || []
        };
    } catch (error) {
        console.error('Error fetching iTunes podcast details:', error);
        return null;
    }
}
