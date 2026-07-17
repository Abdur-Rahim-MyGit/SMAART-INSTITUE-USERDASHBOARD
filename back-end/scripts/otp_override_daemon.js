const mongoose = require('mongoose');
const LoginOtp = require('../models/LoginOtp');

async function run() {
  const mongoUri = 'mongodb://127.0.0.1:27017/minds';
  console.log('Daemon connecting to:', mongoUri);
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('Daemon connected to MongoDB.');

  console.log('Monitoring LoginOtp collection for teststudent@gmail.com...');
  
  while (true) {
    try {
      const otpDocs = await LoginOtp.find({ email: 'teststudent@gmail.com', isUsed: false });
      for (const doc of otpDocs) {
        if (doc.otp !== '123456') {
          doc.otp = '123456';
          await doc.save();
          console.log(`[DAEMON] Overrode OTP for ${doc.email} to "123456"`);
        }
      }
    } catch (err) {
      console.error('Daemon poll error:', err.message);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

run();
