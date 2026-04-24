const cron = require('node-cron');
const Student = require('../models/Student');
const EngagementProfile = require('../models/EngagementProfile');
const { computeCommunityEngagementScore } = require('../helpers/communityEngagementScore');
const { sendEmail } = require('./emailService');
const logger = require('./logger');

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
  logger.info('[CRON] PPI recalculation completed at', new Date().toISOString());
}

function startCronJobs() {
  // Every Sunday at 00:00
  cron.schedule('0 0 * * 0', async () => {
    try {
      await recalculateAllPpi();
    } catch (err) {
      logger.error('[CRON] PPI recalculation failed:', err);
      
      // Send alert email to admin
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (adminEmail) {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">CRON JOB FAILED - PPI Recalculation</h2>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Error:</strong> ${err.message}</p>
            <p><strong>Stack:</strong></p>
            <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto;">${err.stack}</pre>
            <p style="color: #6b7280; margin-top: 20px;">Please check the server logs for more details.</p>
          </div>
        `;
        await sendEmail(adminEmail, 'CRON JOB FAILED - PPI Recalculation', emailContent);
      }
    }
  });
}

module.exports = { startCronJobs, recalculateAllPpi };
