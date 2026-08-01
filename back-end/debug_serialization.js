require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    // Instead of doing HTTP, I'll just simulate what normalizeJob does and print JSON.stringify
    const db = mongoose.connection.db;
    const doc = await db.collection('jobpostings').findOne({title: 'React Native Developer'});
    
    // Simulate what the backend returns
    console.log("Raw doc jobFairId:", doc.jobFairId);
    
    const normalized = {
      ...doc,
      __company: undefined,
      __recruiter: undefined,
      __college: undefined,
      __jobFair: undefined,
      _id: doc._id?.toString?.() || doc._id,
      displayTitle: doc.title,
    };
    
    console.log("Normalized jobFairId:", normalized.jobFairId);
    
    const jsonStr = JSON.stringify(normalized);
    const parsed = JSON.parse(jsonStr);
    
    console.log("After JSON stringify+parse:", parsed.jobFairId);
    
    process.exit(0);
});
