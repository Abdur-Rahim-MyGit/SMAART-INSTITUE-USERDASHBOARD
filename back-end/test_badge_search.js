const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const badgeMongoId = '6984430d9581368ec5b3b26f'; // Imran's Early Achiever ID from earlier logs

        console.log(`Searching for badge _id: ${badgeMongoId}`);

        let user = await User.findOne({ "badges._id": badgeMongoId });
        if (user) {
            console.log(`Found in User collection: ${user.fullName}`);
            const badge = user.badges.id(badgeMongoId);
            console.log(`Badge: ${badge.title}`);
        } else {
            user = await Student.findOne({ "badges._id": badgeMongoId });
            if (user) {
                console.log(`Found in Student collection: ${user.fullName}`);
                const badge = user.badges.id(badgeMongoId);
                console.log(`Badge: ${badge.title}`);
            } else {
                console.log('Badge not found in any collection.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
