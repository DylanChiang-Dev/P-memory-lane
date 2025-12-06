import axios from 'axios';
import fs from 'fs';
import https from 'https';
import { pipeline } from 'stream/promises';
import FormData from 'form-data';
import { login, accessToken } from './add_book_by_id.mjs';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';

// IDs of Chinese editions to delete
const DELETE_IDS = [339, 340, 341, 342, 343, 344];

// English editions Google Books IDs (searched and verified to have images)
const ENGLISH_BOOKS = [
    // Book 1 already exists as ID 346, skip it
    { query: 'Harry Potter Chamber of Secrets Rowling', title: 'Chamber of Secrets' },
    { query: 'Harry Potter Prisoner of Azkaban Rowling', title: 'Prisoner of Azkaban' },
    { query: 'Harry Potter Goblet of Fire Rowling', title: 'Goblet of Fire' },
    { query: 'Harry Potter Order of the Phoenix Rowling', title: 'Order of the Phoenix' },
    { query: 'Harry Potter Half-Blood Prince Rowling', title: 'Half-Blood Prince' },
    { query: 'Harry Potter Deathly Hallows Rowling', title: 'Deathly Hallows' }
];

async function searchWithImage(query) {
    console.log(`🔍 Searching for: ${query}...`);
    const res = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
        params: { q: query, printType: 'books', maxResults: 10, langRestrict: 'en' }
    });

    if (!res.data.items) return null;

    for (const item of res.data.items) {
        if (item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail) {
            let img = item.volumeInfo.imageLinks.extraLarge ||
                item.volumeInfo.imageLinks.large ||
                item.volumeInfo.imageLinks.medium ||
                item.volumeInfo.imageLinks.thumbnail;
            if (img) img = img.replace('http://', 'https://').replace(/&zoom=\d/, '').replace(/&edge=curl/, '');

            return {
                id: item.id,
                title: item.volumeInfo.title,
                subtitle: item.volumeInfo.subtitle,
                authors: item.volumeInfo.authors,
                pageCount: item.volumeInfo.pageCount,
                publishedDate: item.volumeInfo.publishedDate,
                description: item.volumeInfo.description,
                imageUrl: img
            };
        }
    }
    return null;
}

async function downloadImage(url, filepath) {
    const res = await new Promise((resolve, reject) => {
        https.get(url, resolve).on('error', reject);
    });
    if (res.statusCode !== 200) throw new Error(`Download failed: ${res.statusCode}`);
    await pipeline(res, fs.createWriteStream(filepath));
}

async function uploadImage(filepath) {
    const formData = new FormData();
    formData.append('files[]', fs.readFileSync(filepath), { filename: 'cover.jpg', contentType: 'image/jpeg' });
    const res = await axios.post(`${ML_API_BASE}/api/media`, formData, {
        headers: { 'Authorization': `Bearer ${accessToken}`, ...formData.getHeaders() },
        maxBodyLength: Infinity
    });
    if (!res.data.success || !res.data.data.items?.length) throw new Error('Upload failed');
    return res.data.data.items[0].url;
}

async function addBook(bookData, localImageUrl) {
    const fullTitle = bookData.subtitle ? `${bookData.title}: ${bookData.subtitle}` : bookData.title;
    const payload = {
        google_books_id: bookData.id,
        title: fullTitle,
        authors: bookData.authors ? bookData.authors.join(', ') : 'J. K. Rowling',
        cover_image_cdn: localImageUrl,
        page_count: bookData.pageCount,
        overview: bookData.description?.substring(0, 500),
        published_date: bookData.publishedDate,
        status: 'read',
        my_rating: 10,
        completed_date: new Date().toISOString().split('T')[0]
    };

    const res = await axios.post(`${ML_API_BASE}/api/library/books`, payload, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!res.data.success) throw new Error('Add failed: ' + JSON.stringify(res.data));
    return res.data.data.id;
}

async function main() {
    try {
        await login();

        // Step 1: Delete Chinese editions
        console.log('\n🗑️ Deleting Chinese editions...');
        for (const id of DELETE_IDS) {
            try {
                await axios.delete(`${ML_API_BASE}/api/library/books/${id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                console.log(`   Deleted ID ${id}`);
            } catch (e) {
                console.log(`   Warning: Could not delete ${id}: ${e.message}`);
            }
        }

        // Step 2: Add English editions (Book 1 already exists)
        console.log('\n➕ Adding English editions (Books 2-7)...');
        for (const book of ENGLISH_BOOKS) {
            try {
                const found = await searchWithImage(book.query);
                if (!found) {
                    console.log(`❌ No image found for ${book.title}`);
                    continue;
                }

                console.log(`   Found: ${found.title} (ID: ${found.id})`);

                const tempFile = `temp_${found.id}.jpg`;
                await downloadImage(found.imageUrl, tempFile);
                const localUrl = await uploadImage(tempFile);
                console.log(`   ⬆️ Uploaded: ${localUrl}`);

                const newId = await addBook(found, localUrl);
                console.log(`   ✅ Added ${found.title} (New ID: ${newId})`);

                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                await new Promise(r => setTimeout(r, 500));

            } catch (err) {
                console.error(`💥 Error processing ${book.title}:`, err.message);
            }
        }

        console.log('\n✅ All done!');

    } catch (error) {
        console.error('\n💥 Critical Error:', error.message);
    }
}

main();
