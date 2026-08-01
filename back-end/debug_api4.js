require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        
        const app = await db.collection('placementapplications').findOne({_id: new mongoose.Types.ObjectId('6a6ae6dd6fd4780ecd58386a')});
        if (!app) { console.log("App not found"); return; }
        
        const studentId = app.studentId || app.student;
        const user = await db.collection('students').findOne({_id: studentId});
        
        if (!user) { console.log("User not found"); return; }
        
        const token = jwt.sign({ id: user._id, role: user.role || 'student', userType: 'student' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        
        const res = await axios.get('http://localhost:5000/api/placements/applications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const apps = res.data.data;
        const targetApp = apps.find(a => String(a._id) === '6a6ae6dd6fd4780ecd58386a');
        if (targetApp) {
             console.log("Found App in API Response!");
             console.log("job keys:", Object.keys(targetApp.job || {}).join(', '));
             console.log("job.jobFairId:", targetApp.job?.jobFairId);
             console.log("job._id:", targetApp.job?._id);
             
             // Check string type
             console.log("typeof job.jobFairId:", typeof targetApp.job?.jobFairId);
        } else {
             console.log("App not in response");
        }
    } catch(err) {
        console.error(err.response ? err.response.data : err.message);
    }
    process.exit(0);
}
run();
