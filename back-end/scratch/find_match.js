require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const matchReg = await mongoose.connection.db.collection('registrations').findOne({
      $or: [
        { 'projects.title': { $regex: 'IHMS', $options: 'i' } },
        { 'tenthDetails.schoolName': { $regex: 'Fuscos', $options: 'i' } },
        { 'twelfthDetails.schoolName': { $regex: 'Nirmala', $options: 'i' } }
      ]
    });
    console.log('Match in registrations:', matchReg ? {
      _id: matchReg._id,
      email: matchReg.email,
      fullName: matchReg.fullName,
      workExperience: matchReg.workExperience,
      personalDevelopmentGoals: matchReg.personalDevelopmentGoals,
      careerGoals: matchReg.careerGoals,
      goals: matchReg.goals
    } : 'None');

    const matchStudent = await mongoose.connection.db.collection('students').findOne({
      $or: [
        { 'projects.title': { $regex: 'IHMS', $options: 'i' } },
        { 'tenthDetails.schoolName': { $regex: 'Fuscos', $options: 'i' } },
        { 'twelfthDetails.schoolName': { $regex: 'Nirmala', $options: 'i' } },
        { 'registration.projects.title': { $regex: 'IHMS', $options: 'i' } }
      ]
    });
    console.log('Match in students:', matchStudent ? {
      _id: matchStudent._id,
      email: matchStudent.email,
      fullName: matchStudent.fullName,
      workExperience: matchStudent.workExperience,
      personalDevelopmentGoals: matchStudent.personalDevelopmentGoals,
      careerGoals: matchStudent.careerGoals,
      registration: matchStudent.registration
    } : 'None');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
