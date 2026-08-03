require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      const colName = col.name;
      const found = await mongoose.connection.db.collection(colName).find({
        $or: [
          { 'projects.title': { $regex: 'IHMS', $options: 'i' } },
          { 'extracurricular.description': { $regex: 'Ambassador', $options: 'i' } },
          { 'tenthDetails.schoolName': { $regex: 'Nirmala', $options: 'i' } },
          { 'twelfthDetails.schoolName': { $regex: 'Nirmala', $options: 'i' } },
          { 'personalDevelopmentGoals': { $exists: true } },
          { 'careerGoals': { $exists: true } }
        ]
      }).toArray();
      if (found.length > 0) {
        console.log(`\n=== Found ${found.length} docs in collection '${colName}' ===`);
        for (const doc of found) {
          console.log(`_id: ${doc._id}, email: ${doc.email}, name: ${doc.fullName || doc.name}`);
          console.log('workExperience:', JSON.stringify(doc.workExperience, null, 2));
          console.log('registration.workExperience:', JSON.stringify(doc.registration?.workExperience, null, 2));
          console.log('personalDevelopmentGoals:', JSON.stringify(doc.personalDevelopmentGoals, null, 2));
          console.log('registration.personalDevelopmentGoals:', JSON.stringify(doc.registration?.personalDevelopmentGoals, null, 2));
          console.log('careerGoals:', JSON.stringify(doc.careerGoals, null, 2));
          console.log('registration.careerGoals:', JSON.stringify(doc.registration?.careerGoals, null, 2));
          console.log('goals:', JSON.stringify(doc.goals, null, 2));
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
