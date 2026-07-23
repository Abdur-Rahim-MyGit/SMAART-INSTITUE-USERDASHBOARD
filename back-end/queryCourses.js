const mongoose = require('mongoose');

async function query() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Course = require('./models/Course');
    const courses = await Course.find().select('courseCode title stage');
    console.log(JSON.stringify(courses, null, 2));
    process.exit(0);
}

query();
