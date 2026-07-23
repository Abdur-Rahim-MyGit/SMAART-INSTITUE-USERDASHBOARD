const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Student = require('../models/Student');
const College = require('../models/College');
const Counter = require('../models/Counter');

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
    console.log('Connecting to DB:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected successfully');

    // Find or create college
    let college = await College.findOne({});
    if (!college) {
      console.log('No college found. Creating a dummy college...');
      college = new College({
        collegeName: 'Dummy Test Institute of Technology',
        institutionType: 'College',
        email: 'dummycollege@test.com',
        contactNumber: '1234567890',
        registrationNumber: 'REG12345',
        accreditationStatus: 'NAAC',
        status: 'Active'
      });
      await college.save();
      console.log(`Dummy College created: ${college.collegeName} (${college._id})`);
    } else {
      console.log(`Using College: ${college.collegeName} (${college._id})`);
      await College.updateOne({ _id: college._id }, { $set: { status: 'Active' } });
      console.log('Explicitly set college status to Active.');
    }

    const email = 'teststudent@gmail.com';
    
    // Delete existing student if any
    await Student.deleteMany({ email });
    console.log(`Cleared existing student with email ${email}`);

    // Create a new student that needs a password change and registration
    const newStudent = new Student({
      fullName: 'Test Student',
      email: email,
      mobile: '9876543210',
      password: 'Password@123',
      college: college._id,
      rollNumber: 'ROLL12345',
      mustChangePassword: true,
      isFirstLogin: true,
      isRegistered: false,
      status: 'active',
      profileStatus: 'pending'
    });

    await newStudent.save();
    console.log('Successfully created new student for onboarding verification:');
    console.log(JSON.stringify({
      id: newStudent._id,
      email: newStudent.email,
      mustChangePassword: newStudent.mustChangePassword,
      isRegistered: newStudent.isRegistered
    }, null, 2));

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

run();
