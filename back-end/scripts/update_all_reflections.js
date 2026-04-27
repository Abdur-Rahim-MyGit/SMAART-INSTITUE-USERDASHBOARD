require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const updateAllReflectionsDay3 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });

        const nvqContent = {
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

        let count = 0;
        course.modules[0].days.forEach(day => {
            if (day.dayNumber === 3) {
                day.steps.forEach(step => {
                    if (step.type === 'reflection') {
                        step.content = nvqContent;
                        step.title = step.stepNumber === 6 ? "STEP 6: Post-Employment Application Trigger (NVQ-Style)" : "STEP 3: Reflection (NVQ-Style)";
                        count++;
                    }
                });
            }
        });

        course.markModified('modules');
        await course.save();
        console.log(`✅ Updated ${count} reflection steps in Day 3.`);

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

updateAllReflectionsDay3();
