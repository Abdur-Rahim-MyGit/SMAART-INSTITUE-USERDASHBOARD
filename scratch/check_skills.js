const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/back-end/.env') });

async function check() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
  console.log('Connecting to:', uri);
  try {
    const conn = await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const skillDoc = await db.collection('skillassessments').findOne({});
    console.log('One skill assessment:', JSON.stringify(skillDoc, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
