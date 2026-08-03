require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash('Rahul@1234', 10);
  const res = await mongoose.connection.db.collection('students').updateOne(
    { email: 'rahul@gmail.com' },
    { $set: { password: hash, mustChangePassword: false, status: 'active' } }
  );
  console.log('Password reset result for rahul@gmail.com (Rahul@1234):', res);
  process.exit(0);
})();
