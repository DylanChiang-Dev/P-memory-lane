import { login, accessToken } from './add_book_by_id.mjs';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';

async function main() {
    await login();
    // Fetch skipped IDs
    for (const id of [340, 344]) {
        console.log(`\n--- Book ${id} ---`);
        const res = await fetch(`${ML_API_BASE}/api/library/books/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    }
}

main();
