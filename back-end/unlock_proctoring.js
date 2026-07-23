/**
 * unlock_proctoring.js
 * Run once from the back-end directory to clear any locked proctoring
 * sessions so you can access the assessment again during development.
 *
 * Usage:  node unlock_proctoring.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const ProctoringSession = require('./models/ProctoringSession');
const Result = require('./models/Result');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // 1. Unlock all locked proctoring sessions
  const sessionResult = await ProctoringSession.updateMany(
    { isLocked: true },
    {
      $set: {
        isLocked: false,
        status: 'completed',
        lockReason: 'Manually unlocked for development',
      },
    }
  );
  console.log(`🔓 Proctoring sessions unlocked: ${sessionResult.modifiedCount}`);

  // 2. Unlock all locked / in-progress results
  const resultResult = await Result.updateMany(
    { $or: [{ lockedOut: true }, { completionStatus: 'in-progress' }] },
    {
      $set: {
        lockedOut: false,
        lockoutReason: '',
        completionStatus: 'abandoned',
      },
    }
  );
  console.log(`🔓 Results unlocked/abandoned: ${resultResult.modifiedCount}`);

  console.log('\n✅ Done. You can now start the assessment fresh.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
