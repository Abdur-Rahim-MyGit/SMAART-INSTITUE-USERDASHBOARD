const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const skillDoc = await mongoose.connection.db.collection('skillassessments').findOne();
    if (skillDoc) {
      console.log('Skill Assessment keys:');
      const cleanDoc = { ...skillDoc };
      delete cleanDoc.questions;
      delete cleanDoc.mcqQuestions;
      delete cleanDoc.fibQuestions;
      delete cleanDoc.sjtQuestions;
      console.log(JSON.stringify(cleanDoc, null, 2));
    } else {
      console.log('No Skill Assessment found');
    }

    const courseDoc = await mongoose.connection.db.collection('assessments').findOne();
    if (courseDoc) {
      console.log('Assessment keys:');
      const cleanDoc = { ...courseDoc };
      delete cleanDoc.questions;
      delete cleanDoc.mcqQuestions;
      delete cleanDoc.fibQuestions;
      delete cleanDoc.sjtQuestions;
      console.log(JSON.stringify(cleanDoc, null, 2));
    } else {
      console.log('No Course Assessment found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
