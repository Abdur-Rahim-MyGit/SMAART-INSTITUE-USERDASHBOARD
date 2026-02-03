const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const count = await User.countDocuments();
        console.log(`Total Users: ${count}`);

        const users = await User.find().limit(5);
        users.forEach(u => {
            console.log(`User ID: ${u._id} (Length: ${u._id.toString().length})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
