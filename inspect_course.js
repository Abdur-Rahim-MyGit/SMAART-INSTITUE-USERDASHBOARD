require('dotenv').config({ path: './back-end/.env' });
const mongoose = require('mongoose');
const Course = require('./back-end/models/Course');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.log('Course not found');
            process.exit(1);
        }
        console.log(JSON.stringify(course, null, 2));
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
