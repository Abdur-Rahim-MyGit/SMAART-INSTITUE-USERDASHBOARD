const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Course = require('../models/Course');

const randomSentences = [
    "In this module, we will explore the fundamental concepts of cognitive psychology and how they apply to everyday decision making.",
    "Understanding the user's perspective is critical when designing any interface, as it directly impacts engagement and retention.",
    "Let's take a moment to reflect on the core principles we discussed in the previous session and how they interconnect.",
    "The data clearly shows a significant correlation between initial engagement metrics and long-term success rates.",
    "One effective strategy is to break down complex problems into smaller, manageable components.",
    "Consistency is key in building trust, whether in personal relationships or professional environments.",
    "Notice how the color palette influences the emotional tone of the design, guiding the user's attention subtly.",
    "We must always consider the ethical implications of our choices, especially when dealing with sensitive user data.",
    "By analyzing these patterns, we can predict future behaviors with a higher degree of accuracy.",
    "The implementation phase is where theoretical knowledge meets practical application, revealing unforeseen challenges.",
    "Remember, feedback loops are essential for continuous improvement and agile adaptation.",
    "Let's dive deeper into the code structure to understand how the components communicate with each other.",
    "Visual hierarchy helps users navigate content intuitively, reducing cognitive load.",
    "Effective communication requires not just speaking clearly, but also listening actively to understand the underlying needs.",
    "Innovation often comes from combining two seemingly unrelated concepts to create something entirely new."
];

function getRandomTimestampedTranscription() {
    let currentTime = 0;
    let transcription = "";
    const totalDuration = 180 + Math.floor(Math.random() * 300); // 3 to 8 minutes approx

    while (currentTime < totalDuration) {
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        const timeString = `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}]`;

        // Pick 1-3 sentences
        const sentenceCount = 1 + Math.floor(Math.random() * 3);
        let text = "";
        for (let i = 0; i < sentenceCount; i++) {
            text += randomSentences[Math.floor(Math.random() * randomSentences.length)] + " ";
        }

        transcription += `${timeString} ${text.trim()}\n\n`;

        // Increment time by 15-45 seconds
        currentTime += 15 + Math.floor(Math.random() * 30);
    }

    return transcription.trim();
}

async function addRandomTranscriptions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses to check.`);

        let updatedCount = 0;

        for (const course of courses) {
            let changed = false;
            let stepsChanged = false;

            if (course.modules) {
                // Iterate as modules -> days -> steps
                for (let m = 0; m < course.modules.length; m++) {
                    const module = course.modules[m];
                    if (module.days) {
                        for (let d = 0; d < module.days.length; d++) {
                            const day = module.days[d];

                            // Helper to update if needed
                            const updateTranscription = (obj, context) => {
                                // FORCE UPDATE: Verify if it looks like a timestamped transcription.
                                // If it doesn't start with '[', it's likely the old lorem ipsum.
                                if (!obj.transcription || !obj.transcription.trim().startsWith('[')) {
                                    obj.transcription = getRandomTimestampedTranscription();
                                    changed = true;
                                    console.log(`Updated transcription: Course ${course.courseCode}, Mod ${module.sequence}, Day ${day.dayNumber} (${context})`);
                                    return true;
                                }
                                return false;
                            };

                            // 1. Check `videoContent` (Object)
                            if (day.videoContent && typeof day.videoContent === 'object' && !Array.isArray(day.videoContent)) {
                                updateTranscription(day.videoContent, 'videoContent obj');
                            }

                            // 2. Check `VideoContent` (Array - Legacy)
                            if (day.VideoContent && Array.isArray(day.VideoContent)) {
                                for (let i = 0; i < day.VideoContent.length; i++) {
                                    updateTranscription(day.VideoContent[i], 'VideoContent arr');
                                }
                            }

                            // 3. Check `videoContent` (Array)
                            if (day.videoContent && Array.isArray(day.videoContent)) {
                                for (let i = 0; i < day.videoContent.length; i++) {
                                    updateTranscription(day.videoContent[i], 'videoContent arr');
                                }
                            }

                            // 4. Check `summaryVideo` (Object)
                            if (day.summaryVideo && typeof day.summaryVideo === 'object') {
                                updateTranscription(day.summaryVideo, 'summaryVideo');
                            }

                            // 5. Check `steps` (Array)
                            if (day.steps && Array.isArray(day.steps)) {
                                for (let s = 0; s < day.steps.length; s++) {
                                    const step = day.steps[s];
                                    if (step.type === 'video' && step.content) {
                                        if (updateTranscription(step.content, `Step ${step.stepNumber}`)) {
                                            stepsChanged = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (changed) {
                if (stepsChanged) {
                    // Explicitly mark 'modules' as modified because steps.content is Mixed type
                    course.markModified('modules');
                }
                await course.save();
                updatedCount++;
                console.log(`Saved updates for course: ${course.courseCode}`);
            }
        }

        console.log(`\nMigration complete. Updated ${updatedCount} courses.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    }
}

addRandomTranscriptions();
