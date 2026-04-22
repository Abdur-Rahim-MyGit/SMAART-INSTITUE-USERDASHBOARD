const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Result = require('./models/Result');
const Assessment = require('./models/Assessment');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const t2 = await Assessment.findOne({ assessmentCode: 'ASM00002' });
        if (!t2) {
            console.log('T2 Assessment not found');
            process.exit(1);
        }

        const results = await Result.find({
            assessmentId: t2._id,
            completionStatus: 'in-progress'
        });

        console.log(`Found ${results.length} in-progress T2 results.`);
        results.forEach(r => {
            console.log(`\nUser: ${r.userId}`);
            console.log(`Result ID: ${r._id}`);
            console.log(`Questions in order: ${r.questionOrder ? r.questionOrder.length : 'NULL'}`);
            console.log(`Responses: ${r.responses.length}`);
            console.log(`Total Questions field: ${r.totalQuestions}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
