require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { runDailyRollup } = require('../services/cronService');
const DailyAnalytics = require('../models/DailyAnalytics');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minds';

console.log('Connecting to MongoDB at:', mongoURI);
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB. Running daily rollup...');
  
  // Trigger rollup
  await runDailyRollup();

  console.log('Fetching rollup results from DailyAnalytics...');
  const results = await DailyAnalytics.find().sort({ date: -1 }).limit(1);

  if (results.length > 0) {
    console.log('✅ Rollup results found:');
    console.log(JSON.stringify(results[0], null, 2));
  } else {
    console.log('❌ No rollup results found in DailyAnalytics.');
  }

  await mongoose.connection.close();
  console.log('Closed MongoDB connection.');
})
.catch(err => {
  console.error('Connection/Execution error:', err);
  process.exit(1);
});
