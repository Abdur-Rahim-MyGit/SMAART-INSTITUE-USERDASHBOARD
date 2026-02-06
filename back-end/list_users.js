const mongoose = require('mongoose');
const User = require('./models/User');

async function listUsers() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minds';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'fullName email role _id').limit(20);
        console.log('--- Users (First 20) ---');
        users.forEach(u => {
            console.log(`${u.fullName} (${u.email}) [${u.role}] ID: ${u._id}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
