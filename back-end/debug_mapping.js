require('dotenv').config();
const mongoose = require('mongoose');

const getId = (id) => id?._id?.toString() || id?.toString() || id;

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Get apps
    const apps = await db.collection('placementapplications').find().toArray();
    console.log(`Found ${apps.length} apps`);
    
    const bySource = new Map();
    apps.forEach((app) => {
      const src = app.jobSource || 'jobpostings';
      const jobId = getId(app.job);
      if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) return;
      if (!bySource.has(src)) bySource.set(src, new Set());
      bySource.get(src).add(jobId);
    });
    
    const jobsBySource = new Map();
    await Promise.all([...bySource.entries()].map(async ([src, ids]) => {
        const found = await db.collection(src).find({ _id: { $in: [...ids].map((id) => new mongoose.Types.ObjectId(id)) } }).toArray();
        // simulate enrichJobs
        const enriched = found.map(j => ({ ...j, _id: j._id?.toString?.() || j._id }));
        jobsBySource.set(src, new Map(enriched.map((j) => [String(j._id), j])));
    }));
    
    for(const app of apps) {
        const src = app.jobSource || 'jobpostings';
        const jobIdStr = getId(app.job);
        const resolved = jobsBySource.get(src)?.get(jobIdStr) || null;
        if (!resolved) {
            console.log(`Failed to resolve job ${jobIdStr} in src ${src}`);
        } else {
            if (resolved.title === 'React Native Developer' || resolved.title === 'Backend Developer') {
                 console.log(`Resolved ${resolved.title}!`);
                 console.log(`Has jobFairId? ${!!resolved.jobFairId}`);
            }
        }
    }
    
    process.exit(0);
});
