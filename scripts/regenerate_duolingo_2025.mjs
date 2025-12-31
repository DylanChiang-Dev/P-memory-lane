#!/usr/bin/env node
/**
 * Regenerate Duolingo 2025 Data
 * 
 * Clear existing 2025 data and regenerate with natural distribution
 * Target: 51525 XP for 2025 (84784 total - 33259 at end of 2024)
 * 
 * Usage:
 *   node scripts/regenerate_duolingo_2025.mjs --dry-run
 *   node scripts/regenerate_duolingo_2025.mjs
 */

import 'dotenv/config';

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';

// Credentials from user
const ML_EMAIL = process.env.ML_EMAIL || '3331322@gmail.com';
const ML_PASSWORD = process.env.ML_PASSWORD || 'ca123456789';

// Configuration
const YEAR = 2025;
const TARGET_2025_XP = 84784 - 33259; // = 51525 XP for 2025
const START_DATE = new Date('2025-01-01');
const END_DATE = new Date('2025-12-31');

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

// Generate XP distribution for the year
function generateDailyXP() {
    const days = daysBetween(START_DATE, END_DATE);
    const avgXP = Math.round(TARGET_2025_XP / days);
    const minXP = 30;  // Minimum daily XP
    const maxXP = 280; // Maximum daily XP (some days are more active)

    console.log(`📊 Generating XP distribution:`);
    console.log(`   Year: ${YEAR}`);
    console.log(`   Days: ${days}`);
    console.log(`   Total XP target: ${TARGET_2025_XP}`);
    console.log(`   Avg XP/day: ${avgXP}`);
    console.log(`   Range: [${minXP}, ${maxXP}]\n`);

    // Generate all XP values with natural variation
    const xpValues = [];
    for (let i = 0; i < days; i++) {
        // Add some weekly patterns (weekends might be different)
        const date = addDays(START_DATE, i);
        const dayOfWeek = date.getDay();

        // Base XP with gaussian distribution
        let targetXP = Math.round(gaussianRandom(avgXP, avgXP * 0.5));

        // Weekend bonus/penalty variation
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            targetXP = Math.round(targetXP * (0.7 + Math.random() * 0.6)); // 70%-130%
        }

        xpValues.push(clamp(targetXP, minXP, maxXP));
    }

    // Adjust to match exact total
    let currentTotal = xpValues.reduce((a, b) => a + b, 0);
    let diff = TARGET_2025_XP - currentTotal;

    console.log(`   Initial total: ${currentTotal}, diff: ${diff}`);

    // Distribute the difference across random days
    let iterations = 0;
    const maxIterations = 100000;
    while (diff !== 0 && iterations < maxIterations) {
        const idx = Math.floor(Math.random() * days);
        const adjustment = diff > 0 ? 1 : -1;
        const newValue = xpValues[idx] + adjustment;

        if (newValue >= minXP && newValue <= maxXP) {
            xpValues[idx] = newValue;
            diff -= adjustment;
        }
        iterations++;
    }

    // Create records with dates
    const records = xpValues.map((xp, i) => ({
        date: formatDate(addDays(START_DATE, i)),
        xp: xp
    }));

    // Verify total
    const actualTotal = records.reduce((sum, r) => sum + r.xp, 0);
    console.log(`✅ Generated ${records.length} records`);
    console.log(`   Final total XP: ${actualTotal}`);

    return records;
}

// Login to get access token
async function login() {
    console.log('🔐 Logging in to Memory Lane...');
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

// Note: The checkin API will automatically update/overwrite existing records

// Submit a single checkin
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
        throw new Error(`Checkin failed for ${record.date}: ${data.error || data.message || `HTTP ${response.status}`}`);
    }
    return data;
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🦉 Duolingo 2025 Data Regeneration\n');
    console.log(`   2024 end XP: 33,259`);
    console.log(`   2025 end XP: 84,784`);
    console.log(`   2025 XP to earn: ${TARGET_2025_XP}`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    const records = generateDailyXP();

    // Statistics
    const xpValues = records.map(r => r.xp);
    console.log('\n📊 Statistics:');
    console.log(`   Min XP: ${Math.min(...xpValues)}`);
    console.log(`   Max XP: ${Math.max(...xpValues)}`);
    console.log(`   Avg XP: ${Math.round(xpValues.reduce((a, b) => a + b, 0) / xpValues.length)}`);

    if (dryRun) {
        console.log('\n📋 Sample records (first 10 and last 5):');
        records.slice(0, 10).forEach(r => console.log(`   ${r.date}: ${r.xp} XP`));
        console.log('   ...');
        records.slice(-5).forEach(r => console.log(`   ${r.date}: ${r.xp} XP`));

        console.log('\n✅ Dry run complete. Run without --dry-run to submit data.');
        return;
    }

    // Live mode
    try {
        await login();

        console.log(`📤 Submitting ${records.length} records (will overwrite existing)...`);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            try {
                await submitCheckin(record);
                successCount++;

                // Progress indicator every 50 records
                if ((i + 1) % 50 === 0 || i === records.length - 1) {
                    console.log(`   Progress: ${i + 1}/${records.length} (${Math.round((i + 1) / records.length * 100)}%)`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error) {
                console.error(`   ❌ ${record.date}: ${error.message}`);
                errorCount++;
            }
        }

        console.log(`\n✅ Regeneration complete!`);
        console.log(`   Success: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`\n   Total 2025 XP: ${TARGET_2025_XP}`);
        console.log(`   Cumulative total: 84,784 XP`);

    } catch (error) {
        console.error(`\n💥 Error: ${error.message}`);
        process.exit(1);
    }
}

main();
