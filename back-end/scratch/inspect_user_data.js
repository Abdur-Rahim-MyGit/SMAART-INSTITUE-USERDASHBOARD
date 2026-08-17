require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const registrations = await mongoose.connection.db.collection('registrations').find({
      email: { $regex: 'dharsini', $options: 'i' }
    }).toArray();
    console.log('Registrations count:', registrations.length);
    for (const r of registrations) {
      console.log(`\n--- Registration for ${r.email} ---`);
      console.log('workExperience:', JSON.stringify(r.workExperience, null, 2));
      console.log('projects:', JSON.stringify(r.projects, null, 2));
      console.log('certificates:', JSON.stringify(r.certificates, null, 2));
      console.log('extracurricular:', JSON.stringify(r.extracurricular, null, 2));
      console.log('personalDevelopmentGoals:', JSON.stringify(r.personalDevelopmentGoals, null, 2));
      console.log('careerGoals:', JSON.stringify(r.careerGoals, null, 2));
    }

    const students = await mongoose.connection.db.collection('students').find({
      email: { $regex: 'dharsini', $options: 'i' }
    }).toArray();
    console.log('\nStudents count:', students.length);
    for (const s of students) {
      console.log(`\n--- Student for ${s.email} ---`);
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
