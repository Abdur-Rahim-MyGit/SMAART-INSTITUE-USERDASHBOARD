require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const transformVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('player.cloudinary.com/embed')) {
        try {
            const urlObj = new URL(url);
            const cloudName = urlObj.searchParams.get('cloud_name');
            const publicId = urlObj.searchParams.get('public_id');
            if (cloudName && publicId) {
                return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`;
            }
        } catch (e) { }
    }
    return url;
};

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const module = course.modules[0];
        const dayIndex = 2; // Day 3
        const day = module.days[dayIndex];

        let steps = [];
        if (day.steps && Array.isArray(day.steps) && day.steps.length > 0) {
            steps = day.steps.map((s, idx) => ({
                id: idx + 1,
                title: s.title || s.content?.title || `Step ${idx + 1}`,
                type: s.type || 'video',
                // other fields omitted for brevity
            }));
        }

        if (module.microAssessments && Array.isArray(module.microAssessments)) {
            const dayAssessments = module.microAssessments.filter(ma => ma.dayId === (dayIndex + 1));
            dayAssessments.forEach(ma => {
                const stepId = ma.stepId || steps.length + 1;
                const existingStepIndex = steps.findIndex(s => s.id === stepId);
                const assessmentStep = {
                    id: stepId,
                    title: ma.title || "Micro-Assessment",
                    type: 'assessment',
                };
                if (existingStepIndex > -1) {
                    steps[existingStepIndex] = assessmentStep;
                } else {
                    steps.push(assessmentStep);
                }
                steps.sort((a, b) => a.id - b.id);
            });
        }

        console.log(`--- Transformed Day 3 (Session 3) Steps ---`);
        console.log(JSON.stringify(steps, null, 2));
        mongoose.disconnect();
    });
