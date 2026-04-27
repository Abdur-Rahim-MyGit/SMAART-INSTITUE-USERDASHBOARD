const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { awardEarlyAchieverBadge } = require('./utils/badgeHelper');
const User = require('./models/User');
const Student = require('./models/Student');
const CourseEnrollment = require('./models/CourseEnrollment'); // Added this too just in case

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Checking ${users.length} users for badge eligibility...`);

        for (const user of users) {
            const badge = await awardEarlyAchieverBadge(user._id);
            if (badge) {
                console.log(`Badge awarded to User: ${user.fullName}`);
            }
        }

        const students = await Student.find({});
        console.log(`Checking ${students.length} students for badge eligibility...`);

        for (const student of students) {
            const badge = await awardEarlyAchieverBadge(student._id);
            if (badge) {
                console.log(`Badge awarded to Student: ${student.fullName}`);
            }
        }

        console.log('Retroactive awarding complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
