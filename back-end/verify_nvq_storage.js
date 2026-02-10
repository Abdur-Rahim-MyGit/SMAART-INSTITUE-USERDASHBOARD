require('dotenv').config();
const mongoose = require('mongoose');
const CourseEnrollment = require('./models/CourseEnrollment');
const Course = require('./models/Course');
const User = require('./models/User');

const verifyNvqStorage = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne(); // Get any user
        if (!user) {
            console.log('No user found');
            mongoose.disconnect();
            return;
        }

        const courseCode = 'CRS00001';
        const moduleId = 1;
        const dayId = 3;
        const stepId = 3; // Step 3 is NVQ Reflection

        const testData = {
            studentId: user._id,
            courseCode: courseCode,
            moduleId: moduleId,
            dayId: dayId,
            stepId: stepId,
            score: 45,
            totalPoints: 50,
            responses: {
                likert_1: 4,
                likert_2: 5,
                choice_1: "Collect evidence and explore options using a structured approach",
                free_text_1: "Test reflection situation description for verification."
            }
        };

        // Simulate the API call logic
        console.log('Simulating /task-result update...');

        const course = await Course.findOne({ courseCode });
        let enrollment = await CourseEnrollment.findOne({
            student: user._id,
            course: course._id
        });

        if (!enrollment) {
            enrollment = new CourseEnrollment({
                student: user._id,
                course: course._id,
                status: 'in_progress',
                moduleProgress: []
            });
        }

        const moduleIndex = parseInt(moduleId) - 1;
        const moduleDoc = course.modules[moduleIndex];
        let modProgress = enrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());

        if (!modProgress) {
            enrollment.moduleProgress.push({
                module: moduleDoc._id,
                taskResults: []
            });
            modProgress = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
        }

        const existingResult = modProgress.taskResults.find(r => r.dayId === dayId && r.stepId === stepId);
        if (existingResult) {
            existingResult.score = testData.score;
            existingResult.totalPoints = testData.totalPoints;
            existingResult.responses = testData.responses;
            existingResult.completedAt = new Date();
        } else {
            modProgress.taskResults.push({
                dayId: dayId,
                stepId: stepId,
                score: testData.score,
                totalPoints: testData.totalPoints,
                responses: testData.responses,
                completedAt: new Date()
            });
        }

        enrollment.markModified('moduleProgress');
        await enrollment.save();
        console.log('✅ Simulated save completed.');

        // Re-fetch to verify
        const updatedEnrollment = await CourseEnrollment.findById(enrollment._id);
        const savedModProgress = updatedEnrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());
        const savedResult = savedModProgress.taskResults.find(r => r.dayId === dayId && r.stepId === stepId);

        console.log('--- Verification Results ---');
        console.log('Score:', savedResult.score);
        console.log('Total Points:', savedResult.totalPoints);
        console.log('Responses:', JSON.stringify(savedResult.responses, null, 2));

        if (savedResult.score === 45 && savedResult.responses.likert_1 === 4) {
            console.log('✅ PASSED: NVQ Data stored correctly.');
        } else {
            console.log('❌ FAILED: Data mismatch.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

verifyNvqStorage();
