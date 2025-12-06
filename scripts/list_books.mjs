import { login, accessToken } from './add_book_by_id.mjs';

const ML_API_BASE = 'https://pyqapi.3331322.xyz';

async function main() {
    await login();
    const res = await fetch(`${ML_API_BASE}/api/library/books?limit=100`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await res.json();
    if (data.success) {
        data.data.items.forEach(b => {
            console.log(`${b.id} | ${b.title}`);
        });
    } else {
        console.log(data);
    }
}

main();
