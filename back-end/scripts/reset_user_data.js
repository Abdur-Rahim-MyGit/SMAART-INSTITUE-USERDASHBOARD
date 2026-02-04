
const mongoose = require('mongoose');
const BaseLineResult = require('../models/BaseLineResult');
const Result = require('../models/Result');

const mongoUri = "mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds";
const userId = '691c4a243408254901245d8d';

async function resetData() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const deletedBaseline = await BaseLineResult.deleteMany({ userId });
        console.log(`Deleted ${deletedBaseline.deletedCount} BaseLineResult documents.`);

        const deletedResult = await Result.deleteMany({ userId, assessmentCode: 'ASM00001' });
        console.log(`Deleted ${deletedResult.deletedCount} Result (attempt) documents.`);

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

resetData();
