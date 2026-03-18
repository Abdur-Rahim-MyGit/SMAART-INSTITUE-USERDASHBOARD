const cron = require('node-cron');
const Student = require('../models/Student');
const EngagementProfile = require('../models/EngagementProfile');
const { computeCommunityEngagementScore } = require('../helpers/communityEngagementScore');

async function recalculateAllPpi() {
  const students = await Student.find({}).select('_id');
  for (const student of students) {
    const score = await computeCommunityEngagementScore(student._id);
    await EngagementProfile.findOneAndUpdate(
      { studentId: student._id },
      { ...score, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
  }
  console.log('[CRON] PPI recalculation completed at', new Date().toISOString());
}

function startCronJobs() {
  // Every Sunday at 00:00
  cron.schedule('0 0 * * 0', async () => {
    try {
      await recalculateAllPpi();
    } catch (err) {
      console.error('[CRON] PPI recalculation failed:', err);
    }
  });
}

module.exports = { startCronJobs, recalculateAllPpi };
