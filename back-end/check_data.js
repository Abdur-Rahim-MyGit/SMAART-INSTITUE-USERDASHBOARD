const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BaseLineResult = require('./models/BaseLineResult');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const count = await BaseLineResult.countDocuments();
        console.log(`Total BaseLineResults: ${count}`);

        if (count > 0) {
            const results = await BaseLineResult.find().limit(5).sort({ createdAt: -1 });
            console.log('Latest 5 Results:');
            results.forEach(r => {
                console.log(`- User: ${r.userId} (Type: ${typeof r.userId}, Length: ${r.userId.toString().length}), Score: ${r.baselineScore}, Created: ${r.createdAt}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkData();
