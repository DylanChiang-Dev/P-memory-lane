#!/usr/bin/env node
/**
 * WordPress Books Migration with Google Books API
 * 
 * 從 WordPress 獲取書名，用 Google Books API 獲取詳細資料後導入 Memory Lane
 * 
 * Usage:
 *   node scripts/migrate-wp-books-enhanced.mjs
 */

const WP_API_BASE = 'https://blog.3331322.xyz/wp-json/wp/v2';
const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// Memory Lane credentials
let ML_EMAIL = process.env.ML_EMAIL || '3331322@gmail.com';
let ML_PASSWORD = process.env.ML_PASSWORD || 'ca123456789';

let accessToken = null;

/**
 * 登入 Memory Lane
 */
async function login() {
    console.log('🔐 登入 Memory Lane...');

    const response = await fetch(`${ML_API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ML_EMAIL, password: ML_PASSWORD })
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(`登入失敗: ${data.error || data.message}`);
    }

    accessToken = data.data.access_token;
    console.log('✅ 登入成功\n');
}

/**
 * 從 WordPress 獲取所有書評（包含發布日期）
 */
async function fetchWPBooks() {
    console.log('📚 從 WordPress 獲取書評...');

    const books = [];
    const seenTitles = new Set();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${WP_API_BASE}/book_review?per_page=100&page=${page}`;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 400) {
                hasMore = false;
                continue;
            }
            throw new Error(`WP API 錯誤: ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            hasMore = false;
        } else {
            // 提取標題和發布日期
            for (const book of data) {
                const rawTitle = book.title.rendered;
                const title = decodeHtml(rawTitle);
                const publishedDate = book.date ? book.date.split('T')[0] : null; // 取 YYYY-MM-DD 部分

                if (title && !seenTitles.has(title)) {
                    seenTitles.add(title);
                    books.push({ title, publishedDate });
                }
            }
            page++;
        }
    }

    console.log(`✅ 獲取到 ${books.length} 本書評（含發布日期）\n`);
    return books;
}

/**
 * 解碼 HTML 實體
 */
function decodeHtml(html) {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
}

/**
 * 用 Google Books API 搜索書籍
 */
async function searchGoogleBooks(title) {
    try {
        // 使用書名搜索，添加 intitle 參數提高準確度
        const query = encodeURIComponent(`intitle:${title}`);
        const response = await fetch(
            `${GOOGLE_BOOKS_API}?q=${query}&maxResults=1&printType=books&langRestrict=zh`
        );

        if (!response.ok) {
            // 嘗試不帶語言限制
            const response2 = await fetch(
                `${GOOGLE_BOOKS_API}?q=${query}&maxResults=1&printType=books`
            );
            if (!response2.ok) return null;
            const data2 = await response2.json();
            return data2.items?.[0] || null;
        }

        const data = await response.json();
        return data.items?.[0] || null;
    } catch (error) {
        console.warn(`   ⚠️ Google Books 搜索失敗: ${error.message}`);
        return null;
    }
}

/**
 * 刪除所有現有書籍
 */
async function deleteAllBooks() {
    console.log('🗑️  清空現有書籍...');

    let deleted = 0;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(
            `${ML_API_BASE}/api/library/books?limit=50`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            throw new Error(`獲取書籍失敗: ${response.status}`);
        }

        const data = await response.json();
        const books = data.data?.items || [];

        if (books.length === 0) {
            hasMore = false;
            continue;
        }

        for (const book of books) {
            const delResponse = await fetch(
                `${ML_API_BASE}/api/library/books/${book.id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            if (delResponse.ok) {
                deleted++;
                process.stdout.write(`\r   已刪除 ${deleted} 本...`);
            }
        }
    }

    console.log(`\n✅ 已刪除 ${deleted} 本書籍\n`);
}

/**
 * 添加書籍到 Memory Lane
 */
