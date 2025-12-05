import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const WP_LOGIN_URL = 'https://blog.3331322.xyz/wp-login.php';
const MOVIE_LIST_BASE_URL = 'https://blog.3331322.xyz/index.php/movie/page/';
const OUTPUT_FILE = 'movies_migration.json';
const TOTAL_PAGES = 81;
const CONCURRENCY_LIMIT = 10;

// Credentials
const USERNAME = 'Dylan.Chiang';
const PASSWORD = 'ca123456789';

async function getCookies() {
    console.log('Launching browser to login...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        await page.goto(WP_LOGIN_URL, { waitUntil: 'networkidle0' });

        console.log('Entering credentials...');
        await page.type('#user_login', USERNAME);
        await page.type('#user_pass', PASSWORD);

        await Promise.all([
            page.click('#wp-submit'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);

        console.log('Login successful. Retrieving cookies...');
        const cookies = await page.cookies();
        await browser.close();

        // Convert to cookie string for axios
        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
    } catch (error) {
        console.error('Login failed:', error);
        await browser.close();
        throw error;
    }
}

async function scrapeListPage(pageUrl, cookieHeader) {
    try {
        const response = await axios.get(pageUrl, {
            headers: {
                'Cookie': cookieHeader,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const movieLinks = [];

        // Selector based on the list page HTML structure we saw earlier
        // The list items seemed to be in a grid. We need to find the links to /film_review/
        $('a[href*="/film_review/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !movieLinks.includes(href)) {
                movieLinks.push(href);
            }
        });

        return movieLinks;
    } catch (error) {
        console.error(`Failed to scrape list page ${pageUrl}:`, error.message);
        return [];
    }
}

async function scrapeMovieDetail(url, cookieHeader) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Cookie': cookieHeader,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);

        const title = $('h1').first().text().trim() || $('title').text().split('–')[0].trim();

        // Rating
        let rating = 0;
        const ratingText = $('span:contains(".")').filter((i, el) => /^\d\.\d$/.test($(el).text().trim())).first().text().trim();
        if (ratingText) rating = parseFloat(ratingText);

        // Date
        let watchedDate = '';
        const dateText = $('body').text().match(/\d{4}-\d{2}-\d{2}/);
        if (dateText) watchedDate = dateText[0];

        // Content/Review
        let review = '';
        const contentEl = $('.entry-content, .post-content, .article-content').first();
        if (contentEl.length) {
            // Remove known metadata lines
            contentEl.find('.sharedaddy, .jp-relatedposts').remove();
            review = contentEl.text().trim();
            // Clean up common prefixes
            review = review.replace(/Dylan\.Chiang\s+\d{4}-\d{2}-\d{2}\s+标记为“看过”/g, '').trim();
            review = review.replace(/^\s*[\r\n]+\s*/g, '');
        } else {
            review = $('body').text().trim().substring(0, 200) + '...';
        }

        // Poster
        let posterUrl = '';
        // Priority 1: wp-post-image
        const featuredImg = $('.wp-post-image').first();
        if (featuredImg.length) {
            posterUrl = featuredImg.attr('src');
        } else {
            // Priority 2: First image in content that is NOT a gravatar or emoji
            const contentImg = $('.entry-content img, .post-content img').not('[src*="gravatar"]').not('[src*="emoji"]').first();
            if (contentImg.length) {
                posterUrl = contentImg.attr('src');
            }
        }

        return {
            url,
            title,
            rating,
            watchedDate,
            review,
            posterUrl
        };
    } catch (error) {
        console.error(`Failed to scrape detail ${url}:`, error.message);
        return null;
    }
}

async function main() {
    try {
        const cookieHeader = await getCookies();
        console.log('Cookies retrieved. Starting scrape...');

        // 1. Load existing data
        let existingMovies = [];
        try {
            const raw = await fs.readFile(OUTPUT_FILE, 'utf-8');
            existingMovies = JSON.parse(raw);
            console.log(`Loaded ${existingMovies.length} existing movies.`);
        } catch (e) {
            console.log('No existing data found, starting fresh.');
        }
        const existingUrls = new Set(existingMovies.map(m => m.url));

        // 2. Get all links
        let allMovieLinks = [];
        console.log(`Scraping ${TOTAL_PAGES} list pages...`);
        for (let i = 1; i <= TOTAL_PAGES; i++) {
            const pageUrl = `${MOVIE_LIST_BASE_URL}${i}/`;
            // console.log(`Scraping list page ${i}/${TOTAL_PAGES}...`);
            try {
                const links = await scrapeListPage(pageUrl, cookieHeader);
                allMovieLinks = [...allMovieLinks, ...links];
            } catch (e) {
                console.error(`Failed to scrape list page ${i}: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, 200)); // Small delay for list pages
        }

        allMovieLinks = [...new Set(allMovieLinks)];
        console.log(`Found ${allMovieLinks.length} unique movie links.`);

        // 3. Identify missing links
        const linksToScrape = allMovieLinks.filter(url => !existingUrls.has(url));
        console.log(`Found ${linksToScrape.length} new movies to scrape.`);

        if (linksToScrape.length === 0) {
            console.log('All movies already scraped.');
            return;
        }

        // 4. Scrape missing items sequentially (Concurrency 1 to be safe)
        const newMovies = [];
        let processed = 0;

        for (const url of linksToScrape) {
            const movie = await scrapeMovieDetail(url, cookieHeader);
            if (movie) {
                newMovies.push(movie);
                existingMovies.push(movie); // Add to main list immediately
            }
            processed++;

            // Save periodically every 10 items
            if (processed % 10 === 0) {
                console.log(`Processed ${processed}/${linksToScrape.length}...`);
                await fs.writeFile(OUTPUT_FILE, JSON.stringify(existingMovies, null, 2));
            }

            // Wait 2 seconds between requests to avoid 520 errors
            await new Promise(r => setTimeout(r, 2000));
        }

        // Final save
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(existingMovies, null, 2));
        console.log(`Done! Total movies saved: ${existingMovies.length}`);

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

main();
