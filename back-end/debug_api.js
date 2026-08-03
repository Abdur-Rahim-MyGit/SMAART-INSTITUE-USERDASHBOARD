require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('students').findOne({email: 'dharsini@gmail.com'});
        if (!user) {
            console.log("User not found");
            return;
        }
        
        // Let's generate a token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        
        const res = await axios.get('http://localhost:5000/api/placements/applications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const apps = res.data.data;
        console.log(`Found ${apps.length} applications.`);
        for (const app of apps) {
            const title = app.job?.title || app.job?.displayTitle;
            if (title === 'React Native Developer' || title === 'Backend Developer') {
                console.log(`\n--- App: ${title} ---`);
                console.log(`app.jobFairId:`, app.jobFairId);
                console.log(`app.job.jobFairId:`, app.job?.jobFairId);
                console.log(`app.job.displayJobFairTitle:`, app.job?.displayJobFairTitle);
            }
        }
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
run();