async function addBook(bookData) {
    const response = await fetch(`${ML_API_BASE}/api/library/books`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(bookData)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
}

/**
 * 轉換 Google Books 結果為 Memory Lane 格式
 * @param {Object} googleBook - Google Books API 返回的書籍資料
 * @param {string} originalTitle - 原始書名
 * @param {string} completedDate - 閱讀完成日期（來自 WP 發布日期）
 */
function transformGoogleBook(googleBook, originalTitle, completedDate) {
    const info = googleBook.volumeInfo;

    // 優先使用高清圖片
    let coverImage = null;
    if (info.imageLinks) {
        coverImage = info.imageLinks.extraLarge ||
            info.imageLinks.large ||
            info.imageLinks.medium ||
            info.imageLinks.thumbnail ||
            info.imageLinks.smallThumbnail;
        // 升級到 HTTPS
        if (coverImage) {
            coverImage = coverImage.replace('http://', 'https://');
            // 移除縮放參數以獲取更大圖片
            coverImage = coverImage.replace(/&zoom=\d/, '');
        }
    }

    return {
        title: info.title || originalTitle,
        authors: info.authors?.join(', ') || null,
        status: 'read',
        cover_image_cdn: coverImage,
        release_date: info.publishedDate || null,
        overview: info.description?.substring(0, 500) || null,
        google_books_id: googleBook.id,
        completed_date: completedDate, // 使用 WP 發布日期作為閱讀完成日期
        // 發現書名差異太大時保留原始書名
        original_title: info.title !== originalTitle ? originalTitle : null,
    };
}

/**
 * 主函數
 */
async function main() {
    console.log('🚀 WordPress 書籍遷移 (Google Books 增強版)\n');
    console.log(`   WordPress: ${WP_API_BASE}`);
    console.log(`   Google Books API: ${GOOGLE_BOOKS_API}`);
    console.log(`   Memory Lane: ${ML_API_BASE}\n`);
    console.log('='.repeat(50) + '\n');

    // 登入
    await login();

    // 獲取 WordPress 書籍（含發布日期）
    const wpBooks = await fetchWPBooks();

    // 刪除現有書籍
    await deleteAllBooks();

    // 遷移書籍
    console.log('📝 開始遷移書籍...\n');

    let success = 0;
    let notFound = 0;
    let failed = 0;
    const notFoundList = [];

    for (let i = 0; i < wpBooks.length; i++) {
        const { title, publishedDate } = wpBooks[i];
        const displayTitle = title.substring(0, 25).padEnd(25);

        process.stdout.write(`[${String(i + 1).padStart(2)}/${wpBooks.length}] ${displayTitle} `);

        try {
            // 搜索 Google Books
            const googleBook = await searchGoogleBooks(title);

            if (!googleBook) {
                console.log('⚠️  未找到');
                notFound++;
                notFoundList.push(title);
                continue;
            }

            // 轉換格式（傳入 WP 發布日期作為 completed_date）
            const bookData = transformGoogleBook(googleBook, title, publishedDate);

            // 添加到 Memory Lane
            await addBook(bookData);

            console.log(`✅ ${publishedDate || '無日期'}`);
            success++;

            // 避免請求過快 (Google Books API 有限制)
            await new Promise(r => setTimeout(r, 300));

        } catch (error) {
            console.log(`❌ ${error.message}`);
            failed++;
        }
    }

    // 總結
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 遷移完成!\n');
    console.log(`   ✅ 成功: ${success}`);
    console.log(`   ⚠️  未找到: ${notFound}`);
    console.log(`   ❌ 失敗: ${failed}`);
    console.log(`   📚 總計: ${wpBooks.length}`);

    if (notFoundList.length > 0) {
        console.log('\n⚠️  以下書籍在 Google Books 中未找到:');
        notFoundList.forEach(t => console.log(`   - ${t}`));
    }
}

// 執行
main().catch(error => {
    console.error('\n💥 遷移失敗:', error.message);
    process.exit(1);
});
