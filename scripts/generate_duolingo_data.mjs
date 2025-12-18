#!/usr/bin/env node
/**
 * Generate Duolingo XP Data Migration Script
 * 
 * Generates and submits daily XP records from 2024-12-01 to today.
 * 
 * Usage:
 *   node scripts/generate_duolingo_data.mjs --dry-run    # Preview only
 *   node scripts/generate_duolingo_data.mjs              # Execute
 * 
 * Environment:
 *   ML_EMAIL, ML_PASSWORD   - Credentials for login
 *   ML_ACCESS_TOKEN         - Or provide token directly
 *   ML_API_BASE             - API base URL (default: https://pyqapi.3331322.xyz)
 */

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL;
const ML_PASSWORD = process.env.ML_PASSWORD;

// Configuration
const START_DATE = new Date('2024-12-01');
const END_DATE = new Date('2025-12-18');
const START_XP = 47545;
const END_XP = 83313;
const TOTAL_XP = END_XP - START_XP; // 35768

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
    const avgXP = Math.round(TOTAL_XP / days);
    const minXP = 20;
    const maxXP = avgXP * 2;

    console.log(`📊 Generating XP distribution:`);
    console.log(`   Days: ${days}`);
    console.log(`   Total XP: ${TOTAL_XP}`);
    console.log(`   Avg XP/day: ${avgXP}`);
    console.log(`   Range: [${minXP}, ${maxXP}]\n`);

    // Generate all XP values first
    const xpValues = [];
    for (let i = 0; i < days; i++) {
        const targetXP = Math.round(gaussianRandom(avgXP, avgXP * 0.35));
        xpValues.push(clamp(targetXP, minXP, maxXP));
    }

    // Adjust to match exact total
    let currentTotal = xpValues.reduce((a, b) => a + b, 0);
    let diff = TOTAL_XP - currentTotal;

    // Distribute the difference across random days
    while (diff !== 0) {
        const idx = Math.floor(Math.random() * days);
        const adjustment = diff > 0 ? 1 : -1;
        const newValue = xpValues[idx] + adjustment;

        if (newValue >= minXP && newValue <= maxXP) {
            xpValues[idx] = newValue;
            diff -= adjustment;
        }
    }

    // Create records with dates
    const records = xpValues.map((xp, i) => ({
        date: formatDate(addDays(START_DATE, i)),
        xp: xp
    }));

    // Verify total
    const actualTotal = records.reduce((sum, r) => sum + r.xp, 0);
    console.log(`✅ Generated ${records.length} records`);
    console.log(`   Actual total XP: ${actualTotal}`);

    return records;
}

// Login to get access token
async function login() {
    if (process.env.ML_ACCESS_TOKEN) {
        console.log('🔑 Using provided access token');
        accessToken = process.env.ML_ACCESS_TOKEN;
        return;
    }

    if (!ML_EMAIL || !ML_PASSWORD) {
        throw new Error('Missing credentials: set ML_EMAIL and ML_PASSWORD (or ML_ACCESS_TOKEN).');
    }

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

    console.log('🦉 Duolingo XP Data Migration\n');
    console.log(`   Start Date: ${formatDate(START_DATE)}`);
    console.log(`   End Date: ${formatDate(END_DATE)}`);
    console.log(`   XP Range: ${START_XP} → ${END_XP} (+${TOTAL_XP})`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    const records = generateDailyXP();

    if (dryRun) {
        console.log('\n📋 Preview (first 10 and last 5 records):');
        records.slice(0, 10).forEach(r => console.log(`   ${r.date}: ${r.xp} XP`));
        console.log('   ...');
        records.slice(-5).forEach(r => console.log(`   ${r.date}: ${r.xp} XP`));

        console.log('\n📊 Statistics:');
        const xpValues = records.map(r => r.xp);
        console.log(`   Min XP: ${Math.min(...xpValues)}`);
        console.log(`   Max XP: ${Math.max(...xpValues)}`);
        console.log(`   Avg XP: ${Math.round(xpValues.reduce((a, b) => a + b, 0) / xpValues.length)}`);
        console.log(`   Total: ${xpValues.reduce((a, b) => a + b, 0)}`);

        console.log('\n✅ Dry run complete. Run without --dry-run to submit data.');
        return;
    }

    // Live mode
    try {
        await login();

        console.log(`\n📤 Submitting ${records.length} records...`);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            try {
                await submitCheckin(record);
                successCount++;

                // Progress indicator every 30 records
                if ((i + 1) % 30 === 0 || i === records.length - 1) {
                    console.log(`   Progress: ${i + 1}/${records.length} (${Math.round((i + 1) / records.length * 100)}%)`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error(`   ❌ ${record.date}: ${error.message}`);
                errorCount++;
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   Success: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);

    } catch (error) {
        console.error(`\n💥 Error: ${error.message}`);
        process.exit(1);
    }
}

main();
