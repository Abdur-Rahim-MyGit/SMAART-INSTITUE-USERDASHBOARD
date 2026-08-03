require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update dharsini882@gmail.com and any dharsini account that has registration data
    const students = await mongoose.connection.db.collection('students').find({
      email: { $regex: 'dharsini', $options: 'i' }
    }).toArray();

    for (const student of students) {
      console.log(`Checking student ${student.email}...`);
      const updateFields = {};
      
      // If workExperience is in registration, copy to top level
      if (student.registration?.workExperience && (!student.workExperience || student.workExperience.length === 0)) {
        updateFields.workExperience = student.registration.workExperience;
      }
      
      // If careerGoals is in registration, copy to top level
      if (student.registration?.careerGoals && !student.careerGoals) {
        updateFields.careerGoals = student.registration.careerGoals;
      }

      // If personalDevelopmentGoals is missing in registration or student, set default/sensible ones
      const existingDevGoals = student.personalDevelopmentGoals || student.registration?.personalDevelopmentGoals;
      if (!existingDevGoals || !existingDevGoals.shortTerm) {
        const defaultDevGoals = {
          shortTerm: "Enhance technical problem-solving and communication skills",
          mediumTerm: "Lead engineering projects and master system architecture",
          longTerm: "Achieve leadership excellence and drive impactful innovations"
        };
        updateFields.personalDevelopmentGoals = defaultDevGoals;
        if (student.registration && typeof student.registration === 'object') {
          updateFields['registration.personalDevelopmentGoals'] = defaultDevGoals;
        }
      }

      if (Object.keys(updateFields).length > 0) {
        await mongoose.connection.db.collection('students').updateOne(
          { _id: student._id },
          { $set: updateFields }
        );
        console.log(`Updated student ${student.email}:`, updateFields);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
