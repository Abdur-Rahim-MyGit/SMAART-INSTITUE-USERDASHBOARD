const cron = require('node-cron');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const College = require('../models/College');
const CourseEnrollment = require('../models/CourseEnrollment');
const DailyAnalytics = require('../models/DailyAnalytics');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Run daily rollup logic
async function runDailyRollup(targetDateStr) {
  try {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    // Calculate start and end of that day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    logger.info(`[cronService] Running daily analytics rollup for date: ${startOfDay.toDateString()}`);

    // 1. Daily Active Users (DAU)
    // Users active today: lastLogin is between startOfDay and endOfDay
    const [userCount, studentCount, teacherCount] = await Promise.all([
      User.countDocuments({ lastLogin: { $gte: startOfDay, $lte: endOfDay } }),
      Student.countDocuments({ lastLogin: { $gte: startOfDay, $lte: endOfDay } }),
      Teacher.countDocuments({ lastLogin: { $gte: startOfDay, $lte: endOfDay } })
    ]);
    const dailyActiveUsers = userCount + studentCount + teacherCount;

    // 2. Active Students Count
    const activeStudentsCount = studentCount;

    // 3. Total Enrollments & Completed Enrollments
    const totalEnrollments = await CourseEnrollment.countDocuments();
    const completedEnrollments = await CourseEnrollment.countDocuments({ status: 'completed' });

    // 4. Hours Active (cumulative estimated active hours across all courses)
    const activeTimeAgg = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$totalTimeSpent' }
        }
      }
    ]);
    const hoursActive = activeTimeAgg.length > 0 ? (activeTimeAgg[0].totalMinutes / 60) : 0;

    // 5. Average Course Completion Speed (in days)
    // Find all CourseEnrollments completed on this day, or overall average if none completed on this day
    const completedToday = await CourseEnrollment.find({
      status: 'completed',
      completionDate: { $gte: startOfDay, $lte: endOfDay }
    }).select('enrollmentDate completionDate');

    let averageCourseCompletionSpeed = 0;
    if (completedToday.length > 0) {
      const totalDays = completedToday.reduce((acc, curr) => {
        const diffMs = curr.completionDate - curr.enrollmentDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return acc + diffDays;
      }, 0);
      averageCourseCompletionSpeed = totalDays / completedToday.length;
    } else {
      // Fallback: overall average completion speed of all completed courses
      const allCompleted = await CourseEnrollment.find({ status: 'completed' }).select('enrollmentDate completionDate');
      if (allCompleted.length > 0) {
        const totalDays = allCompleted.reduce((acc, curr) => {
          const diffMs = curr.completionDate - curr.enrollmentDate;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          return acc + (diffDays > 0 ? diffDays : 0);
        }, 0);
        averageCourseCompletionSpeed = totalDays / allCompleted.length;
      }
    }

    // 6. College Rankings
    // We group students/enrollments by college and calculate average progress and student count
    const colleges = await College.find({ status: 'Active' });
    const collegeRankingData = [];

    for (const col of colleges) {
      // Students count in this college
      const totalColStudents = await Student.countDocuments({ college: col._id });
      const activeColStudents = await Student.countDocuments({
        college: col._id,
        lastLogin: { $gte: startOfDay, $lte: endOfDay }
      });

      // Enrollment aggregation for this college
      const enrollmentStats = await CourseEnrollment.aggregate([
        { $match: { college: col._id } },
        {
          $group: {
            _id: null,
            avgProgress: { $avg: '$progress' },
            count: { $sum: 1 }
          }
        }
      ]);

      const avgProgress = enrollmentStats.length > 0 ? enrollmentStats[0].avgProgress : 0;
      // Participation rate = (active students / total students) * 100
      const participationRate = totalColStudents > 0 ? (activeColStudents / totalColStudents) * 100 : 0;

      collegeRankingData.push({
        college: col._id,
        collegeName: col.collegeName,
        studentCount: totalColStudents,
        activeStudents: activeColStudents,
        averageProgress: Math.round(avgProgress * 100) / 100,
        participationRate: Math.round(participationRate * 100) / 100,
        rank: 1 // Temporary placeholder
      });
    }

    // Sort by averageProgress desc, then participationRate desc
    collegeRankingData.sort((a, b) => b.averageProgress - a.averageProgress || b.participationRate - a.participationRate);
    
    // Assign ranks
    collegeRankingData.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Save or update DailyAnalytics record
    const dateQuery = new Date(startOfDay);
    await DailyAnalytics.findOneAndUpdate(
      { date: dateQuery },
      {
        date: dateQuery,
        dailyActiveUsers,
        activeStudentsCount,
        totalEnrollments,
        completedEnrollments,
        averageCourseCompletionSpeed: Math.round(averageCourseCompletionSpeed * 100) / 100,
        hoursActive: Math.round(hoursActive * 100) / 100,
        collegeRankings: collegeRankingData
      },
      { upsert: true, new: true }
    );

    logger.info(`[cronService] Daily rollup saved successfully for ${dateQuery.toDateString()}`);
  } catch (err) {
    logger.error(`[cronService] Error in runDailyRollup:`, err);
  }
}

// Setup the cron job to run at 3:00 AM server local time
function initAnalyticsCron() {
  logger.info('[cronService] Initializing daily progression analytics cron job...');
  
  // 3:00 AM daily: '0 3 * * *'
  cron.schedule('0 3 * * *', async () => {
    logger.info('[cronService] Triggering scheduled daily analytics rollup...');
    await runDailyRollup();
  });
}

module.exports = {
  runDailyRollup,
  initAnalyticsCron
};
