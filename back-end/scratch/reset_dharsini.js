require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash('Password@123', 10);
  const res = await mongoose.connection.db.collection('students').updateOne(
    { email: 'dharsini549@gmail.com' },
    {
      $set: {
        password: hash,
        mustChangePassword: true,
        isFirstLogin: true,
        isRegistered: false,
        registration: null,
        status: 'active',
        currentSessionId: null,
        sessionExpiresAt: null,
        otpAttempts: 0,
        accountLockedUntil: null,
        isAssessmentCompleted: false,
        assessments: []
      }
    }
  );
  console.log('Reset dharsini549@gmail.com to new student state:', res);
  process.exit(0);
})();
