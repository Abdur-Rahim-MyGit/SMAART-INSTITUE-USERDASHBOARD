require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart');
        const courses = await Course.find({}, 'courseCode courseNumber title banner');
        console.log('Courses in DB:');
        courses.forEach(c => {
            console.log(`Code: ${c.courseCode}, Number: ${c.courseNumber}, Title: ${c.title}, Banner: ${c.banner}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

inspect();
