const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // Get a real student user from database
    const userDoc = await db.collection('students').findOne({ email: 'sharuk@gmail.com' });
    if (!userDoc) {
      console.error('No users found in DB!');
      process.exit(1);
    }
    console.log('User found:', userDoc._id, userDoc.email);

    // Sign a token like the real login does
    const payload = {
      userId: userDoc._id,
      email: userDoc.email,
      userType: 'student'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });

    // Send HTTP request to local server running on port 5000
    const assessmentId = '6a5a2792bc1532c9c8fcb259';
    const url = `http://localhost:5000/api/results/assessment/${assessmentId}/start`;
    console.log(`Sending GET request to: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('HTTP Status:', response.status);
    const responseText = await response.text();
    console.log('Response Body:', responseText);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
