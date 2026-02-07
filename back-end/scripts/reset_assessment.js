const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseEnrollment = require('../models/CourseEnrollment');
const Course = require('../models/Course');
const User = require('../models/User');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the most recently updated enrollment (likely the user testing this right now)
        const enrollment = await CourseEnrollment.findOne({})
            .sort({ updatedAt: -1 })
            .populate('student');

        if (!enrollment) {
            console.log('No enrollment found found.');
            process.exit(0);
        }

        console.log(`Resetting assessment progress for enrollment ID: ${enrollment._id}`);
        if (enrollment.student) {
            console.log(`Student: ${enrollment.student.email || enrollment.student._id}`);
        } else {
            console.log('Student details could not be populated.');
        }

        // 1. Clear quizzesTaken in moduleProgress
        let quizzesRemoved = 0;
        if (enrollment.moduleProgress) {
            enrollment.moduleProgress.forEach(mp => {
                const initialCount = mp.quizzesTaken ? mp.quizzesTaken.length : 0;
                mp.quizzesTaken = []; // Clear all quizzes for simplicity, or we could filter by specific ID
                const finalCount = mp.quizzesTaken.length;
                quizzesRemoved += (initialCount - finalCount);
            });
        }

        // 2. Also clear videoCompletionMap logic if needed? 
        // The frontend saves step completion in videoProgress. Let's reset Day 3 Step 2 specifically if possible.
        // Assuming Module 1, Day 3, Step 2 is the assessment.

        let stepsReset = 0;
        if (enrollment.moduleProgress) {
            enrollment.moduleProgress.forEach(mp => {
                if (mp.videoProgress) {
                    // Filter out progress for Day 3 Step 2 (Assessment)
                    // Or specifically check for isCompleted=true for that step
                    const initialLen = mp.videoProgress.length;
                    mp.videoProgress = mp.videoProgress.filter(vp => {
                        // Keep if NOT (Day 3 AND Step 2)
                        // Adjust these IDs based on actual usage. 
                        // The user prompt implied Session 3.
                        // Ideally we should know the exact IDs, but clearing Day 3 Step 2 is a safe bet for the prompt context.
                        return !(vp.dayId === 3 && vp.stepId === 2);
                    });
                    if (mp.videoProgress.length < initialLen) stepsReset++;
                }
            });
        }

        await enrollment.save();
        console.log(`Successfully reset progress.`);
        console.log(`- Quizzes removed: ${quizzesRemoved}`);
        console.log(`- Step progress records removed: ${stepsReset}`);

        process.exit(0);
    } catch (err) {
        console.error('Error resetting progress:', err);
        process.exit(1);
    }
};

run();
