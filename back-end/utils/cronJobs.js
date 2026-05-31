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
  // Initialize Daily Analytics Cron
  const { initAnalyticsCron, runDailyRollup } = require('../services/cronService');
  initAnalyticsCron();

  // Run a startup rollup if no analytics data exists
  const DailyAnalytics = require('../models/DailyAnalytics');
  DailyAnalytics.countDocuments().then(count => {
    if (count === 0) {
      logger.info('[CRON] No daily analytics records found. Performing initial rollup...');
      runDailyRollup(new Date());
    }
  }).catch(err => {
    logger.error('[CRON] Failed checking daily analytics count:', err);
  });

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

  // Every minute: check for todo reminders
  cron.schedule('* * * * *', async () => {
    try {
      const Todo = require('../models/Todo');
      const Notification = require('../models/Notification');
      const now = new Date();
      // Find todos that are uncompleted, due date has passed or is now, and reminder has not been triggered
      const overdueTodos = await Todo.find({
        completed: false,
        reminderTriggered: false,
        dueDate: { $lte: now }
      });

      for (const todo of overdueTodos) {
        // Trigger in-app notification reminder
        await Notification.createNotification({
          userId: todo.user,
          type: 'task',
          title: 'Task Due',
          message: `Your task "${todo.title}" is due now!`,
          icon: 'clipboard-check',
          color: '#f59e0b', // amber
          link: '/dashboard/notes' // navigate to productivity page
        });

        // Mark reminder as triggered
        todo.reminderTriggered = true;
        await todo.save();
      }
    } catch (err) {
      logger.error('[CRON] Todo reminders check failed:', err);
    }
  });
}

module.exports = { startCronJobs, recalculateAllPpi };
