require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const updateNVQReflection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) throw new Error('Course CRS00001 not found');

        const module1 = course.modules[0];
        const day3 = module1.days?.find(d => d.dayNumber === 3);

        if (!day3) {
            console.log('Day 3 not found');
            mongoose.disconnect();
            return;
        }

        // The resequenced Day 3 steps:
        // 1. Micro-Assessment
        // 2. Evidence Task
        // 3. Reflection (NVQ-Style)
        const reflectionStep = day3.steps.find(s => s.stepNumber === 3 || s.type === 'reflection');

        if (reflectionStep) {
            console.log('Updating Reflection step content...');
            reflectionStep.title = "STEP 3: Reflection (NVQ-Style)";
            reflectionStep.content = {
                title: "Reflection (NVQ-Style)",
                instructions: "Purpose: Learning transfer and reflective practice. Time: 5 min. Assessment: Not scored (monitored for tracking).",
                questions: [
                    // Likert Statements
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
                    // Forced-Choice Prompts
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
                    // Optional Free Text
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
        }

        await course.save();
        console.log('✅ Day 3 Reflection content updated successfully.');

        mongoose.disconnect();
    } catch (error) {
        console.error('Error during update:', error);
        mongoose.disconnect();
    }
};

updateNVQReflection();
