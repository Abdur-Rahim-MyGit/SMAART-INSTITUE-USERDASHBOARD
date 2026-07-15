const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const LoginOtp = require('../models/LoginOtp');

async function test() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const localNow = new Date();
    console.log('Local Node.js Time:', localNow.toISOString());

    // Query database server time
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    const dbTime = new Date(serverStatus.localTime);
    console.log('MongoDB Server Time:', dbTime.toISOString());

    const driftMs = localNow.getTime() - dbTime.getTime();
    console.log(`Drift (Local - DB): ${driftMs} ms (${driftMs / 1000} seconds)`);

    const email = 'test_drift@example.com';
    const tempToken = 'test-token-' + Date.now();

    await LoginOtp.deleteMany({ email });

    const otp = new LoginOtp({
      email,
      otp: '123456',
      tempToken,
      userData: { test: true }
    });

    await otp.save();
    console.log('Saved LoginOtp.');

    // Query after 65 seconds
    console.log('Waiting 65 seconds...');
    await new Promise(resolve => setTimeout(resolve, 65000));

    const found = await LoginOtp.findOne({ tempToken });
    if (found) {
      console.log('Found after 65 seconds.');
    } else {
      console.log('NOT FOUND after 65 seconds! It was deleted by MongoDB TTL index.');
    }

    await LoginOtp.deleteMany({ email });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();
