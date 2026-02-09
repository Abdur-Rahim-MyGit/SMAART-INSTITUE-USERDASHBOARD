const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Course = require('../models/Course');

async function verifyTimestamps() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const courses = await Course.find({}).limit(1);

        if (courses.length === 0) {
            console.log('No courses found.');
            return;
        }

        const course = courses[0];
        const module = course.modules[0]; // Assuming at least one module
        const day = module.days[0]; // Assuming at least one day

        // Check transcription in day.videoContent, summaryVideo, steps...
        let sample = null;

        if (day.videoContent && day.videoContent.transcription) sample = day.videoContent.transcription;
        else if (day.summaryVideo && day.summaryVideo.transcription) sample = day.summaryVideo.transcription;
        else if (day.steps && day.steps.length > 0) {
            const videoStep = day.steps.find(s => s.type === 'video' && s.content.transcription);
            if (videoStep) sample = videoStep.content.transcription;
        }

        if (sample) {
            console.log('Sample Transcription Content:');
            console.log('-----------------------------');
            console.log(sample.substring(0, 500)); // Print first 500 chars
            console.log('-----------------------------');

            if (sample.match(/\[\d{2}:\d{2}\]/)) {
                console.log('SUCCESS: Timestamps found.');
            } else {
                console.log('FAILURE: No timestamps found.');
            }
        } else {
            console.log('No video content found in the first day of the first course to verify.');
        }

    } catch (error) {
        console.error('Verification error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

verifyTimestamps();
