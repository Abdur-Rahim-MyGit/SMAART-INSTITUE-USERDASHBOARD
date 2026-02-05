const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'naifbasha50@gmail.com';

        console.log(`Searching for email: ${email}`);

        const user = await User.findOne({ email });
        console.log(`User collection: ${user ? 'FOUND' : 'NOT FOUND'}`);
        if (user) console.log(`- ID: ${user._id}, Badges: ${user.badges?.length || 0}`);

        const student = await Student.findOne({ email });
        console.log(`Student collection: ${student ? 'FOUND' : 'NOT FOUND'}`);
        if (student) console.log(`- ID: ${student._id}, Badges: ${student.badges?.length || 0}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
