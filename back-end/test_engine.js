require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const { processCareerIntelligence } = require('./engine/careerEngine');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const student = await mongoose.connection.collection('students').findOne({ email: 'rahul@gmail.com' });
  if (!student) { console.log('Rahul not found'); process.exit(1); }
  
  // Fake the payload exactly as the frontend sends it
  const studentData = {
    personalDetails: { name: student.fullName, email: student.email },
    preferences: student.careerPreferences || {
      primary: { careerDirectionId: "CD-005001-P01", careerDirectionName: "Accounting & Book-Keeping", role: "Accounts Executive" }
    },
    skills: ["Tally", "Excel"]
  };
  
  const result = await processCareerIntelligence(studentData);
  console.log("Primary Direction Name:", result.primary?.direction?.directionName);
  console.log("Primary Roles mapped:", result.primary?.direction?.roles);
  
  process.exit(0);
}
test();
