import { login, getGoogleBookDetails, transformGoogleBook, addBook } from './add_book_by_id.mjs';

const hpIds = [
    'VEz1zQEACAAJ', // Book 1: 神秘的魔法石
    'Dh_moAEACAAJ', // Book 2: 消失的密室
    'rRGcAAAACAAJ', // Book 3: 阿茲卡班的逃犯
    'QR-0AAAACAAJ', // Book 4: 火盃的考驗
    '0djAxQEACAAJ', // Book 5: 鳳凰會的密令
    'vXT5wAEACAAJ', // Book 6: 混血王子的背叛
    '7paM0AEACAAJ'  // Book 7: 死神的聖物
];

async function main() {
    console.log('🚀 Starting batch add for Harry Potter series...\n');

    try {
        // Login ONCE
        await login();

        for (const id of hpIds) {
            try {
                // Wait a bit to be nice to Google Books API
                await new Promise(r => setTimeout(r, 1000));

                const googleBook = await getGoogleBookDetails(id);
                const bookData = transformGoogleBook(googleBook);

                // Add to Memory Lane
                await addBook(bookData);
                console.log(`✅ Success: ${bookData.title}`);
            } catch (err) {
                console.error(`❌ Failed for ID ${id}: ${err.message}`);
            }
            console.log('-------------------');
        }

        console.log('\n✨ Batch process complete!');

    } catch (error) {
        console.error('\n💥 Critical Error:', error.message);
    }
}

main();
