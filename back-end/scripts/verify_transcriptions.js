const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Course = require('../models/Course');

async function verifyTranscriptions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses.`);

        let totalVideos = 0;
        let missingTranscriptions = 0;

        for (const course of courses) {
            if (course.modules && course.modules.length > 0) {
                for (const module of course.modules) {
                    if (module.days && module.days.length > 0) {
                        for (const day of module.days) {

                            // 1. Check `videoContent` (Object)
                            if (day.videoContent && typeof day.videoContent === 'object' && !Array.isArray(day.videoContent)) {
                                totalVideos++;
                                if (!day.videoContent.transcription) {
                                    console.log(`Missing transcription: Course ${course.courseCode}, Mod ${module.sequence}, Day ${day.dayNumber} (videoContent obj)`);
                                    missingTranscriptions++;
                                }
                            }

                            // 2. Check `VideoContent` (Array - Legacy)
                            if (day.VideoContent && Array.isArray(day.VideoContent)) {
                                for (const video of day.VideoContent) {
                                    totalVideos++;
                                    if (!video.transcription) {
                                        console.log(`Missing transcription: Course ${course.courseCode}, Mod ${module.sequence}, Day ${day.dayNumber} (VideoContent arr)`);
                                        missingTranscriptions++;
                                    }
                                }
                            }

                            // 3. Check `videoContent` (Array)
                            if (day.videoContent && Array.isArray(day.videoContent)) {
                                for (const video of day.videoContent) {
                                    totalVideos++;
                                    if (!video.transcription) {
                                        console.log(`Missing transcription: Course ${course.courseCode}, Mod ${module.sequence}, Day ${day.dayNumber} (videoContent arr)`);
                                        missingTranscriptions++;
                                    }
                                }
                            }

                            // 4. Check `summaryVideo` (Object)
                            if (day.summaryVideo && typeof day.summaryVideo === 'object') {
                                totalVideos++;
                                if (!day.summaryVideo.transcription) {
                                    console.log(`Missing transcription: Course ${course.courseCode}, Mod ${module.sequence}, Day ${day.dayNumber} (summaryVideo)`);
                                    missingTranscriptions++;
                                }
                            }

                            // 5. Check `steps` (Array)
                            if (day.steps && Array.isArray(day.steps)) {
                                for (const step of day.steps) {
                                    if (step.type === 'video' && step.content) {
                                        totalVideos++;
                                        if (!step.content.transcription) {
                                            console.log(`Missing transcription: Course ${course.courseCode}, Mod ${module.sequence}, Day ${day.dayNumber}, Step ${step.stepNumber}`);
                                            missingTranscriptions++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log(`\nVerification complete.`);
        console.log(`Total videos found: ${totalVideos}`);
        console.log(`Missing transcriptions: ${missingTranscriptions}`);

        if (missingTranscriptions === 0) {
            console.log('SUCCESS: All videos have transcriptions.');
        } else {
            console.log('FAILURE: Some videos are missing transcriptions.');
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    }
}

verifyTranscriptions();
