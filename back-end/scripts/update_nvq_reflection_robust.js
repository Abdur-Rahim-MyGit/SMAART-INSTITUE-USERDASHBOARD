require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const updateNVQReflectionRobust = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) throw new Error('Course CRS00001 not found');

        let updated = false;
        course.modules.forEach(module => {
            module.days.forEach(day => {
                if (day.dayNumber === 3) {
                    const step3 = day.steps.find(s => s.stepNumber === 3 || s._id.toString() === '698acc34147220afd4911392');
                    if (step3) {
                        console.log('Found Step 3, updating content...');
                        step3.title = "STEP 3: Reflection (NVQ-Style)";
                        step3.content = {
                            title: "Reflection (NVQ-Style)",
                            instructions: "Purpose: Learning transfer and reflective practice. Time: 5 min. Assessment: Not scored (monitored for tracking).",
                            questions: [
                                {
                                    id: "likert_1",
                                    type: "scale",
                                    question: "I feel confident identifying and clarifying complex problems in my work.",
                                    min: 1,
                                    max: 5,
                                    required: true
                                },
                                {
                                    id: "likert_2",
                                    type: "scale",
                                    question: "I consistently consider multiple perspectives and evidence before making decisions.",
                                    min: 1,
                                    max: 5,
                                    required: true
                                },
                                {
                                    id: "likert_3",
                                    type: "scale",
                                    question: "I can assess risks and potential consequences of my actions effectively.",
                                    min: 1,
                                    max: 5,
                                    required: true
                                },
                                {
                                    id: "choice_1",
                                    type: "choice",
                                    question: "When faced with a complex decision, I:",
                                    required: true,
                                    options: [
                                        { text: "Make a quick choice based on intuition", correct: false },
                                        { text: "Collect evidence and explore options using a structured approach", correct: true },
                                        { text: "Delegate the decision entirely", correct: false }
                                    ]
                                },
                                {
                                    id: "choice_2",
                                    type: "choice",
                                    question: "If conflicting evidence arises, I:",
                                    required: true,
                                    options: [
                                        { text: "Ignore minority evidence", correct: false },
                                        { text: "Analyze and reconcile using structured frameworks (CLEAR-5)", correct: true },
                                        { text: "Wait until someone else decides", correct: false }
                                    ]
                                },
                                {
                                    id: "choice_3",
                                    type: "choice",
                                    question: "When reflecting on past decisions, I:",
                                    required: true,
                                    options: [
                                        { text: "Focus only on outcomes", correct: false },
                                        { text: "Evaluate the decision process and lessons learned", correct: true },
                                        { text: "Avoid reflection to save time", correct: false }
                                    ]
                                },
                                {
                                    id: "free_text_1",
                                    type: "text",
                                    question: "Describe a situation where you applied critical thinking in your work. Include the problem, evidence collected, options explored, and the final decision.",
                                    required: false
                                }
                            ],
                            trigger: {
                                message: "This format ensures learners actively transfer the skill and reflect on its application in a Harvard/Cambridge-style reflective manner."
                            }
                        };
                        updated = true;
                    }
                }
            });
        });

        if (updated) {
            course.markModified('modules');
            await course.save();
            console.log('✅ Day 3 Reflection content updated and saved.');
        } else {
            console.log('Step 3 not found in any module.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error during update:', error);
        mongoose.disconnect();
    }
};

updateNVQReflectionRobust();
