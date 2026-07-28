const mongoose = require('mongoose');
const Course = require('./models/Course');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to Production DB...');

    const courses = await Course.find();
    console.log(`Searching through ${courses.length} courses...`);

    courses.forEach(c => {
        const moduleCount = c.modules.length;
        const totalDays = c.modules.reduce((sum, m) => sum + (m.days ? m.days.length : 0), 0);

        console.log(`\nCourse: ${c.title}`);
        console.log(`  Modules: ${moduleCount}`);
        console.log(`  Total Days: ${totalDays}`);

        c.modules.forEach((m, i) => {
            console.log(`    M${i + 1}: ${m.days ? m.days.length : 0} days`);
        });
    });

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
