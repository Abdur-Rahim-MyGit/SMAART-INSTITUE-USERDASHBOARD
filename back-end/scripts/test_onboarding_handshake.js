const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Student = require('../models/Student');
const LoginOtp = require('../models/LoginOtp');

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
    console.log('Connecting to DB:', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('1. Connected to MongoDB database successfully.');

    // Step 1: Request OTP by logging in with default credentials
    console.log('2. Requesting OTP via /auth/login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'teststudent@gmail.com',
      password: 'Password@123'
    });

    if (!loginRes.data.requireOtp) {
      throw new Error('Expected requireOtp to be true, got: ' + JSON.stringify(loginRes.data));
    }
    console.log('   - OTP successfully requested. Response data:', loginRes.data);
    const firstTempToken = loginRes.data.tempToken;

    // Step 2: Override the OTP in MongoDB to a known code
    console.log('3. Overriding OTP in MongoDB database...');
    const otpDoc = await LoginOtp.findOne({ tempToken: firstTempToken });
    if (!otpDoc) {
      throw new Error('LoginOtp document not found for firstTempToken: ' + firstTempToken);
    }
    otpDoc.otp = '123456';
    await otpDoc.save();
    console.log('   - OTP overridden to "123456".');

    // Step 3: Verify the OTP
    console.log('4. Verifying OTP via /auth/verify-login-otp...');
    const verifyRes = await axios.post(`${BASE_URL}/auth/verify-login-otp`, {
      tempToken: firstTempToken,
      otp: '123456'
    });

    if (!verifyRes.data.requirePasswordChange) {
      throw new Error('Expected requirePasswordChange to be true, got: ' + JSON.stringify(verifyRes.data));
    }
    console.log('   - OTP verified successfully.');
    const secondTempToken = verifyRes.data.tempToken;

    // Step 4: Perform mandatory first-login password change
    console.log('5. Changing password via /auth/first-login-change-password...');
    const passwordRes = await axios.post(`${BASE_URL}/auth/first-login-change-password`, {
      tempToken: secondTempToken,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });

    const user = passwordRes.data.user;
    const token = passwordRes.data.token;
    console.log('   - Password changed successfully.');
    console.log('   - User payload hasRegistration:', user.hasRegistration);
    console.log('   - User payload mustChangePassword:', user.mustChangePassword);

    if (user.hasRegistration !== false) {
      throw new Error('Expected hasRegistration to be false for a new unregistered student');
    }

    // Step 5: Submit profile registration (ComprehensiveSignup)
    console.log('6. Submitting profile details via /users/register-details...');
    const registerRes = await axios.post(`${BASE_URL}/users/register-details`, {
      email: 'teststudent@gmail.com',
      fullName: 'Test Student',
      mobileNumber: '9876543210',
      personalDetails: JSON.stringify({
        nickname: 'Tester',
        dob: '2000-01-01',
        gender: 'male',
        institution: 'SRM Institute of Science and Technology - Ramapuram',
        department: 'Computer Science',
        cgpa: '8.5',
        yearOfStudy: '3',
        yearOfPassing: '2027',
        alternateMobile: '9876543211',
        bio: 'I am a test student.'
      })
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('   - Registration submit response:', registerRes.data.message);

    // Step 6: Verify student status in the database
    console.log('7. Verifying registration flags in database...');
    const updatedStudent = await Student.findOne({ email: 'teststudent@gmail.com' });
    console.log('   - Database Student isRegistered:', updatedStudent.isRegistered);
    console.log('   - Database Student mustChangePassword:', updatedStudent.mustChangePassword);

    if (updatedStudent.isRegistered !== true) {
      throw new Error('Student isRegistered flag was not set to true after registration');
    }

    console.log('\n🎉 Onboarding flow integration test PASSED successfully!');
  } catch (err) {
    console.error('\n❌ Onboarding flow integration test FAILED:');
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
      console.error('Error Stack:', err.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('8. Database disconnected.');
  }
}

run();
