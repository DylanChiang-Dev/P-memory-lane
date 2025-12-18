#!/usr/bin/env node
/**
 * Generic Activity Clearing Script
 * 
 * Usage: node scripts/clear_activity_data.mjs <type> <start_date> <end_date>
 * Example: node scripts/clear_activity_data.mjs exercise 2024-01-01 2025-12-31
 */

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL;
const ML_PASSWORD = process.env.ML_PASSWORD;

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node scripts/clear_activity_data.mjs <type> <start_date> <end_date>');
    process.exit(1);
}

const TYPE = args[0];
const START_DATE = new Date(args[1]);
const END_DATE = new Date(args[2]);

let accessToken = null;

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function daysBetween(start, end) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((end - start) / oneDay) + 1;
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

async function submitZero(date) {
    const payload = {
        activity_type: TYPE,
        activity_date: date,
        notes: ''
    };

    if (TYPE === 'exercise') {
        payload.duration_minutes = 0;
        payload.intensity = 'low';
    } else if (TYPE === 'reading') {
        payload.pages_read = 0;
        payload.duration_minutes = 0;
    } else if (TYPE === 'duolingo') {
        payload.xp_earned = 0;
    }

    const response = await fetch(`${ML_API_BASE}/api/activities/checkin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(`${date} failed: ${data.message}`);
    return data;
}

async function main() {
    const days = daysBetween(START_DATE, END_DATE);
    console.log(`🧹 Clearing ${TYPE} records from ${formatDate(START_DATE)} to ${formatDate(END_DATE)} (${days} days)...`);

    try {
        await login();
        for (let i = 0; i < days; i++) {
            const date = formatDate(addDays(START_DATE, i));
            await submitZero(date);
            process.stdout.write('.');
            if ((i + 1) % 50 === 0) console.log(` ${i + 1}/${days}`);
            await new Promise(r => setTimeout(r, 50));
        }
        console.log('\n\n✅ Clear complete!');
    } catch (e) {
        console.error(`\n💥 Error: ${e.message}`);
    }
}

main();
