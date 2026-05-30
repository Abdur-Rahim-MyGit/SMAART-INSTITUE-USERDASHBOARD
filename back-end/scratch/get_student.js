const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const User = require('../models/User');
  const student = await User.findOne({ role: 'student' }).lean();
  console.log('STUDENT EMAIL:', student?.email);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
