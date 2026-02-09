require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });

const introTemplates = {
    'Default': {
        what: (title) => `${title} is the practice of applying systematic logic and evidence-based reasoning to understand complex subjects.`,
        why: (title) => `Mastering ${title} allows you to make more accurate predictions, avoid common biases, and lead with confidence.`,
        where: (title) => `You will use this in strategic planning, interpersonal communication, and everyday problem-solving.`,
        outcome: (title) => `Student understands the ${title}'s relevance and context.`
    },
    'Critical Thinking': {
        what: () => "Critical thinking is the objective analysis and evaluation of an issue in order to form a judgment.",
        why: () => "It helps you avoid falling for misinformation and enables you to build strong, defensible arguments.",
        where: () => "Use it when evaluating reports, debating strategies, or solving complex engineering problems.",
        outcome: () => "Student understands how to apply critical evaluation to various information sources."
    },
    'Decision Making': {
        what: () => "Decision making is the cognitive process resulting in the selection of a belief or a course of action among several alternative possibilities.",
        why: () => "High-quality decisions lead to better business outcomes, reduced risk, and higher efficiency.",
        where: () => "Apply this during project planning, resource allocation, and team management.",
        outcome: () => "Student understands the framework for making rational, data-driven decisions."
    }
};

const getIntroForTitle = (title, moduleNum, dayNum, stepNum) => {
    const safeTitle = title || "this skill";
    // Hardcoded special case for first step as requested
    if (moduleNum === 1 && dayNum === 1 && stepNum === 1) {
        return [
            "What is this skill? This skill is the foundation of structured problem-solving, enabling you to break down complex challenges into manageable parts.",
            "Why is it important? In a world of information overload, this skill allows you to maintain clarity and focus on what truly matters.",
            "Where will you use it? You'll use it in professional decision-making, personal planning, and any situation requiring rigorous logic.",
            "Learning Outcome: Student understands the skill’s relevance and context"
        ];
    }

    let template = introTemplates['Default'];
    if (safeTitle.toLowerCase().includes('critical')) template = introTemplates['Critical Thinking'];
    else if (safeTitle.toLowerCase().includes('decision')) template = introTemplates['Decision Making'];

    return [
        `What is this skill? ${template.what(safeTitle)}`,
        `Why is it important? ${template.why(safeTitle)}`,
        `Where will you use it? ${template.where(safeTitle)}`,
        `Learning Outcome: ${template.outcome(safeTitle)}`
    ];
};

const addIntroText = async () => {
    try {
        const courses = await Course.find();
        console.log(`Found ${courses.length} courses to update.`);

        for (let course of courses) {
            console.log(`Updating Course: ${course.title} (${course.courseCode})`);

            for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
                const module = course.modules[mIdx];
                for (let dIdx = 0; dIdx < module.days.length; dIdx++) {
                    const day = module.days[dIdx];

                    // 1. Update legacy day.videoContent
                    if (day.videoContent && typeof day.videoContent === 'object' && !Array.isArray(day.videoContent)) {
                        day.videoContent.introText = getIntroForTitle(day.videoContent.title || day.title, mIdx + 1, dIdx + 1, 1);
                        console.log(`  Added intro to legacy videoContent M${mIdx + 1}D${dIdx + 1}`);
                    }

                    // 2. Update legacy day.summaryVideo
                    if (day.summaryVideo && typeof day.summaryVideo === 'object') {
                        day.summaryVideo.introText = getIntroForTitle(day.summaryVideo.title || "Summary", mIdx + 1, dIdx + 1, 99);
                        console.log(`  Added intro to summaryVideo M${mIdx + 1}D${dIdx + 1}`);
                    }

                    // 3. Update modern steps array
                    if (day.steps && day.steps.length > 0) {
                        for (let sIdx = 0; sIdx < day.steps.length; sIdx++) {
                            const step = day.steps[sIdx];
                            if (step.type === 'video') {
                                step.introText = getIntroForTitle(step.title, mIdx + 1, dIdx + 1, sIdx + 1);
                                console.log(`  Added intro to M${mIdx + 1}D${dIdx + 1}S${sIdx + 1}: ${step.title}`);
                            }
                        }
                    }
                }
            }
            // Use markModified because we are updating nested elements in Mixed or Array
            course.markModified('modules');
            await course.save();
        }

        console.log('✅ Success! Intro text added to all video steps.');
        mongoose.disconnect();
    } catch (err) {
        console.error('Migration Error:', err);
        mongoose.disconnect();
        process.exit(1);
    }
};

addIntroText();
