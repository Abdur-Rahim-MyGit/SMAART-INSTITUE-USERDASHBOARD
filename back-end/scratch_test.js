const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Course = require('./models/Course');
    const Enrollment = require('./models/CourseEnrollment');
    const courses = await Course.find();
    const enrolls = await Enrollment.find().populate('course');
    
    const completedEnrolls = enrolls.filter(e => e.status === 'completed' || e.progress >= 100);
    
    console.log(`Total Courses: ${courses.length}`);
    console.log(`Completed Enrolls: ${completedEnrolls.length}`);
    
    const flashcards = [];
    
    for (const course of courses) {
        if (course.learningFlow) {
            Object.values(course.learningFlow).forEach(step => {
                if (step && (step.activityType === 'flashcard' || step.contentType === 'flashcard' || step.type === 'flashcard')) {
                    if (step.cards) {
                        flashcards.push(...step.cards);
                    }
                }
            });
        }
        if (course.modules) {
             course.modules.forEach(m => m.days && m.days.forEach(d => d.steps && d.steps.forEach(s => {
                 if (s.type === 'flashcard' || s.type === 'flashcards') {
                     if (s.content && s.content.cards) {
                         flashcards.push(...s.content.cards);
                     }
                 }
             })));
        }
    }
    
    console.log(`Total Flashcards found in DB: ${flashcards.length}`);
    if (flashcards.length > 0) {
        console.log("Sample:", flashcards[0]);
    }
    
    process.exit();
});
