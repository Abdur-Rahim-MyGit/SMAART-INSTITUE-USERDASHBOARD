require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Find ANY student who applied
        const apps = await mongoose.connection.db.collection('placementapplications').find().toArray();
        if (apps.length === 0) { console.log("No apps in DB"); return; }
        
        const firstApp = apps[0];
        const studentId = firstApp.studentId || firstApp.student;
        
        const user = await mongoose.connection.db.collection('students').findOne({_id: studentId}) || await mongoose.connection.db.collection('users').findOne({_id: studentId});
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id, role: 'student' }, process.env.JWT_SECRET || 'fallback', { expiresIn: '1d' });
        
        const res = await axios.get('http://localhost:5000/api/placements/applications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`Found ${res.data.data.length} apps from API.`);
        for (const app of res.data.data) {
            const title = app.job?.title || app.job?.displayTitle;
            if (title === 'React Native Developer' || title === 'Backend Developer') {
                console.log(`\n--- ${title} ---`);
                console.log(`app.jobFairId:`, app.jobFairId);
                console.log(`app.job.jobFairId:`, app.job?.jobFairId);
                console.log(`app.job.jobFair:`, app.job?.jobFair);
                console.log(`app.job.displayJobFairTitle:`, app.job?.displayJobFairTitle);
                
                // Let's dump the entire job object keys
                console.log(`job keys:`, Object.keys(app.job || {}).join(', '));
            }
        }
    } catch(err) {
        console.error(err.response ? err.response.data : err.message);
    }
    process.exit(0);
}
run();
