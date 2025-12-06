import axios from 'axios';
import fs from 'fs';
import https from 'https';
import { pipeline } from 'stream/promises';
import FormData from 'form-data';
import { login, accessToken } from './add_book_by_id.mjs';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';

const TASKS = [
    { dbId: 340, query: '哈利波特 阿茲卡班的逃犯', targetId: 'bfZDzgEACAAJ' },
    { dbId: 344, query: '哈利波特 死神的聖物', targetId: 'BhRMAQAAIAAJ' }
];

async function getGoogleBook(id) {
    const res = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`);
    const info = res.data.volumeInfo;
    let img = info.imageLinks?.extraLarge ||
        info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.thumbnail;

    if (img) {
        img = img.replace('http://', 'https://').replace(/&zoom=\d/, '').replace(/&edge=curl/, '');
    }
    return { id: res.data.id, imageUrl: img };
}

async function searchWithImage(query) {
    console.log(`🔍 Searching for: ${query}...`);
    const res = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
        params: {
            q: `intitle:${query}`,
            langRestrict: 'zh-TW',
            printType: 'books',
            maxResults: 10
        }
    });

    if (!res.data.items) return null;

    for (const item of res.data.items) {
        if (item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail) {
            console.log(`   ✅ Found alternative with image: ${item.id} (${item.volumeInfo.title})`);

            let img = item.volumeInfo.imageLinks.extraLarge ||
                item.volumeInfo.imageLinks.large ||
                item.volumeInfo.imageLinks.medium ||
                item.volumeInfo.imageLinks.thumbnail;

            if (img) {
                img = img.replace('http://', 'https://').replace(/&zoom=\d/, '').replace(/&edge=curl/, '');
            }
            return { id: item.id, imageUrl: img };
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

async function updateBook(id, googleId, imageUrl) {
    console.log(`📝 Updating Book ${id} with new GoogleID ${googleId} and Image...`);
    await axios.put(`${ML_API_BASE}/api/library/books/${id}`, {
        google_books_id: googleId,
        cover_image_cdn: imageUrl
    }, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
}

async function main() {
    await login();

    for (const task of TASKS) {
        try {
            console.log(`Processing ${task.query} (ID: ${task.targetId})...`);
            const found = await getGoogleBook(task.targetId);

            if (!found || !found.imageUrl) {
                console.log(`❌ No image found for ${task.targetId}`);
                continue;
            }

            // If found ID is same as original ID (and we know original has no image), that's weird but possible if API changed?
            // But here we filtered for `imageLinks`.

            const tempFile = `temp_fix_${task.dbId}.jpg`;
            await downloadImage(found.imageUrl, tempFile);
            console.log(`   ⬇️ Downloaded image`);

            const localUrl = await uploadImage(tempFile);
            console.log(`   ⬆️ Uploaded to local: ${localUrl}`);

            await updateBook(task.dbId, found.id, localUrl);
            console.log(`   ✅ Fixed Book ${task.dbId}`);

            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

            // Sleep
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.error(`💥 Failed for ${task.dbId}:`, error.message);
            if (error.response) console.error(error.response.data);
        }
    }
}

main();
