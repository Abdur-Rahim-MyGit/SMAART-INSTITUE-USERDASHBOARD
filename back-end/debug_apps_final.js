require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const apps = await db.collection('placementapplications').find().toArray();
    console.log('Total placement applications:', apps.length);
    
    for (const app of apps) {
        if (!app.job) continue;
        const src = app.jobSource || 'jobpostings';
        const job = await db.collection(src).findOne({_id: app.job});
        
        let jobTitle = app.jobTitle || app.displayTitle || (job ? job.title : 'Unknown');
        if (jobTitle === 'React Native Developer' || jobTitle === 'Backend Developer') {
            console.log(`\nFound Application for ${jobTitle}`);
            console.log(`Application _id: ${app._id}`);
            console.log(`app.jobFairId: ${app.jobFairId}`);
            if (job) {
                console.log(`job.jobFairId: ${job.jobFairId}`);
                console.log(`job.jobFair: ${job.jobFair}`);
            } else {
                console.log(`Job not found in collection ${src}`);
            }
        }
    }
    
    process.exit(0);
});
