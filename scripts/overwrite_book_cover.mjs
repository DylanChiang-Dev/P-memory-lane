import axios from 'axios';
import fs from 'fs';
import https from 'https';
import { pipeline } from 'stream/promises';
import FormData from 'form-data';
import { login, accessToken } from './add_book_by_id.mjs';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';
const TARGET_DB_ID = 338;
const NEW_GOOGLE_ID = 'VEz1zQEACAAJ';

async function getGoogleBook(id) {
    console.log(`🔍 Fetching Google Books data for ${id}...`);
    const res = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`);
    const info = res.data.volumeInfo;

    let img = info.imageLinks?.extraLarge ||
        info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.thumbnail;

    if (img) {
        img = img.replace('http://', 'https://').replace(/&zoom=\d/, '').replace(/&edge=curl/, '');
    }

    return {
        id: res.data.id,
        imageUrl: img,
        title: info.title,
        authors: info.authors, // Array
        pageCount: info.pageCount
    };
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
    const fileBuffer = fs.readFileSync(filepath);
    formData.append('files[]', fileBuffer, {
        filename: 'cover.jpg',
        contentType: 'image/jpeg'
    });

    const res = await axios.post(`${ML_API_BASE}/api/media`, formData, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    if (!res.data.success || !res.data.data.items || res.data.data.items.length === 0) {
        throw new Error('Upload successful but no URL returned');
    }
    return res.data.data.items[0].url;
}

async function deleteAndAddBook(id, googleId, imageUrl, metadata) {
    console.log(`🗑️ Deleting old Book ${id}...`);
    try {
        await axios.delete(`${ML_API_BASE}/api/library/books/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        console.log('   ✅ Deleted');
    } catch (e) {
        console.log('   Warning: Delete failed (maybe already gone?):', e.message);
    }

    console.log(`➕ Adding new Book (Google ID: ${googleId})...`);
    // Construct payload for POST (Add) - usually works better
    const payload = {
        google_books_id: googleId,
        title: metadata.title,
        authors: metadata.authors ? metadata.authors.join(', ') : null,
        cover_image_cdn: imageUrl, // Use our local URL immediately!
        page_count: metadata.pageCount,
        overview: metadata.description || '', // Google often has description
        published_date: metadata.publishedDate,
        status: 'read',
        my_rating: 10, // Preserve rating? Assuming 10 for HP
        completed_date: new Date().toISOString().split('T')[0]
    };

    const res = await axios.post(`${ML_API_BASE}/api/library/books`, payload, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (res.data.success) {
        console.log(`   ✅ Added new book! New ID: ${res.data.data.id}`);
    } else {
        throw new Error('Add failed: ' + JSON.stringify(res.data));
    }
}

async function main() {
    try {
        await login();

        const bookData = await getGoogleBook(NEW_GOOGLE_ID);
        console.log(`   Found: ${bookData.title} (${bookData.imageUrl ? 'Has Image' : 'No Image'})`);

        if (!bookData.imageUrl) {
            throw new Error('Target Google Book has no image!');
        }

        const tempFile = `temp_overwrite_${TARGET_DB_ID}.jpg`;
        await downloadImage(bookData.imageUrl, tempFile);
        console.log(`   ⬇️ Downloaded image`);

        const localUrl = await uploadImage(tempFile);
        console.log(`   ⬆️ Uploaded to local: ${localUrl}`);

        await deleteAndAddBook(TARGET_DB_ID, NEW_GOOGLE_ID, localUrl, bookData);
        console.log(`   ✅ Successfully replaced Book ${TARGET_DB_ID} (ID changed)`);

        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

    } catch (error) {
        console.error('💥 Error:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

main();
