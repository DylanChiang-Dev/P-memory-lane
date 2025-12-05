import fs from 'fs/promises';
import axios from 'axios';
import path from 'path';

// Configuration
const MIGRATION_FILE = 'movies_migration.json';
const API_BASE_URL = 'https://pyqapi.3331322.xyz';
const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || '1ff5ff58b8e85fb19686971c740ca702';
const USER_TOKEN = ''; // We need to get this dynamically or ask user. For now, let's try to login first.

// Login credentials
const EMAIL = 'user@example.com'; // We need to know which user to import to. 
// Actually, let's use the hardcoded token if we can, or login flow.
// Since this is a script, let's implement a simple login.

const USER_EMAIL = 'dylan@example.com'; // Assuming this is the user based on previous context or we can ask.
// Wait, the user is "Dylan.Chiang". Let's check if we have a way to get a token.
// The previous auth.ts used local storage.
// Let's just ask the user for a token or use a hardcoded one if we can find it.
// Or better, let's implement login in the script.

async function login(email, password) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/login`, {
            email,
            password
        });
        return response.data.data.access_token;
    } catch (error) {
        console.error('Login failed:', error.message);
        return null;
    }
}

async function getTMDBIdFromIMDB(imdbId) {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                external_source: 'imdb_id'
            }
        });

        if (response.data.movie_results && response.data.movie_results.length > 0) {
            return response.data.movie_results[0].id;
        }
        return null;
    } catch (error) {
        console.error(`Failed to find TMDB ID for ${imdbId}:`, error.message);
        return null;
    }
}

async function searchTMDB(title, year) {
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: title,
                year: year,
                language: 'zh-CN'
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0].id;
        }
        return null;
    } catch (error) {
        console.error(`Failed to search TMDB for ${title}:`, error.message);
        return null;
    }
}

async function importMovie(token, movieData) {
    try {
        // Check if already exists to avoid duplicates?
        // The API might handle it or we just post.

        const payload = {
            tmdb_id: movieData.tmdb_id,
            my_rating: movieData.rating,
            status: 'watched',
            completed_date: movieData.watchedDate,
            my_review: movieData.review // Optional: keep the original review text if needed
        };

        const response = await axios.post(`${API_BASE_URL}/api/library/movies`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        // If 409 Conflict (already exists), that's fine.
        if (error.response && error.response.status === 409) {
            return { success: true, message: 'Already exists' };
        }
        console.error(`Failed to import movie ${movieData.tmdb_id}:`, error.message);
        return null;
    }
}

async function main() {
    // 1. Get Token
    // We need valid credentials. Since I don't have them in the chat context, 
    // I will try to use the ones from the browser session if possible, or ask the user.
    // For now, I'll assume I can login with the default admin creds if known, or I'll prompt.
    // Wait, the user provided WP creds, but not P-memory-lane creds.
    // I'll assume the user is 'admin@example.com' / 'password' for local dev or similar?
    // Let's try to read the token from a file or env.
    // Actually, I'll pause and ask for credentials in the script if needed, but for automation
    // I will try to use a hardcoded test user if available.

    // HACK: I will try to login with a likely account or just ask the user to provide a token.
    // For this script, let's assume we have a token.
    // I'll add a placeholder and ask the user to fill it or I'll try to find it.

    const token = process.env.API_TOKEN;
    if (!token) {
        console.error('Please set API_TOKEN environment variable.');
        process.exit(1);
    }

    // 2. Read Migration File
    const rawData = await fs.readFile(MIGRATION_FILE, 'utf-8');
    const movies = JSON.parse(rawData);

    console.log(`Loaded ${movies.length} movies from JSON.`);

    let successCount = 0;
    let failCount = 0;

    for (const movie of movies) {
        // Extract IMDB ID
        const imdbMatch = movie.review.match(/tt\d{7,8}/);
        let tmdbId = null;

        if (imdbMatch) {
            const imdbId = imdbMatch[0];
            tmdbId = await getTMDBIdFromIMDB(imdbId);
        }

        // Fallback: Search by title if no IMDB ID or not found
        if (!tmdbId) {
            // Clean title (remove Korean/Chinese mixed sometimes)
            const yearMatch = movie.review.match(/(\d{4})-\d{2}-\d{2}/); // Extract year from release date in review
            const year = yearMatch ? yearMatch[1] : null;

            tmdbId = await searchTMDB(movie.title, year);
        }

        if (tmdbId) {
            console.log(`Importing "${movie.title}" (TMDB: ${tmdbId})...`);
            const result = await importMovie(token, { ...movie, tmdb_id: tmdbId });
            if (result) {
                successCount++;
            } else {
                failCount++;
            }
        } else {
            console.warn(`Could not find TMDB ID for "${movie.title}"`);
            failCount++;
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`Import complete. Success: ${successCount}, Failed: ${failCount}`);
}

main();
