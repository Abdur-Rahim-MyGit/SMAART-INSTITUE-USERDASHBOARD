const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assessment = require('./models/Assessment');

dotenv.config();

const checkAssessments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/student-learning-platform");

        const assessments = await Assessment.find({});
        console.log(`Found ${assessments.length} assessments.`);

        assessments.forEach(a => {
            console.log(`ID: ${a._id}`);
            console.log(`Name: ${a.title || a.assessmentName || 'No Name'}`);
            console.log(`Code: ${a.assessmentCode}`);
            console.log(`Category: ${a.questionCategory}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAssessments();
