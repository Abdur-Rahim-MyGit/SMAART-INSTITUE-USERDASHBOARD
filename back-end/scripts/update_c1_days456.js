require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });

const targetVideoUrl = "https://player.cloudinary.com/embed/?cloud_name=dlpmrdcqp&public_id=WhatsApp_Video_2026-01-19_at_14.40.51_r2quoy";
const targetIntroText = [
    "What is this skill? This skill is the foundation of structured problem…",
    "Why is it important? In a world of information overload, this skill al…",
    "Where will you use it? You'll use it in professional decision-making, …",
    "Learning Outcome: Student understands the skill’s relevance and contex…"
];

const updateCourseContent = async () => {
    try {
        const course = await Course.findOne({ courseCode: "CRS00001" });
        if (!course) {
            console.error('Course CRS00001 not found.');
            mongoose.disconnect();
            return;
        }

        console.log(`Updating Course: ${course.title} (${course.courseCode})`);

        const module1 = course.modules[0];
        if (!module1) {
            console.error("Module 1 not found.");
            mongoose.disconnect();
            return;
        }

        const targetDayNumbers = [4, 5, 6];

        targetDayNumbers.forEach(dayNum => {
            let day = module1.days.find(d => d.dayNumber === dayNum);

            const dayTitle = dayNum === 4 ? "Advanced Critical Thinking" : (dayNum === 5 ? "Logical Frameworks" : "Practical Application");
            const dayDesc = "Scaling your critical thinking skills into real-world professional contexts.";

            if (!day) {
                console.log(`Day ${dayNum} missing in Module 1. Creating it...`);
                day = {
                    dayNumber: dayNum,
                    dayType: 'course',
                    moduleDetails: {
                        title: dayTitle,
                        description: dayDesc
                    },
                    steps: [
                        {
                            stepNumber: 1,
                            title: 'Skill Orientation',
                            type: 'video',
                            content: {
                                videoUrl: targetVideoUrl,
                                title: 'Skill Orientation',
                                description: 'Understanding the core concepts for this session.'
                            },
                            introText: targetIntroText,
                            isRequired: true
                        },
                        {
                            stepNumber: 2,
                            title: 'Story Episode',
                            type: 'video',
                            content: {
                                videoUrl: targetVideoUrl,
                                title: 'Story Episode',
                                description: 'Real-world application of the skill.'
                            },
                            introText: targetIntroText,
                            isRequired: true
                        },
                        {
                            stepNumber: 3,
                            title: 'Founder Video',
                            type: 'video',
                            content: {
                                videoUrl: targetVideoUrl,
                                title: 'Founder Insight',
                                description: 'Expert advice on mastering this skill.'
                            },
                            introText: targetIntroText,
                            isRequired: true
                        }
                    ]
                };
                module1.days.push(day);
            } else {
                console.log(`Updating existing Day ${dayNum} in Module 1...`);
                // Ensure metadata is set correctly in moduleDetails
                if (!day.moduleDetails) day.moduleDetails = {};
                day.moduleDetails.title = dayTitle;
                day.moduleDetails.description = dayDesc;

                if (day.steps && day.steps.length > 0) {
                    day.steps.forEach(step => {
                        if (step.type === 'video') {
                            step.videoUrl = targetVideoUrl;
                            step.introText = targetIntroText;
                            if (step.content) step.content.videoUrl = targetVideoUrl;
                        }
                    });
                }
            }
        });

        // Also sync other modules for consistency
        course.modules.forEach((mod, mIdx) => {
            if (mIdx === 0) return;
            mod.days.forEach(day => {
                if (targetDayNumbers.includes(day.dayNumber)) {
                    console.log(`Updating Module ${mIdx + 1} Day ${day.dayNumber}...`);
                    if (day.steps && day.steps.length > 0) {
                        day.steps.forEach(step => {
                            if (step.type === 'video') {
                                step.videoUrl = targetVideoUrl;
                                step.introText = targetIntroText;
                                if (step.content) step.content.videoUrl = targetVideoUrl;
                            }
                        });
                    }
                }
            });
        });

        course.markModified('modules');
        await course.save();
        console.log('✅ Success! Course 1 content (metadata & steps) updated.');
        mongoose.disconnect();
    } catch (err) {
        console.error('Update Error:', err);
        mongoose.disconnect();
        process.exit(1);
    }
};

updateCourseContent();
