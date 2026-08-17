require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const registrations = await mongoose.connection.db.collection('registrations').find({
      $or: [
        { fullName: { $regex: 'Lingeswari', $options: 'i' } },
        { name: { $regex: 'Lingeswari', $options: 'i' } },
        { email: { $regex: 'lingeswari', $options: 'i' } },
        { 'projects.0': { $exists: true } },
        { 'extracurricular.0': { $exists: true } }
      ]
    }).toArray();
    console.log('Found registrations:', registrations.length);
    for (const r of registrations) {
      console.log(`\n--- Registration: ${r.fullName || r.name} (${r.email}) ---`);
      console.log('workExperience:', JSON.stringify(r.workExperience, null, 2));
      console.log('projects:', JSON.stringify(r.projects, null, 2));
      console.log('certificates:', JSON.stringify(r.certificates, null, 2));
      console.log('extracurricular:', JSON.stringify(r.extracurricular, null, 2));
      console.log('personalDevelopmentGoals:', JSON.stringify(r.personalDevelopmentGoals, null, 2));
      console.log('careerGoals:', JSON.stringify(r.careerGoals, null, 2));
      console.log('goals:', JSON.stringify(r.goals, null, 2));
      console.log('careerPreferences:', JSON.stringify(r.careerPreferences, null, 2));
    }

    const students = await mongoose.connection.db.collection('students').find({
      $or: [
        { name: { $regex: 'Lingeswari', $options: 'i' } },
        { fullName: { $regex: 'Lingeswari', $options: 'i' } },
        { email: { $regex: 'lingeswari', $options: 'i' } }
      ]
    }).toArray();
    console.log('\nFound students:', students.length);
    for (const s of students) {
      console.log(`\n--- Student: ${s.name || s.fullName} (${s.email}) ---`);
      console.log('workExperience:', JSON.stringify(s.workExperience, null, 2));
      console.log('projects:', JSON.stringify(s.projects, null, 2));
      console.log('certificates:', JSON.stringify(s.certificates, null, 2));
      console.log('extracurricular:', JSON.stringify(s.extracurricular, null, 2));
      console.log('personalDevelopmentGoals:', JSON.stringify(s.personalDevelopmentGoals, null, 2));
      console.log('careerGoals:', JSON.stringify(s.careerGoals, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
