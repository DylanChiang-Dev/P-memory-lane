#!/usr/bin/env node
/**
 * Regenerate Duolingo 2024 Data (Feb 10 - Nov 30)
 * 
 * To achieve 692-day streak:
 * - 2025: 365 days (Jan 1 - Dec 31)
 * - 2024: 327 days (Feb 10 - Dec 31)
 * - 365 + 327 = 692 days
 * 
 * 2024 total XP should be 33,259
 * December already has 3,019 XP
 * So Feb 10 - Nov 30 needs: 33,259 - 3,019 = 30,240 XP
 * 
 * Usage:
 *   node scripts/regenerate_duolingo_2024.mjs --dry-run
 *   node scripts/regenerate_duolingo_2024.mjs
 */

import 'dotenv/config';

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL || '3331322@gmail.com';
const ML_PASSWORD = process.env.ML_PASSWORD || 'ca123456789';

// Configuration
// 692 days streak ends on 2025-12-31, starts on 2024-02-10
const START_DATE = new Date('2024-02-10');
const END_DATE = new Date('2024-11-30'); // December already has data
const TARGET_2024_XP_FEB_NOV = 33259 - 3019; // = 30240 XP for Feb-Nov

let accessToken = null;

// Calculate days between dates
function daysBetween(start, end) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((end - start) / oneDay) + 1;
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Add days to a date
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Box-Muller transform for Gaussian random
function gaussianRandom(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}

// Clamp value to range
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Generate XP distribution
function generateDailyXP() {
    const days = daysBetween(START_DATE, END_DATE);
    const avgXP = Math.round(TARGET_2024_XP_FEB_NOV / days);
    const minXP = 30;
    const maxXP = 250;

    console.log(`📊 Generating XP distribution:`);
    console.log(`   Period: ${formatDate(START_DATE)} to ${formatDate(END_DATE)}`);
    console.log(`   Days: ${days}`);
    console.log(`   Total XP target: ${TARGET_2024_XP_FEB_NOV}`);
    console.log(`   Avg XP/day: ${avgXP}`);
    console.log(`   Range: [${minXP}, ${maxXP}]\n`);

    const xpValues = [];
    for (let i = 0; i < days; i++) {
        const date = addDays(START_DATE, i);
        const dayOfWeek = date.getDay();

        let targetXP = Math.round(gaussianRandom(avgXP, avgXP * 0.45));

        // Weekend variation
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            targetXP = Math.round(targetXP * (0.75 + Math.random() * 0.5));
        }

        xpValues.push(clamp(targetXP, minXP, maxXP));
    }

    // Adjust to match exact total
    let currentTotal = xpValues.reduce((a, b) => a + b, 0);
    let diff = TARGET_2024_XP_FEB_NOV - currentTotal;

    console.log(`   Initial total: ${currentTotal}, diff: ${diff}`);

    let iterations = 0;
    while (diff !== 0 && iterations < 100000) {
        const idx = Math.floor(Math.random() * days);
        const adjustment = diff > 0 ? 1 : -1;
        const newValue = xpValues[idx] + adjustment;

        if (newValue >= minXP && newValue <= maxXP) {
            xpValues[idx] = newValue;
            diff -= adjustment;
        }
        iterations++;
    }

    const records = xpValues.map((xp, i) => ({
        date: formatDate(addDays(START_DATE, i)),
        xp: xp
    }));

    const actualTotal = records.reduce((sum, r) => sum + r.xp, 0);
    console.log(`✅ Generated ${records.length} records`);
    console.log(`   Final total XP: ${actualTotal}`);

    return records;
}

// Login
async function login() {
    console.log('🔐 Logging in...');
    const response = await fetch(`${ML_API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ML_EMAIL, password: ML_PASSWORD })
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(`Login failed: ${data.error || data.message}`);
    }
    accessToken = data.data.access_token;
    console.log('✅ Login successful\n');
}

// Submit checkin
async function submitCheckin(record) {
    const payload = {
        activity_type: 'duolingo',
        activity_date: record.date,
        xp_earned: record.xp
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
    if (!response.ok || !data.success) {
        throw new Error(`Failed: ${data.error || data.message}`);
    }
    return data;
}

// Main
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🦉 Duolingo 2024 Data (Feb 10 - Nov 30)\n');
    console.log(`   Target streak: 692 days`);
    console.log(`   2024 XP needed (Feb-Nov): ${TARGET_2024_XP_FEB_NOV}`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    const records = generateDailyXP();

    const xpValues = records.map(r => r.xp);
    console.log('\n📊 Statistics:');
    console.log(`   Min XP: ${Math.min(...xpValues)}`);
    console.log(`   Max XP: ${Math.max(...xpValues)}`);
    console.log(`   Avg XP: ${Math.round(xpValues.reduce((a, b) => a + b, 0) / xpValues.length)}`);

    if (dryRun) {
        console.log('\n📋 Sample records:');
        records.slice(0, 5).forEach(r => console.log(`   ${r.date}: ${r.xp} XP`));
        console.log('   ...');
        records.slice(-5).forEach(r => console.log(`   ${r.date}: ${r.xp} XP`));
        console.log('\n✅ Dry run complete.');
        return;
    }

    try {
        await login();

        console.log(`📤 Submitting ${records.length} records...`);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            try {
                await submitCheckin(record);
                successCount++;

                if ((i + 1) % 50 === 0 || i === records.length - 1) {
                    console.log(`   Progress: ${i + 1}/${records.length} (${Math.round((i + 1) / records.length * 100)}%)`);
                }

                await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error) {
                console.error(`   ❌ ${record.date}: ${error.message}`);
                errorCount++;
            }
        }

        console.log(`\n✅ Complete! Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
        console.error(`\n💥 Error: ${error.message}`);
        process.exit(1);
    }
}

main();
