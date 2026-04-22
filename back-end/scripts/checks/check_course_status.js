const mongoose = require('mongoose');
const Course = require('./models/Course');

const mongoURI = 'mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to Production DB...');

    const courses = await Course.find();
    console.log(`Checking ${courses.length} courses...`);

    courses.forEach(c => {
        console.log(`\nCourse: ${c.title}`);
        c.modules.forEach((m, i) => {
            console.log(`  Module ${i + 1}: ${m.title}, Status: ${m.status}`);
        });
    });

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
