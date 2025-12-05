// TV Show Migration Script: WordPress -> New Backend
// 1. Fetch TV shows from WordPress
// 2. Search TMDB for each title to get tmdb_id
// 3. POST to new backend API

const ACCESS_TOKEN = process.argv[2];
const TMDB_KEY = process.argv[3];

if (!ACCESS_TOKEN || !TMDB_KEY) {
    console.error('Usage: node migrate_tv_shows.mjs ACCESS_TOKEN TMDB_API_KEY');
    process.exit(1);
}

const WP_API = 'https://blog.3331322.xyz/wp-json/wp/v2';
const NEW_API = 'http://localhost:4321/api/library';


async function fetchWordPressTVShows() {
    console.log('📺 Fetching TV shows from WordPress...');
    const allShows = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${WP_API}/tvshow_review?per_page=100&page=${page}`;
        const res = await fetch(url);

        if (!res.ok) {
            if (res.status === 400) {
                hasMore = false;
            } else {
                throw new Error(`WP API error: ${res.status}`);
            }
        } else {
            const items = await res.json();
            if (items.length === 0) {
                hasMore = false;
            } else {
                allShows.push(...items);
                console.log(`  Page ${page}: ${items.length} shows (total: ${allShows.length})`);
                page++;
            }
        }
    }

    return allShows;
}

async function getWPMediaUrl(mediaId) {
    if (!mediaId) return null;
    try {
        const res = await fetch(`${WP_API}/media/${mediaId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.source_url || null;
    } catch {
        return null;
    }
}

async function searchTMDB(title) {
    // Clean title for better search
    const cleanTitle = title
        .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Remove special chars but keep unicode letters
        .replace(/\s+/g, ' ')
        .trim();

    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanTitle)}&language=zh-TW`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            return data.results[0]; // Return first match
        }
        return null;
    } catch {
        return null;
    }
}

async function getTMDBDetails(tmdbId) {
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_KEY}&language=zh-TW`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function createTVShowInNewAPI(showData) {
    try {
        const res = await fetch(`${NEW_API}/tv-shows`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(showData)
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`    API error: ${res.status} - ${text.substring(0, 200)}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error(`    Network error: ${err.message}`);
        return false;
    }
}

async function migrateShow(wpShow) {
    const title = wpShow.title?.rendered || '';
    console.log(`\n📺 Processing: ${title}`);

    // 1. Search TMDB
    const tmdbResult = await searchTMDB(title);
    await sleep(100); // Rate limiting

    if (!tmdbResult) {
        console.log(`  ❌ Not found in TMDB, skipping`);
        return { status: 'not_found', title };
    }

    console.log(`  ✅ TMDB match: ${tmdbResult.name} (ID: ${tmdbResult.id})`);

    // 2. Get full TMDB details
    const details = await getTMDBDetails(tmdbResult.id);
    await sleep(100);

    if (!details) {
        console.log(`  ⚠️ Could not get TMDB details`);
        return { status: 'no_details', title };
    }

    // 3. Get WP cover image (fallback)
    // const wpCover = await getWPMediaUrl(wpShow.featured_media);

    // 4. Build payload for new API
    const payload = {
        // TMDB ID
        tmdb_id: tmdbResult.id,

        // Metadata from TMDB
        title: details.name || tmdbResult.name,
        original_title: details.original_name,
        cover_image_cdn: details.poster_path
            ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
            : null,
        backdrop_image_cdn: details.backdrop_path
            ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
            : null,
        overview: details.overview || '',
        genres: details.genres?.map(g => g.name) || [],
        external_rating: details.vote_average,
        release_date: details.first_air_date,

        // TV-specific fields
        number_of_seasons: details.number_of_seasons,
        number_of_episodes: details.number_of_episodes,

        // User data (default values)
        status: 'watched',
        my_rating: 0,
        completed_date: wpShow.date?.split('T')[0] || new Date().toISOString().split('T')[0]
    };

    // 5. Create in new API
    const success = await createTVShowInNewAPI(payload);

    if (success) {
        console.log(`  ✅ Created in new API`);
        return { status: 'success', title };
    } else {
        return { status: 'api_error', title };
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🚀 TV Show Migration Script');
    console.log('===========================\n');

    // 1. Fetch all WP shows
    const wpShows = await fetchWordPressTVShows();
    console.log(`\n📊 Total WordPress TV shows: ${wpShows.length}\n`);

    // 2. Migrate each show
    const results = {
        success: [],
        not_found: [],
        no_details: [],
        api_error: []
    };

    for (let i = 0; i < wpShows.length; i++) {
        console.log(`\n[${i + 1}/${wpShows.length}]`);
        const result = await migrateShow(wpShows[i]);
        results[result.status].push(result.title);

        // Progress every 10
        if ((i + 1) % 10 === 0) {
            console.log(`\n⏳ Progress: ${i + 1}/${wpShows.length} (${Math.round((i + 1) / wpShows.length * 100)}%)`);
        }

        // Rate limiting
        await sleep(200);
    }

    // 3. Summary
    console.log('\n\n========================================');
    console.log('📊 MIGRATION SUMMARY');
    console.log('========================================');
    console.log(`✅ Success:     ${results.success.length}`);
    console.log(`❌ Not found:   ${results.not_found.length}`);
    console.log(`⚠️ No details:  ${results.no_details.length}`);
    console.log(`🔴 API errors:  ${results.api_error.length}`);

    if (results.not_found.length > 0) {
        console.log('\n📋 Not found in TMDB:');
        results.not_found.forEach(t => console.log(`  - ${t}`));
    }

    if (results.api_error.length > 0) {
        console.log('\n📋 API errors:');
        results.api_error.forEach(t => console.log(`  - ${t}`));
    }
}

main().catch(console.error);
