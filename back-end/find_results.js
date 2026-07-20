const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Result = require('./models/Result');

async function find() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
  try {
    await mongoose.connect(uri);
    
    const results = await Result.find({ assessmentId: new mongoose.Types.ObjectId("6a5a2792bc1532c9c8fcb259") });
    console.log(`Total skill results in DB: ${results.length}`);
    for (const r of results) {
      console.log({
        id: r._id,
        userId: r.userId,
        assessmentId: r.assessmentId,
        assessmentCode: r.assessmentCode,
        completionStatus: r.completionStatus,
        responsesCount: r.responses.length,
        questionOrder: r.questionOrder
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

find();
