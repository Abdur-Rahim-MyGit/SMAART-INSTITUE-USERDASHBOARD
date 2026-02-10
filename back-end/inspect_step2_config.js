require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspectDay3Step2 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.log('Course not found');
            process.exit(1);
        }

        const module1 = course.modules[0];
        const day3 = module1.days.find(d => d.dayNumber === 3);

        if (!day3) {
            console.log('Day 3 not found');
            process.exit(1);
        }

        const step2 = day3.steps.find(s => s.stepNumber === 2);

        console.log('\n=== DAY 3 STEP 2 ===');
        console.log('Title:', step2.title);
        console.log('Type:', step2.type);
        console.log('\nContent structure:');
        console.log(JSON.stringify(step2.content, null, 2));

        // Also check microAssessments array
        console.log('\n=== MICRO-ASSESSMENTS ===');
        const ma = module1.microAssessments?.find(m => m.dayId === 3);
        if (ma) {
            console.log('Found MA for Day 3');
            console.log('Questions count:', ma.questions?.length);
            if (ma.questions && ma.questions.length > 0) {
                console.log('\nFirst 3 questions:');
                ma.questions.slice(0, 3).forEach((q, i) => {
                    console.log(`\nQ${i + 1}:`, q.question.substring(0, 100) + '...');
                    console.log('Type:', q.type);
                    console.log('Options count:', q.options?.length);
                });
            }
        } else {
            console.log('No MA found for Day 3');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
};

inspectDay3Step2();
