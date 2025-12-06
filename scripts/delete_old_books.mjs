import { login, accessToken } from './add_book_by_id.mjs';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';
const idsToDelete = [334, 335, 336, 337];

async function main() {
    await login();
    for (const id of idsToDelete) {
        console.log(`Deleting ID ${id}...`);
        const res = await fetch(`${ML_API_BASE}/api/library/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        console.log(`ID ${id}:`, data.success ? 'Deleted' : data);
    }
}

main();
