require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const listCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const courses = await Course.find({}, 'title courseCode modules.title');
        courses.forEach(c => {
            console.log(`Course: ${c.title} (${c.courseCode})`);
            c.modules.forEach((m, i) => {
                console.log(`  Module ${i + 1}: ${m.title}`);
            });
        });
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

listCourses();
