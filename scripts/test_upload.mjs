import { login, accessToken } from './add_book_by_id.mjs';
import FormData from 'form-data';
import fs from 'fs';
import https from 'https';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';
const TEST_IMAGE_URL = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png';
const TEMP_FILE = 'test_upload_logo.png';

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function uploadImage(filepath) {
    const formData = new FormData();
    // Try single 'file' or just 'image'
    formData.append('file', fs.createReadStream(filepath));

    try {
        // Need to use axios or special fetch setup for FormData in Node
        // Using form-data's submit method or custom fetch headers
        // Let's use fetch with formData (Node 18+ supports it, but form-data package helps with streams)
        // Actually, simple fetch with standard FormData if available, but Node's native FormData is tricky with streams in older versions.
        // We'll trust standard fetch here if node is recent, or construct headers manually.

        // Simpler: use basic fetch with the form-data package headers
        const response = await fetch(`${ML_API_BASE}/api/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Upload failed:', error);
        return { success: false, error: error.message };
    }
}

async function main() {
    await login();
    console.log('Downloading test image...');
    await downloadImage(TEST_IMAGE_URL, TEMP_FILE);

    console.log('Uploading to API...');
    const result = await uploadImage(TEMP_FILE);
    console.log('Upload Result:', JSON.stringify(result, null, 2));

    // Cleanup
    if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE);
}

main();
