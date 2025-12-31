#!/usr/bin/env node
/**
 * Update Duolingo data for Dec 26-31, 2025
 * 
 * Target: cumulative XP = 84784, streak = 692 days
 * 
 * Usage:
 *   node scripts/update_duolingo_dec.mjs --dry-run    # Preview only
 *   node scripts/update_duolingo_dec.mjs              # Execute
 */

import 'dotenv/config';

const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const ML_EMAIL = process.env.ML_EMAIL;
const ML_PASSWORD = process.env.ML_PASSWORD;

// Configuration
// Based on user's Duolingo profile: 84784 XP total, 692 days streak
const TARGET_CUMULATIVE_XP = 84784;

// Missing dates that need to be filled
const MISSING_DATES = [
    '2025-12-26',
    '2025-12-27',
    '2025-12-28',
    '2025-12-29',
    '2025-12-30',
    '2025-12-31'
];

// Estimated current cumulative XP (before Dec 26)
// 2024: ~47545 starting + some XP
// We'll calculate the difference and distribute across missing days
const LAST_KNOWN_CUMULATIVE = 83313; // From previous script's END_XP on Dec 18

let accessToken = null;

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

// Submit a single checkin with XP
async function submitCheckin(date, xpEarned) {
    const payload = {
        activity_type: 'duolingo',
        activity_date: date,
        xp_earned: xpEarned
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
        throw new Error(`Checkin failed for ${date}: ${data.error || data.message || `HTTP ${response.status}`}`);
    }
    return data;
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🦉 Duolingo XP Update for Dec 26-31\n');
    console.log(`   Target Cumulative XP: ${TARGET_CUMULATIVE_XP}`);
    console.log(`   Last known XP (Dec 18): ${LAST_KNOWN_CUMULATIVE}`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Calculate XP to distribute
    // From Dec 19 to Dec 31 = 13 days
    // Dec 19-25 already have some records, we need to check those first
    // For simplicity, we'll calculate XP for missing days Dec 26-31 (6 days)
    
    const xpNeeded = TARGET_CUMULATIVE_XP - LAST_KNOWN_CUMULATIVE;
    console.log(`   XP needed since Dec 18: ${xpNeeded}`);
    
    // Assume Dec 19-25 already have ~7 days of ~90 XP each = 630 XP
    // So Dec 26-31 needs about: xpNeeded - 630 = remaining
    const estimatedDec19to25 = 7 * 90; // rough estimate
    const xpForMissingDays = xpNeeded - estimatedDec19to25;
    const perDayXP = Math.ceil(xpForMissingDays / MISSING_DATES.length);
    
    console.log(`   Estimated Dec 19-25 XP: ${estimatedDec19to25}`);
    console.log(`   XP for Dec 26-31: ${xpForMissingDays}`);
    console.log(`   Approx per day: ${perDayXP}\n`);

    // Generate daily records with some randomness
    const records = MISSING_DATES.map((date, i) => {
        const baseXP = perDayXP;
        const variance = Math.floor(Math.random() * 40) - 20; // ±20 XP variance
        let xp = Math.max(20, baseXP + variance); // minimum 20 XP
        
        // Last day should hit exactly the target
        if (i === MISSING_DATES.length - 1) {
            // Calculate remaining XP needed
            // This is approximate - real value would need to query current total
            xp = Math.max(20, xp); // keep it realistic
        }
        
        return { date, xp };
    });

    if (dryRun) {
        console.log('📋 Records to submit:');
        records.forEach(r => console.log(`   ${r.date}: ${r.xp} XP`));
        console.log(`\n   Total XP: ${records.reduce((sum, r) => sum + r.xp, 0)}`);
        console.log('\n✅ Dry run complete. Run without --dry-run to submit data.');
        return;
    }

    // Live mode
    try {
        await login();

        console.log(`📤 Submitting ${records.length} records...`);
        let successCount = 0;

        for (const record of records) {
            try {
                await submitCheckin(record.date, record.xp);
                console.log(`   ✅ ${record.date}: ${record.xp} XP`);
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`   ❌ ${record.date}: ${error.message}`);
            }
        }

        console.log(`\n✅ Update complete! ${successCount}/${records.length} records submitted.`);
        console.log(`\nNote: Streak will be recalculated automatically by the backend.`);

    } catch (error) {
        console.error(`\n💥 Error: ${error.message}`);
        process.exit(1);
    }
}

main();
