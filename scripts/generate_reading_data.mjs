#!/usr/bin/env node
/**
 * Generate Reading Data Migration Script
 * 
 * Generates and submits daily reading records from 2025-01-01 to 2025-02-03.
 * Total pages: 340.
 */

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL;
const ML_PASSWORD = process.env.ML_PASSWORD;

// Configuration
const START_DATE = new Date('2025-01-01');
const END_DATE = new Date('2025-02-03');
const TOTAL_PAGES = 340;

let accessToken = null;

function daysBetween(start, end) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((end - start) / oneDay) + 1;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function generateDailyReading() {
    const days = daysBetween(START_DATE, END_DATE);
    const avgPages = Math.round(TOTAL_PAGES / days);

    console.log(`📊 Generating Reading distribution:`);
    console.log(`   Days: ${days}`);
    console.log(`   Total Pages: ${TOTAL_PAGES}`);
    console.log(`   Avg Pages/day: ${avgPages}\n`);

    const pageRecords = [];
    // Initialize with 0
    for (let i = 0; i < days; i++) {
        pageRecords.push(0);
    }

    let remaining = TOTAL_PAGES;
    let daysHandled = 0;

    // Distribute pages randomly but favoring non-zero days
    while (remaining > 0) {
        const idx = Math.floor(Math.random() * days);
        // 10-20% chance to skip a day (reading habit often has gaps)
        if (Math.random() > 0.15) {
            const add = Math.min(remaining, Math.floor(Math.random() * 15) + 5);
            pageRecords[idx] += add;
            remaining -= add;
        }
    }

    const records = pageRecords.map((pages, i) => ({
        date: formatDate(addDays(START_DATE, i)),
        pages: pages
    })).filter(r => r.pages > 0); // Only submit days with reading

    console.log(`✅ Generated ${records.length} active reading days`);
    return records;
}

async function login() {
    if (process.env.ML_ACCESS_TOKEN) {
        accessToken = process.env.ML_ACCESS_TOKEN;
        return;
    }
    if (!ML_EMAIL || !ML_PASSWORD) {
        throw new Error('Missing credentials: set ML_EMAIL and ML_PASSWORD.');
    }
    const response = await fetch(`${ML_API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ML_EMAIL, password: ML_PASSWORD })
    });
    const data = await response.json();
    if (!data.success) throw new Error(`Login failed: ${data.message}`);
    accessToken = data.data.access_token;
}

async function submitCheckin(record) {
    const payload = {
        activity_type: 'reading',
        activity_date: record.date,
        pages_read: record.pages,
        duration_minutes: record.pages * 1.5 // Rough estimation of time
    };
    const response = await fetch(`${ML_API_BASE}/api/activities/checkin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(`${record.date} failed: ${data.message}`);
    return data;
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const records = generateDailyReading();

    if (dryRun) {
        console.log('\n📋 Preview:');
        records.forEach(r => console.log(`   ${r.date}: ${r.pages} pages`));
        console.log(`\nTotal: ${records.reduce((sum, r) => sum + r.pages, 0)} pages`);
        return;
    }

    try {
        await login();
        console.log(`\n📤 Submitting ${records.length} records...`);
        for (const record of records) {
            await submitCheckin(record);
            process.stdout.write('.');
            await new Promise(r => setTimeout(r, 100));
        }
        console.log('\n\n✅ Done!');
    } catch (e) {
        console.error(`\n💥 Error: ${e.message}`);
    }
}

main();
