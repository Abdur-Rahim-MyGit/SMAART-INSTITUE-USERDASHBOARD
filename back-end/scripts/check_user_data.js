
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BaseLineResult = require('../models/BaseLineResult');
const Result = require('../models/Result');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const userId = '691c4a243408254901245d8d';

// Use exact URI from .env
const mongoUri = "mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds";

async function checkData() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const baselines = await BaseLineResult.find({ userId });
        console.log(`Found ${baselines.length} BaseLineResult documents for user ${userId}`);
        baselines.forEach(b => console.log(` - ID: ${b._id}, CreatedAt: ${b.createdAt}`));

        const results = await Result.find({ userId, assessmentCode: 'ASM00001' });
        console.log(`Found ${results.length} Result (attempt) documents for user ${userId}`);
        results.forEach(r => console.log(` - ID: ${r._id}, Status: ${r.completionStatus}, TotalQs: ${r.totalQuestions}`));

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkData();
