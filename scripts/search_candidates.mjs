import axios from 'axios';

async function search(query) {
    console.log(`\n🔍 Results for "${query}":`);
    const res = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
        params: {
            q: query, // Broad query
            langRestrict: 'zh-TW',
            printType: 'books',
            maxResults: 5
        }
    });

    if (!res.data.items) {
        console.log('No results.');
        return;
    }

    res.data.items.forEach(item => {
        const info = item.volumeInfo;
        const hasImage = info.imageLinks && info.imageLinks.thumbnail;
        console.log(`ID: ${item.id} | Title: ${info.title} | Sub: ${info.subtitle || ''} | Image: ${hasImage ? '✅' : '❌'}`);
    });
}

async function main() {
    // Book 3 - Found one, verify?
    // await search('intitle:哈利波特 intitle:阿茲卡班的逃犯');

    // Book 7 - Try more
    await search('intitle:哈利波特 intitle:死神的聖物');
    await search('intitle:死神的聖物');
    await search('intitle:Harry Potter intitle:Deathly Hallows langRestrict:zh-TW');
}

main();
