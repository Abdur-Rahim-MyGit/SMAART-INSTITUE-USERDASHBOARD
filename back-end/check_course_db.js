require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const checkDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const courses = await Course.find({ courseCode: { $in: ['CRS00004', 'CRS00009'] } });
        for (const course of courses) {
            console.log(`\n===========================================`);
            console.log(`Course Code: ${course.courseCode}`);
            console.log(`Title: ${course.title}`);
            
            // Check modules day 1 video content
            const day1 = course.modules?.[0]?.days?.[0] || {};
            console.log(`Day 1 Title: ${day1.moduleDetails?.title}`);
            console.log(`Day 1 Video URL: ${day1.videoContent?.videoUrl || day1.VideoContent?.[0]?.videoUrl}`);
            console.log(`Day 1 Video Transcription: ${day1.videoContent?.transcription || day1.VideoContent?.[0]?.transcription}`);

            // Check learningFlow
            const lf = course.learningFlow || {};
            console.log(`learningFlow.stepA_Why.videoUrl: ${lf.stepA_Why?.videoUrl}`);
            console.log(`learningFlow.stepB_Story.videoUrl: ${lf.stepB_Story?.videoUrl}`);
            console.log(`learningFlow.stepC_Framework.videoUrl: ${lf.stepC_Framework?.videoUrl}`);
        }

        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkDb();
