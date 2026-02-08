const mongoose = require('mongoose');
const CourseEnrollment = require('./models/CourseEnrollment');

mongoose.connect('mongodb://localhost:27017/smaart-dashboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('MongoDB Connected');
    const count = await CourseEnrollment.countDocuments();
    console.log(`CourseEnrollment count: ${count}`);

    if (count > 0) {
        const enrollments = await CourseEnrollment.find().populate('student course').limit(5);
        console.log('Sample Enrollments:', JSON.stringify(enrollments, null, 2));
    }

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
