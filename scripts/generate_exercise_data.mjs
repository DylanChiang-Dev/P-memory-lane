#!/usr/bin/env node
/**
 * Generate Exercise Data Migration Script
 * 
 * Generates and submits exercise records for 2025.
 * Target: ~2 times/week, 30-40 mins each, with clusters.
 */

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL;
const ML_PASSWORD = process.env.ML_PASSWORD;

// Configuration
const START_DATE = new Date('2025-01-01');
const END_DATE = new Date(); // Today
const TARGET_TOTAL_SESSIONS = Math.round(daysBetween(START_DATE, END_DATE) / 7 * 2);

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

function generateExerciseRecords() {
    const days = daysBetween(START_DATE, END_DATE);
    const records = [];

    console.log(`📊 Generating Exercise distribution:`);
    console.log(`   Days: ${days}`);
    console.log(`   Target Sessions: ${TARGET_TOTAL_SESSIONS} (~2/week)\n`);

    // Simple state-based generator for clustering
    // Probabilities to achieve roughly the target count with clustering
    const PROB_IF_IDLE = 0.22;
    const PROB_IF_ACTIVE = 0.45;

    let lastActive = false;

    for (let i = 0; i < days; i++) {
        const date = formatDate(addDays(START_DATE, i));
        const roll = Math.random();
        const threshold = lastActive ? PROB_IF_ACTIVE : PROB_IF_IDLE;

        if (roll < threshold) {
            const minutes = Math.floor(Math.random() * 11) + 30; // 30-40 mins
            records.push({
                date,
                minutes,
                intensity: minutes >= 35 ? 'high' : 'medium'
            });
            lastActive = true;
        } else {
            lastActive = false;
        }
    }

    console.log(`✅ Generated ${records.length} exercise sessions`);
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
        activity_type: 'exercise',
        activity_date: record.date,
        duration_minutes: record.minutes,
        intensity: record.intensity,
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
    if (!response.ok || !data.success) throw new Error(`${record.date} failed: ${data.message}`);
    return data;
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const records = generateExerciseRecords();

    if (dryRun) {
        console.log('\n📋 Preview (First 20):');
        records.slice(0, 20).forEach(r => console.log(`   ${r.date}: ${r.minutes} min (${r.intensity})`));
        return;
    }

    try {
        await login();
        console.log(`\n📤 Submitting ${records.length} records...`);
        for (const record of records) {
            await submitCheckin(record);
            process.stdout.write('.');
            await new Promise(r => setTimeout(r, 60));
        }
        console.log('\n\n✅ Done!');
    } catch (e) {
        console.error(`\n💥 Error: ${e.message}`);
    }
}

main();
