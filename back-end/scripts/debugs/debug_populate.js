const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const College = require('./models/College');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minds';

async function testFetch(email) {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail }).populate('college', 'logo collegeName');
        
        if (!user) {
            user = await Student.findOne({ email: normalizedEmail }).populate('college', 'logo collegeName');
        }

        if (user) {
            console.log('User found:', user.fullName);
            console.log('College ID:', user.college?._id);
            console.log('College Logo:', user.college?.logo);
            console.log('College Name:', user.college?.collegeName);
        } else {
            console.log('User not found');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Please provide an email');
    process.exit(1);
}

testFetch(email);
