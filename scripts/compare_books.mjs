#!/usr/bin/env node
/**
 * Compare WordPress books with Memory Lane books
 * 找出 WordPress 上有但 Memory Lane 上沒有的書籍
 */

const WP_API_BASE = 'https://blog.3331322.xyz/wp-json/wp/v2';
const ML_API_BASE = 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL || '3331322@gmail.com';
const ML_PASSWORD = process.env.ML_PASSWORD || 'ca123456789';

let accessToken = null;

async function login() {
    const response = await fetch(`${ML_API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ML_EMAIL, password: ML_PASSWORD })
    });
    const data = await response.json();
    if (!data.success) throw new Error(`登入失敗: ${data.error}`);
    accessToken = data.data.access_token;
}

async function fetchWPBooks() {
    const books = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`${WP_API_BASE}/book_review?per_page=100&page=${page}`);
        if (!response.ok) {
            if (response.status === 400) break;
            throw new Error(`WP API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.length === 0) break;

        for (const item of data) {
            const title = item.title?.rendered?.replace(/<[^>]*>/g, '').trim();
            if (title) books.push(title);
        }
        page++;
        hasMore = data.length === 100;
    }
    return books;
}

async function fetchMLBooks() {
    const books = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`${ML_API_BASE}/api/library/books?page=${page}&limit=100`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (!data.success) break;

        for (const item of data.data.items) {
            if (item.title) books.push(item.title);
        }

        hasMore = page < data.data.pagination.total_pages;
        page++;
    }
    return books;
}

function normalize(str) {
    return str.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[：:]/g, '')
        .replace(/[（()）]/g, '')
        .replace(/【】/g, '')
        .replace(/[,.，。]/g, '');
}

async function main() {
    try {
        console.log('🔐 Logging in...');
        await login();

        console.log('📚 Fetching WordPress books...');
        const wpBooks = await fetchWPBooks();
        console.log(`   Found ${wpBooks.length} books on WordPress`);

        console.log('📖 Fetching Memory Lane books...');
        const mlBooks = await fetchMLBooks();
        console.log(`   Found ${mlBooks.length} books on Memory Lane\n`);

        // Normalize for comparison
        const mlNormalized = new Set(mlBooks.map(normalize));

        // Find missing books
        const missing = wpBooks.filter(title => !mlNormalized.has(normalize(title)));

        console.log('='.repeat(60));
        console.log(`📋 WordPress 上有但 Memory Lane 上沒有的書籍 (${missing.length} 本):`);
        console.log('='.repeat(60));

        if (missing.length === 0) {
            console.log('\n✅ 所有書籍都已導入！');
        } else {
            missing.forEach((title, i) => {
                console.log(`${i + 1}. ${title}`);
            });
        }

    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

main();
