require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const setNvqToStep3 = async () => {
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

        // Reconstruct the 6 steps in the desired order
        const maStep = day3.steps.find(s => s.type === 'assessment');
        const evidenceStep = day3.steps.find(s => s.type === 'submission');
        const founderStep = day3.steps.find(s => s.title.includes('Founder'));
        const flashcardStep = day3.steps.find(s => s.type === 'flashcard');
        const triggerStep = day3.steps.find(s => s.title.includes('Trigger'));
        const nvqStep = day3.steps.find(s => s.title.includes('NVQ')) || { type: 'reflection' };

        const newSteps = [
            maStep,       // 1
            evidenceStep, // 2
            {             // 3
                ...nvqStep.toObject ? nvqStep.toObject() : nvqStep,
                stepNumber: 3,
                title: "STEP 3: Reflection (NVQ-Style)",
                type: 'reflection',
                content: nvqContent,
                isRequired: true
            },
            founderStep,  // 4
            flashcardStep, // 5
            triggerStep   // 6
        ].filter(Boolean);

        // Final resequencing and title polish
        newSteps.forEach((s, idx) => {
            s.stepNumber = idx + 1;
            if (idx === 0) s.title = "STEP 1: Micro-Assessment";
            if (idx === 1) s.title = "STEP 2: Evidence Task (Artefact)";
            if (idx === 2) s.title = "STEP 3: Reflection (NVQ-Style)";
            if (idx === 3) s.title = "STEP 4: Founder Congratulatory Video";
            if (idx === 4) s.title = "STEP 5: Flash Card + Interview Prep";
            if (idx === 5) s.title = "STEP 6: Post-Employment Application Trigger";
        });

        day3.steps = newSteps;

        course.markModified('modules');
        await course.save();
        console.log('✅ Day 3 reordered: NVQ Reflection is now STEP 3.');

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

setNvqToStep3();
