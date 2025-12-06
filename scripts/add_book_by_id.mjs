#!/usr/bin/env node
/**
 * Add Single Book by Google Books ID
 * 
 * Usage:
 *   node scripts/add_book_by_id.mjs <GOOGLE_BOOKS_ID>
 */

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// Memory Lane credentials
let ML_EMAIL = process.env.ML_EMAIL || '3331322@gmail.com';
let ML_PASSWORD = process.env.ML_PASSWORD || 'ca123456789';

let accessToken = null;

async function login() {
    if (process.env.ML_ACCESS_TOKEN) {
        console.log('🔑 Using provided access token');
        accessToken = process.env.ML_ACCESS_TOKEN;
        return;
    }

    console.log('🔐 Logging in to Memory Lane...');
    const response = await fetch(`${ML_API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ML_EMAIL, password: ML_PASSWORD })
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(`Login failed: ${data.error || data.message}`);
    }
    accessToken = data.data.access_token;
    console.log('✅ Login successful\n');
}

async function getGoogleBookDetails(id) {
    console.log(`🔍 Fetching details for Google Book ID: ${id}...`);
    const response = await fetch(`${GOOGLE_BOOKS_API}/${id}`);
    if (!response.ok) {
        throw new Error(`Google Books API Error: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✅ Found: ${data.volumeInfo.title}`);
    return data;
}

function transformGoogleBook(googleBook) {
    const info = googleBook.volumeInfo;
    let title = info.title;
    if (info.subtitle) {
        title = `${title}：${info.subtitle}`;
    }

    let coverImage = null;

    if (info.imageLinks) {
        // Prioritize largest available image
        coverImage = info.imageLinks.extraLarge ||
            info.imageLinks.large ||
            info.imageLinks.medium ||
            info.imageLinks.thumbnail ||
            info.imageLinks.smallThumbnail;

        if (coverImage) {
            coverImage = coverImage.replace('http://', 'https://');
            coverImage = coverImage.replace(/&zoom=\d/, ''); // Remove zoom to potentially get better quality
            coverImage = coverImage.replace(/&edge=curl/, ''); // Remove page curl effect if present
        }
    }

    return {
        title: title,
        authors: info.authors?.join(', ') || null,
        status: 'read', // Default to read
        cover_image_cdn: coverImage,
        release_date: info.publishedDate || null,
        overview: info.description?.substring(0, 500) || null,
        google_books_id: googleBook.id,
        completed_date: new Date().toISOString().split('T')[0], // Default to today
    };
}

async function addBook(bookData) {
    console.log('📝 Adding book to library...');
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
    console.log(`✅ Book added successfully: ID ${data.data.id}`);
    return data;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error('Usage: node scripts/add_book_by_id.mjs <GOOGLE_BOOKS_ID>');
        process.exit(1);
    }

    const bookId = args[0];

    try {
        await login();
        const googleBook = await getGoogleBookDetails(bookId);
        const bookData = transformGoogleBook(googleBook);
        await addBook(bookData);
    } catch (error) {
        console.error(`\n💥 Error: ${error.message}`);
        process.exit(1);
    }
}

// Check if running directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}

export { login, getGoogleBookDetails, transformGoogleBook, addBook, accessToken };
