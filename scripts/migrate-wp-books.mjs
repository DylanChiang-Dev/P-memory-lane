#!/usr/bin/env node
/**
 * WordPress Book Reviews Migration Script
 * 
 * 從 WordPress 網站遷移書評到 Memory Lane
 * 
 * Usage:
 *   node scripts/migrate-wp-books.mjs
 * 
 * Environment:
 *   ML_API_BASE - Memory Lane API 基礎 URL (默認: https://api.3331322.xyz)
 *   ML_EMAIL - Memory Lane 登入郵箱
 *   ML_PASSWORD - Memory Lane 登入密碼
 */

const WP_API_BASE = 'https://blog.3331322.xyz/wp-json/wp/v2';
const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';

// Memory Lane credentials (will prompt if not set)
let ML_EMAIL = process.env.ML_EMAIL || '3331322@gmail.com';
let ML_PASSWORD = process.env.ML_PASSWORD || 'ca123456789';

let accessToken = null;

/**
 * 登入 Memory Lane 獲取 access token
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
    console.log('✅ 登入成功');
}

/**
 * 從 WordPress 獲取所有書評
 */
async function fetchWPBooks() {
    console.log('📚 從 WordPress 獲取書評...');

    const books = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${WP_API_BASE}/book_review?per_page=100&page=${page}&_embed`;
        console.log(`   獲取第 ${page} 頁...`);

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 400) {
                // No more pages
                hasMore = false;
                continue;
            }
            throw new Error(`WP API 錯誤: ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            hasMore = false;
        } else {
            books.push(...data);
            page++;
        }
    }

    console.log(`✅ 獲取到 ${books.length} 本書評`);
    return books;
}

/**
 * 獲取 WordPress 媒體圖片的 URL
 */
async function getMediaUrl(mediaId) {
    if (!mediaId) return null;

    try {
        const response = await fetch(`${WP_API_BASE}/media/${mediaId}`);
        if (!response.ok) return null;

        const media = await response.json();
        // 優先使用 full size，否則使用 source_url
        return media.media_details?.sizes?.full?.source_url || media.source_url;
    } catch (error) {
        console.warn(`   ⚠️ 無法獲取圖片 ${mediaId}: ${error.message}`);
        return null;
    }
}

/**
 * 檢查書籍是否已存在
 */
async function bookExists(title) {
    const response = await fetch(
        `${ML_API_BASE}/api/library/books?search=${encodeURIComponent(title)}&limit=1`,
        {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        }
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.success && data.data.items.length > 0;
}

/**
 * 添加書籍到 Memory Lane
 */
async function addBook(book) {
    const response = await fetch(`${ML_API_BASE}/api/library/books`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(book)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
}

/**
 * 轉換 WordPress 書評為 Memory Lane 格式
 */
function transformBook(wpBook, coverUrl) {
    // 解碼 HTML 實體
    const decodeHtml = (html) => {
        return html
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
    };

    const title = decodeHtml(wpBook.title.rendered);

    // 提取純文本內容作為評論
    const contentHtml = wpBook.content.rendered || '';
    const review = contentHtml
        .replace(/<[^>]*>/g, '')  // 移除 HTML 標籤
        .replace(/\n\s*\n/g, '\n')  // 合併空行
        .trim();

    return {
        title: title,
        status: 'read',  // 標記為已讀
        cover_image: coverUrl || null,
        my_review: review || null,
        completed_date: wpBook.date.split('T')[0],  // 使用發布日期作為完成日期
        // 沒有作者資訊，設為空
        author: null,
    };
}

/**
 * 主遷移函數
 */
async function migrate() {
    console.log('🚀 開始 WordPress 書評遷移\n');
    console.log(`   WordPress: ${WP_API_BASE}`);
    console.log(`   Memory Lane: ${ML_API_BASE}\n`);

    // 登入
    await login();

    // 獲取 WordPress 書評
    const wpBooks = await fetchWPBooks();

    // 統計
    let success = 0;
    let skipped = 0;
    let failed = 0;

    console.log('\n📝 開始遷移書籍...\n');

    for (let i = 0; i < wpBooks.length; i++) {
        const wpBook = wpBooks[i];
        const title = wpBook.title.rendered.replace(/<[^>]*>/g, '');

        process.stdout.write(`[${i + 1}/${wpBooks.length}] ${title.substring(0, 30).padEnd(30)} `);

        try {
            // 檢查是否已存在
            if (await bookExists(title)) {
                console.log('⏭️  已存在');
                skipped++;
                continue;
            }

            // 獲取封面圖片
            const coverUrl = await getMediaUrl(wpBook.featured_media);

            // 轉換並添加
            const book = transformBook(wpBook, coverUrl);
            await addBook(book);

            console.log('✅ 成功');
            success++;

            // 避免請求過快
            await new Promise(r => setTimeout(r, 200));

        } catch (error) {
            console.log(`❌ 失敗: ${error.message}`);
            failed++;
        }
    }

    // 總結
    console.log('\n' + '='.repeat(50));
    console.log('📊 遷移完成!\n');
    console.log(`   ✅ 成功: ${success}`);
    console.log(`   ⏭️  跳過: ${skipped}`);
    console.log(`   ❌ 失敗: ${failed}`);
    console.log(`   📚 總計: ${wpBooks.length}`);
}

// 執行
migrate().catch(error => {
    console.error('\n💥 遷移失敗:', error.message);
    process.exit(1);
});
