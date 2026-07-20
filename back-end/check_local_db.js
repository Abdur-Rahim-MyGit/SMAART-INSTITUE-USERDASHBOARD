const mongoose = require('mongoose');

async function check() {
  const localUri = 'mongodb://127.0.0.1:27017/minds';
  console.log('Connecting to local fallback:', localUri);
  try {
    await mongoose.connect(localUri);
    const db = mongoose.connection.db;

    const skillName = '.NET Developer';
    const skillAssessment = await db.collection('skillassessments').findOne({
      $or: [
        { instructions: { $regex: new RegExp('^' + skillName + '$', 'i') } },
        { questionCategory: { $regex: new RegExp('^' + skillName + '$', 'i') } }
      ]
    });

    if (skillAssessment) {
      console.log('Found skill assessment in local DB:', skillAssessment._id, skillAssessment.assessmentName);
      console.log('Questions count:', skillAssessment.questions?.length);
    } else {
      console.log('❌ Skill assessment NOT found in local DB!');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
