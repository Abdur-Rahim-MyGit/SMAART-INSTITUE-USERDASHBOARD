/**
 * Active Learning Days — for the PLVI denominator.
 *
 * Counts the number of DISTINCT calendar dates (Asia/Kolkata) on which a user
 * had actual course learning activity within a [start, end] window. Used to make
 * PLVI = (S_current − S_baseline) / activeLearningDays reflect real effort rather
 * than idle calendar days.
 *
 * Source: the `user_progress` collection (models/UserProgress.js) — a per-user,
 * per (course, module, day, step) row whose `updatedAt` bumps on every learning
 * interaction. This is READ-ONLY and completely independent of the streak system
 * (UserStreak / Avatar / Student.streakData are never touched or read here).
 */

const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');

const DEFAULT_TZ = 'Asia/Kolkata';

/**
 * @param {string|ObjectId} userId
 * @param {Date|string} startDate  window start (e.g. T1 baseline date)
 * @param {Date|string} endDate    window end (e.g. stage submission date)
 * @param {string} timezone        IANA tz for the calendar-day boundary
 * @returns {Promise<number>} distinct active learning days in [start, end] (0 if none)
 */
async function countActiveLearningDays(userId, startDate, endDate, timezone = DEFAULT_TZ) {
    if (!userId || !startDate || !endDate) return 0;

    let uid;
    try {
        uid = new mongoose.Types.ObjectId(userId);
    } catch (_) {
        return 0; // non-ObjectId user id → no rows
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

    const rows = await UserProgress.aggregate([
        { $match: { user: uid, updatedAt: { $gte: start, $lte: end } } },
        { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt', timezone } } } },
        { $group: { _id: '$day' } },
        { $count: 'days' }
    ]);

    return rows.length ? rows[0].days : 0;
}

module.exports = { countActiveLearningDays };
