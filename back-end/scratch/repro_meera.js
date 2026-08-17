// Reproduce Meera's broken first-login: track flag state after every step.
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Student = require('../models/Student');
const LoginOtp = require('../models/LoginOtp');

const BASE_URL = 'http://localhost:5000/api';
const EMAIL = 'teststudent@gmail.com';

async function flags(label) {
  const s = await Student.findOne({ email: EMAIL }).select('mustChangePassword isFirstLogin isRegistered lastOtpSentAt lastLogin');
  console.log(`[${label}]`, {
    mustChangePassword: s.mustChangePassword,
    isFirstLogin: s.isFirstLogin,
    isRegistered: s.isRegistered,
    lastOtpSentAt: s.lastOtpSentAt,
    lastLogin: s.lastLogin,
  });
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds');
    await flags('after admin-style creation');

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: EMAIL, password: 'Password@123' });
    console.log('login response:', loginRes.data);
    await flags('after /auth/login');

    const otpDoc = await LoginOtp.findOne({ tempToken: loginRes.data.tempToken });
    otpDoc.otp = '123456';
    await otpDoc.save();

    const verifyRes = await axios.post(`${BASE_URL}/auth/verify-login-otp`, { tempToken: loginRes.data.tempToken, otp: '123456' });
    console.log('verify response:', verifyRes.data);
    await flags('after /auth/verify-login-otp');

    const pwRes = await axios.post(`${BASE_URL}/auth/first-login-change-password`, {
      tempToken: verifyRes.data.tempToken,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    });
    console.log('password-change response keys:', Object.keys(pwRes.data), 'alreadyRegistered:', pwRes.data.alreadyRegistered, 'message:', pwRes.data.message);
    await flags('after /auth/first-login-change-password');
  } catch (err) {
    if (err.response) console.error('HTTP error:', err.response.status, JSON.stringify(err.response.data, null, 2));
    else console.error(err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
