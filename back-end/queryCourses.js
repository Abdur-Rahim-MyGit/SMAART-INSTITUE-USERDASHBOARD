const mongoose = require('mongoose');

async function query() {
    await mongoose.connect('mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds');
    const Course = require('./models/Course');
    const courses = await Course.find().select('courseCode title stage');
    console.log(JSON.stringify(courses, null, 2));
    process.exit(0);
}

query();
