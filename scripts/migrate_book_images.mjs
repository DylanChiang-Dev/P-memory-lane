import { login, accessToken } from './add_book_by_id.mjs';
import FormData from 'form-data';
import fs from 'fs';
import https from 'https';
import { pipeline } from 'stream/promises';
import axios from 'axios';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';
const TARGET_IDS = [338, 339, 340, 341, 342, 343, 344];

// Helper to download image
async function downloadImage(url, filepath) {
    const res = await new Promise((resolve, reject) => {
        https.get(url, resolve).on('error', reject);
    });

    if (res.statusCode !== 200) {
        throw new Error(`Failed to download image: ${res.statusCode}`);
    }

    await pipeline(res, fs.createWriteStream(filepath));
}

async function uploadImage(filepath) {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filepath);
    formData.append('files[]', fileBuffer, {
        filename: 'cover.jpg',
        contentType: 'image/jpeg'
    });

    try {
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
    } catch (error) {
        if (error.response) {
            throw new Error(`Upload failed (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

async function updateBook(id, newImageUrl) {
    const res = await fetch(`${ML_API_BASE}/api/library/books/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            cover_image_cdn: newImageUrl // Update the CDN field with our new persistent URL
        })
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error(`Update failed: ${data.error || 'Unknown error'}`);
    }
}

async function main() {
    console.log('🚀 Starting Image Migration...');

    try {
        await login();

        for (const id of TARGET_IDS) {
            console.log(`\nProcessing Book ID ${id}...`);

            // 1. Get current details to find image URL
            const getRes = await fetch(`${ML_API_BASE}/api/library/books/${id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const bookData = await getRes.json();

            if (!bookData.success) {
                console.error(`❌ Failed to fetch book ${id}`);
                continue;
            }

            const currentUrl = bookData.data.cover_image_cdn;
            if (!currentUrl || !currentUrl.includes('google')) {
                console.log('ℹ️  Skipping (No Google image found)');
                continue;
            }

            console.log(`   Downloading: ${currentUrl.substring(0, 50)}...`);
            const tempFile = `temp_${id}.jpg`;

            try {
                // 2. Download
                await downloadImage(currentUrl, tempFile);

                // 3. Upload
                console.log('   Uploading to local storage...');
                const newUrl = await uploadImage(tempFile);
                console.log(`   New URL: ${newUrl}`);

                // 4. Update
                await updateBook(id, newUrl);
                console.log('✅ Updated successfully');

            } catch (err) {
                console.error(`❌ Error processing ${id}:`, err.message);
            } finally {
                // Cleanup
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            }

            // Sleep to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (error) {
        console.error('\n💥 Critical Error:', error.message);
    }
}

main();
