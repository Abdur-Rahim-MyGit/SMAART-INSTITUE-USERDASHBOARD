/**
 * Streak Logic Test Suite
 * Exercises the Avatar model's 7-day cycle streak logic
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Avatar = require('../models/Avatar');

async function runTests() {
    try {
        console.log('🚀 Starting Streak Logic Tests...');

        // 1. Setup Test Database
        const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/minds_test';
        await mongoose.connect(testDbUri);
        console.log('✅ Connected to test database');

        const testUserId = new mongoose.Types.ObjectId();

        // Clean up
        await Avatar.deleteMany({ userId: testUserId });

        // TEST 1: Initial Streak
        console.log('\n--- TEST 1: Initial Streak ---');
        let avatar = await Avatar.getOrCreate(testUserId);
        let status = await avatar.updateStreak();
        console.log(`Day 1: ${status.cycleDay}, Active: ${status.isActive}, Total: ${status.totalStreakDays}`);
        if (status.cycleDay !== 1 || !status.isActive) throw new Error('Test 1 Failed');

        // TEST 2: Consecutive Days
        console.log('\n--- TEST 2: Consecutive Days (Day 2-6) ---');
        // We mock the date by manually setting lastStreakDate
        for (let day = 2; day <= 6; day++) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            avatar.lastStreakDate = yesterdayStr;
            status = await avatar.updateStreak();
            console.log(`Day ${day}: ${status.cycleDay}, Active: ${status.isActive}, Total: ${status.totalStreakDays}`);
            if (status.cycleDay !== day) throw new Error(`Test 2 Failed at Day ${day}`);
        }

        // TEST 3: Reach Holiday (Day 7)
        console.log('\n--- TEST 3: Reach Holiday (Day 7) ---');
        const yesterdayHoliday = new Date();
        yesterdayHoliday.setDate(yesterdayHoliday.getDate() - 1);
        avatar.lastStreakDate = yesterdayHoliday.toISOString().split('T')[0];
        status = await avatar.updateStreak();
        console.log(`Day 7 (Holiday): ${status.cycleDay}, IsHoliday: ${status.isHoliday}, Total: ${status.totalStreakDays}`);
        if (status.cycleDay !== 7 || !status.isHoliday) throw new Error('Test 3 Failed');

        // TEST 4: Cycle Completion
        console.log('\n--- TEST 4: Cycle Completion (Day 8 -> Day 1) ---');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        avatar.lastStreakDate = yesterday.toISOString().split('T')[0];

        status = await avatar.updateStreak();
        console.log(`New Cycle Day 1: ${status.cycleDay}, Cycles Completed: ${status.cyclesCompleted}`);
        if (status.cycleDay !== 1 || status.cyclesCompleted !== 1) throw new Error('Test 4 Failed');

        // TEST 5: Reset Streak
        console.log('\n--- TEST 5: Reset Streak (Skip Day) ---');
        // Set last streak date to 2 days ago
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        avatar.lastStreakDate = twoDaysAgo.toISOString().split('T')[0];

        status = await avatar.updateStreak();
        console.log(`After Skip: Day ${status.cycleDay}, Total: ${status.totalStreakDays}, Active: ${status.isActive}`);
        // Should reset and then record today as day 1
        if (status.cycleDay !== 1 || status.totalStreakDays !== 1) throw new Error('Test 5 Failed');

        console.log('\n✅ ALL LLM-DRIVEN STREAK TESTS PASSED!');

        await Avatar.deleteMany({ userId: testUserId });
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runTests();
