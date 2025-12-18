#!/usr/bin/env node
/**
 * Clear Reading Data Migration Script
 * 
 * Sends 0 pages for daily reading records between two dates.
 */

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL;
const ML_PASSWORD = process.env.ML_PASSWORD;

// Configuration
const START_DATE = new Date('2025-09-01');
const END_DATE = new Date('2025-12-31');

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
        activity_type: 'reading',
        activity_date: date,
        pages_read: 0,
        duration_minutes: 0,
        notes: ''
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
    if (!response.ok || !data.success) throw new Error(`${date} failed: ${data.message}`);
    return data;
}

async function main() {
    const days = daysBetween(START_DATE, END_DATE);
    console.log(`🧹 Clearing Reading records from ${formatDate(START_DATE)} to ${formatDate(END_DATE)} (${days} days)...`);

    try {
        await login();
        for (let i = 0; i < days; i++) {
            const date = formatDate(addDays(START_DATE, i));
            await submitZero(date);
            process.stdout.write('.');
            if ((i + 1) % 30 === 0) console.log(` ${i + 1}/${days}`);
            await new Promise(r => setTimeout(r, 50));
        }
        console.log('\n\n✅ Clear complete!');
    } catch (e) {
        console.error(`\n💥 Error: ${e.message}`);
    }
}

main();
