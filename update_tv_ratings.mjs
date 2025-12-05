// Scrape TV Show Ratings from WordPress HTML pages and update in new API

const ACCESS_TOKEN = process.argv[2];
const TMDB_KEY = process.argv[3];

if (!ACCESS_TOKEN || !TMDB_KEY) {
    console.error('Usage: node update_tv_ratings.mjs ACCESS_TOKEN TMDB_API_KEY');
    process.exit(1);
}

const WP_BASE = 'https://blog.3331322.xyz/index.php/tvdrama/';
const NEW_API = 'http://localhost:4321/api/library';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Scrape ratings from WordPress page
async function scrapeRatingsFromPage(pageNum) {
    const url = pageNum === 1 ? WP_BASE : `${WP_BASE}page/${pageNum}/`;
    console.log(`  Fetching page ${pageNum}: ${url}`);

    try {
        const res = await fetch(url);
        if (!res.ok) return [];

        const html = await res.text();
        const ratings = [];

        // Pattern: data-value="81" ... <h6 class="review">Title</h6>
        // Match card sections with rating and title
        const cardPattern = /data-value="(\d+)"[\s\S]*?<h6 class="review">([^<]+)<\/h6>/g;
        let match;

        while ((match = cardPattern.exec(html)) !== null) {
            const ratingValue = parseInt(match[1]);
            const rating = ratingValue / 10; // 81 -> 8.1
            const title = match[2].trim();

            if (rating >= 0 && rating <= 10 && title.length > 0) {
                ratings.push({ rating, title });
            }
        }

        return ratings;
    } catch (err) {
        console.error(`  Error fetching page ${pageNum}: ${err.message}`);
        return [];
    }
}

// Search TMDB to get ID 
async function searchTMDB(title) {
    const cleanTitle = title.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanTitle)}&language=zh-TW`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.results?.[0]?.id || null;
    } catch {
        return null;
    }
}

// Get TV show from new API by TMDB ID
async function getTVShowByTmdbId(tmdbId) {
    try {
        // We'll need to search through all TV shows
        const res = await fetch(`${NEW_API}/tv-shows?limit=300`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.items?.find(item => item.tmdb_id === tmdbId);
    } catch {
        return null;
    }
}

// Update TV show rating
async function updateRating(tvShowId, rating) {
    try {
        const res = await fetch(`${NEW_API}/tv-shows/${tvShowId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ my_rating: rating })
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function main() {
    console.log('🎬 TV Show Rating Update Script');
    console.log('================================\n');

    // First, scrape all ratings from WordPress pages
    console.log('📖 Scraping ratings from WordPress...');
    const allRatings = [];

    for (let page = 1; page <= 30; page++) {
        const pageRatings = await scrapeRatingsFromPage(page);
        if (pageRatings.length === 0 && page > 1) break;
        allRatings.push(...pageRatings);
        await sleep(200);
    }

    console.log(`\n📊 Found ${allRatings.length} ratings\n`);

    // Show first few
    console.log('Sample ratings:');
    allRatings.slice(0, 5).forEach(r => console.log(`  ${r.title}: ${r.rating}`));
    console.log('');

    // Get all TV shows from new API
    console.log('📺 Fetching TV shows from new API...');
    const res = await fetch(`${NEW_API}/tv-shows?limit=300`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });

    if (!res.ok) {
        console.error('Failed to fetch TV shows from new API');
        process.exit(1);
    }

    const data = await res.json();
    const tvShows = data.data?.items || [];
    console.log(`Found ${tvShows.length} TV shows in new API\n`);

    // Match and update
    let updated = 0;
    let notFound = 0;

    for (const ratingData of allRatings) {
        // Find matching TV show by title (approximate match)
        const normalizedTitle = ratingData.title.toLowerCase().trim();

        const match = tvShows.find(show => {
            const showTitle = (show.title || '').toLowerCase();
            const showOriginal = (show.original_title || '').toLowerCase();
            return showTitle.includes(normalizedTitle) ||
                normalizedTitle.includes(showTitle) ||
                showOriginal.includes(normalizedTitle) ||
                normalizedTitle.includes(showOriginal);
        });

        if (match) {
            const success = await updateRating(match.id, ratingData.rating);
            if (success) {
                console.log(`✅ Updated: ${match.title} -> ${ratingData.rating}`);
                updated++;
            }
        } else {
            console.log(`❌ Not found: ${ratingData.title}`);
            notFound++;
        }

        await sleep(100);
    }

    console.log('\n========================================');
    console.log('📊 UPDATE SUMMARY');
    console.log('========================================');
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Not found: ${notFound}`);
}

main().catch(console.error);
