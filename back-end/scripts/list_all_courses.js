const mongoose = require('mongoose');
const Course = require('./models/Course');

const mongoURI = 'mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to Production DB...');

    const courses = await Course.find();
    console.log(`Found ${courses.length} courses.`);

    courses.forEach(c => {
        console.log(`- ${c.title} (${c.courseCode}): ${c.modules.length} modules`);
    });

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
