require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const fixStep6Content = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });

        const module1 = course.modules[0];
        const day3 = module1.days?.find(d => d.dayNumber === 3);

        if (!day3) {
            console.log('Day 3 not found');
            mongoose.disconnect();
            return;
        }

        const triggerContent = {
            title: "Post-Employment Application Trigger",
            instructions: "Career application trigger - Reflect on how your mastery of Critical Thinking will help you in your job search and career growth!",
            questions: [
                {
                    id: "career_impact",
                    type: "text",
                    question: "How will these critical thinking and decision-making skills give you a competitive edge in your career? Describe 2 specific ways you would demonstrate this mastery to a prospective employer.",
                    required: true
                }
            ]
        };

        const step6 = day3.steps.find(s => s.stepNumber === 6);
        if (step6) {
            step6.title = "STEP 6: Post-Employment Application Trigger";
            step6.type = 'reflection';
            step6.content = triggerContent;
            console.log('✅ Updated Step 6 content to Trigger style.');
        } else {
            console.log('❌ Step 6 not found in Day 3.');
        }

        course.markModified('modules');
        await course.save();
        console.log('✅ Changes saved to database.');

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

fixStep6Content();
