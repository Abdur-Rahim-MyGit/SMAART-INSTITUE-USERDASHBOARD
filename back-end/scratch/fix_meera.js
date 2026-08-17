// Restore Meera's onboarding state so first login asks: OTP -> set new password -> complete profile.
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const res = await db.collection('students').updateOne(
    { email: 'meera@gmail.com' },
    {
      $set: {
        mustChangePassword: true,
        isFirstLogin: true,
        isRegistered: false,
        currentSessionId: null,
        sessionExpiresAt: null,
      },
    }
  );
  console.log('update result:', res.modifiedCount);
  const s = await db.collection('students').findOne(
    { email: 'meera@gmail.com' },
    { projection: { fullName: 1, mustChangePassword: 1, isFirstLogin: 1, isRegistered: 1, currentSessionId: 1 } }
  );
  console.log(JSON.stringify(s, null, 2));
  process.exit(0);
})();
