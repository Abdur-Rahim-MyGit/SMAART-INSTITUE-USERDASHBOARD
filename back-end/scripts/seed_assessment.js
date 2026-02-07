require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedAssessment = async () => {
    try {
        console.log('Seeding Micro-Assessment...');

        // 1. Find the course (Assuming SMAART-101 or by code)
        // You might need to adjust this query to match the specific course you are working on
        let course = await Course.findOne({ courseCode: 'CRS00001' });

        if (!course) {
            console.log('Course CRS00001 not found, trying to find ANY course...');
            course = await Course.findOne();
        }

        if (!course) {
            console.error('No courses found in database.');
            process.exit(1);
        }

        console.log(`Found Course: ${course.title} (${course.courseCode})`);

        // 2. Define the Questions
        const questions = [
            {
                question: "A high-pressure engineering project faces intermittent failures, tight deadlines, and incomplete performance data. Stakeholders demand rapid results. Using CLEAR-5, what is the most rigorous decision approach?",
                type: "mcq",
                options: [
                    "Deploy immediately to satisfy stakeholders, monitor later.",
                    "Clarify the underlying problem, examine evidence rigorously, explore multiple options, assess consequences, respond with reasoned judgment.",
                    "Delay deployment indefinitely until all data is complete.",
                    "Delegate responsibility to reduce personal risk."
                ],
                correctAnswer: "Clarify the underlying problem, examine evidence rigorously, explore multiple options, assess consequences, respond with reasoned judgment.",
                points: 1,
                difficulty: "hard",
                explanation: "This option correctly follows the CLEAR-5 framework (Clarify, Look at evidence, Explore options, Assess consequences, Respond) rather than reacting to pressure."
            },
            {
                question: "A hospital emergency unit is overwhelmed. Some patients show obvious injuries; others report subtle symptoms. Media coverage increases pressure. Which reflects CLEAR-5 application under pressure?",
                type: "mcq",
                options: [
                    "Treat patients in order of arrival.",
                    "Clarify real risk, review evidence, explore triage strategies, assess outcomes, respond with judgment.",
                    "Focus only on visible injuries.",
                    "Wait for complete reports before action."
                ],
                correctAnswer: "Clarify real risk, review evidence, explore triage strategies, assess outcomes, respond with judgment.",
                points: 1,
                difficulty: "hard",
                explanation: "Triage based on CLEAR-5 logic prioritizes risk and evidence over simple FIFO or external pressure."
            },
            {
                question: "A manager must allocate limited resources between two initiatives: rapid market expansion vs. long-term operational stability. Stakeholders advocate both. What reflects critical thinking?",
                type: "mcq",
                options: [
                    "Fund rapid expansion for immediate returns.",
                    "Split funds equally without analysis.",
                    "Apply CLEAR-5: clarify priorities, examine evidence, explore options, assess consequences, respond with judgment prioritizing long-term sustainability.",
                    "Avoid decision indefinitely."
                ],
                correctAnswer: "Apply CLEAR-5: clarify priorities, examine evidence, explore options, assess consequences, respond with reasoned judgment prioritizing long-term sustainability.",
                points: 1,
                difficulty: "hard",
                explanation: "Active application of the framework to balance competing demands is the hallmark of critical thinking here."
            },
            {
                question: "A legal case has ambiguous evidence. Public pressure demands swift prosecution. What reflects proper critical thinking?",
                type: "mcq",
                options: [
                    "Rush prosecution to satisfy public opinion.",
                    "Clarify the core legal issue, analyze evidence (supporting & contradictory), explore strategies, assess consequences, respond with reasoned judgment.",
                    "Ignore ambiguous evidence.",
                    "Defer indefinitely."
                ],
                correctAnswer: "Clarify the core legal issue, analyze evidence (supporting & contradictory), explore strategies, assess consequences, respond with reasoned judgment.",
                points: 1,
                difficulty: "hard",
                explanation: "Weighing evidence and resisting bias/pressure is central to the 'Look at Evidence' step of CLEAR-5."
            },
            {
                question: "A project fails due to unclear problem definition and ignored early warning signals. What is the most effective learning approach using CLEAR-5?",
                type: "mcq",
                options: [
                    "Blame the team.",
                    "Conduct reflection using CLEAR-5: clarify the problem, review evidence, explore alternatives, assess consequences, respond with judgment.",
                    "Avoid reflection to move on quickly.",
                    "Rely on intuition only for future projects."
                ],
                correctAnswer: "Conduct reflection using CLEAR-5: clarify the problem, review evidence, explore alternatives, assess consequences, respond with judgment.",
                points: 1,
                difficulty: "medium",
                explanation: "Using the framework for retrospective analysis allows for structural learning."
            }
        ];

        // 3. Insert into Module 1 (assuming it exists)
        // Adjust index if needed. Module 1 is usually index 0.
        const targetModuleIndex = 0;

        if (!course.modules[targetModuleIndex]) {
            console.error('Module 1 not found.');
            process.exit(1);
        }

        // Initialize microAssessments array if it doesn't exist
        if (!course.modules[targetModuleIndex].microAssessments) {
            course.modules[targetModuleIndex].microAssessments = [];
        }

        // Check if assessment already exists for Day 3
        const existingIndex = course.modules[targetModuleIndex].microAssessments.findIndex(ma => ma.dayId === 3);

        const newAssessment = {
            moduleId: 1,
            dayId: 3,
            stepId: 2, // Assuming it comes after the video (step 1)
            title: "STEP 4 — MICRO-ASSESSMENT",
            questions: questions
        };

        if (existingIndex > -1) {
            console.log('Updating existing assessment for Day 3...');
            course.modules[targetModuleIndex].microAssessments[existingIndex] = newAssessment;
        } else {
            console.log('Adding new assessment for Day 3...');
            course.modules[targetModuleIndex].microAssessments.push(newAssessment);
        }

        await course.save();
        console.log('✅ Success! Micro-Assessment seeded for Module 1, Day 3.');

        mongoose.disconnect();
    } catch (error) {
        console.error('Seeding Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

seedAssessment();
