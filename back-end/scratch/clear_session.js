require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await mongoose.connection.db.collection('students').updateOne(
    { email: 'rahul@gmail.com' },
    { $set: { currentSessionId: null, sessionExpiresAt: null, otpAttempts: 0, accountLockedUntil: null } }
  );
  console.log('Cleared sessions for rahul@gmail.com:', res);
  process.exit(0);
})();
