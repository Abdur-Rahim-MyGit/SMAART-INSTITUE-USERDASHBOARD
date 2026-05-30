const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');

const MONGODB_URI = 'mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = '4289a69b76858e7235a968bd0a5c43d2c1845f9e7b2d5a3c9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f';

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const User = require('../models/User');
    const user = await User.findOne({ fullName: /rahman/i });
    if (!user) {
      console.error('Rahman user not found.');
      return;
    }

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    console.log('Generated Token:', token);

    // Make local HTTP request to backend
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/student',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Response Body:', body);
        mongoose.disconnect();
      });
    });

    req.on('error', (err) => {
      console.error('HTTP Request Error:', err);
      mongoose.disconnect();
    });

    req.end();

  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}

test();
