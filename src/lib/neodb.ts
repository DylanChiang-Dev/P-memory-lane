/**
 * NeoDB API 封裝
 * 用於搜索中文書籍，替代 Google Books API
 * API 文檔: https://neodb.net/api/
 */

const NEODB_API_BASE = 'https://neodb.social/api';

export interface NeoDBBookResult {
    id: string;
    type: string;
    uuid: string;
    url: string;
    api_url: string;
    category: string;
    display_title: string;
    title: string;
    description: string;
    cover_image_url: string | null;
    rating: number | null;
    rating_count: number;
    brief: string;
    subtitle: string | null;
    orig_title: string | null;
    author: string[];
    translator: string[];
    language: string[];
    pub_house: string | null;
    pub_year: number | null;
    pub_month: number | null;
    binding: string | null;
    price: string | null;
    pages: number | null;
    series: string | null;
    imprint: string | null;
    isbn: string | null;
}

export interface NeoDBSearchResponse {
    data: NeoDBBookResult[];
    pages: number;
    count: number;
}

/**
 * 搜索書籍
 * @param query 搜索關鍵字
 * @returns 書籍搜索結果
 */
export async function searchNeoDBBooks(query: string): Promise<NeoDBBookResult[]> {
    try {
        const url = `${NEODB_API_BASE}/catalog/search?query=${encodeURIComponent(query)}&category=book`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error('NeoDB search failed:', response.status, response.statusText);
            return [];
        }

        const data: NeoDBSearchResponse = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error searching NeoDB:', error);
        return [];
    }
}

/**
 * 獲取書籍封面圖片 URL
 * @param coverUrl NeoDB 返回的封面 URL
 * @returns 處理後的封面 URL
 */
export function getNeoDBImageUrl(coverUrl: string | null | undefined): string {
    if (!coverUrl) return '/placeholder.png';
    return coverUrl;
}

/**
 * 獲取書籍詳情
 * @param uuid 書籍 UUID
 * @returns 書籍詳情
 */
export async function getNeoDBBookDetails(uuid: string): Promise<NeoDBBookResult | null> {
    try {
        const url = `${NEODB_API_BASE}/book/${uuid}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error('NeoDB book details failed:', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching NeoDB book details:', error);
        return null;
    }
}
