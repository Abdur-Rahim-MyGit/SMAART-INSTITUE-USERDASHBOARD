const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BaseLineResult = require('./models/BaseLineResult');

dotenv.config();

const verifyIds = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const results = await BaseLineResult.find().limit(3).sort({ createdAt: -1 });

        results.forEach((r, i) => {
            const idStr = r.userId.toString();
            console.log(`[${i}] ID: ${idStr}`);
            console.log(`[${i}] Len: ${idStr.length}`);
            console.log(`[${i}] Type: ${typeof r.userId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyIds();
