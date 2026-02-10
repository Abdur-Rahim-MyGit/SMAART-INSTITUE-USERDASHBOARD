require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const adjustDay3Steps = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.error('Course CRS00001 not found');
            process.exit(1);
        }

        console.log(`Found Course: ${course.title}`);

        const module = course.modules[0]; // Module 1
        const day3 = module.days.find(d => d.dayNumber === 3);

        if (!day3) {
            console.error('Day 3 not found in Module 1');
            process.exit(1);
        }

        console.log('Adjusting Day 3 steps to remove intro video...');

        // Get existing Step 5 content (which already has Q1, Q2, Q3)
        const existingStep5 = day3.steps.find(s => s.stepNumber === 3); // Current step 3 is the submission

        // Reconstruct the steps array WITHOUT the intro video
        day3.steps = [
            {
                stepNumber: 1,
                title: 'STEP 4 — MICRO-ASSESSMENT',
                type: 'assessment',
                content: {
                    title: 'STEP 4 — MICRO-ASSESSMENT',
                    questions: [] // This will be populated from microAssessments
                },
                isRequired: true
            },
            {
                stepNumber: 2,
                title: 'STEP 5: Evidence Task (Artefact)',
                type: 'submission',
                content: existingStep5?.content || {
                    instructions: 'Clear task requirements: Submit an artefact that demonstrates the application of the CLEAR-5 framework in a real context.',
                    rubric: [
                        'Problem Clarification (20%)',
                        'Evidence Analysis (20%)',
                        'Option Exploration (20%)',
                        'Consequence Assessment (20%)',
                        'Reasoned Judgment (20%)'
                    ],
                    examples: [
                        'Decision note',
                        'Checklist created',
                        'Framework application document',
                        'Analysis report'
                    ],
                    learningOutcome: 'Student creates tangible evidence of skill application',
                    scenarios: existingStep5?.content?.scenarios || []
                },
                isRequired: true
            },
            {
                stepNumber: 3,
                title: 'STEP 6: Reflection (NVQ-Style)',
                type: 'reflection',
                content: {
                    title: 'NVQ-Style Reflection',
                    instructions: 'Reflect on your application of the CLEAR-5 framework in the Evidence Task.',
                    questions: [
                        {
                            id: 'what-happened',
                            question: 'What happened? (Describe the situation)',
                            type: 'long-text',
                            required: true
                        },
                        {
                            id: 'what-did-you-do',
                            question: 'What did you do? (Your actions and decisions)',
                            type: 'long-text',
                            required: true
                        },
                        {
                            id: 'what-worked',
                            question: 'What worked well?',
                            type: 'long-text',
                            required: true
                        },
                        {
                            id: 'what-could-improve',
                            question: 'What could you improve?',
                            type: 'long-text',
                            required: true
                        },
                        {
                            id: 'what-learned',
                            question: 'What did you learn?',
                            type: 'long-text',
                            required: true
                        }
                    ]
                },
                isRequired: true
            },
            {
                stepNumber: 4,
                title: 'STEP 7: Flash Card + Interview Prep',
                type: 'flashcard',
                content: {
                    title: 'Critical Thinking Flash Cards',
                    cards: [
                        {
                            front: 'What does the C in CLEAR-5 stand for?',
                            back: 'Clarify - Define the problem clearly before proceeding.'
                        },
                        {
                            front: 'What does the L in CLEAR-5 stand for?',
                            back: 'Look at Evidence - Gather and analyze relevant data.'
                        },
                        {
                            front: 'What does the E in CLEAR-5 stand for?',
                            back: 'Explore Options - Consider multiple solutions.'
                        },
                        {
                            front: 'What does the A in CLEAR-5 stand for?',
                            back: 'Assess Consequences - Evaluate the impact of each option.'
                        },
                        {
                            front: 'What does the R in CLEAR-5 stand for?',
                            back: 'Respond - Make a reasoned judgment and take action.'
                        }
                    ],
                    interviewTips: [
                        'Use the CLEAR-5 framework to structure your answers to behavioral questions.',
                        'Provide specific examples from your Evidence Task when discussing problem-solving.',
                        'Demonstrate your ability to think critically under pressure.'
                    ]
                },
                isRequired: false
            },
            {
                stepNumber: 5,
                title: 'STEP 8: Post-Employment Application Trigger',
                type: 'reflection',
                content: {
                    title: 'Career Readiness Check',
                    instructions: 'Reflect on your readiness to apply these skills in a professional setting.',
                    questions: [
                        {
                            id: 'confidence-level',
                            question: 'How confident do you feel applying the CLEAR-5 framework in real-world scenarios?',
                            type: 'scale',
                            min: 1,
                            max: 10,
                            required: true
                        },
                        {
                            id: 'application-areas',
                            question: 'In which areas of your future career do you see yourself using critical thinking most?',
                            type: 'long-text',
                            required: true
                        }
                    ],
                    trigger: {
                        type: 'employment-application',
                        message: 'You are now ready to explore employment opportunities that value critical thinking!'
                    }
                },
                isRequired: false
            }
        ];

        // Mark the module as modified
        course.markModified('modules');
        await course.save();

        console.log('✅ Day 3 steps successfully adjusted!');
        console.log(`Total steps: ${day3.steps.length}`);

        // Display step summary
        day3.steps.forEach(step => {
            console.log(`  Step ${step.stepNumber}: ${step.title} (${step.type})`);
        });

        mongoose.disconnect();
    } catch (error) {
        console.error('Migration Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

adjustDay3Steps();
