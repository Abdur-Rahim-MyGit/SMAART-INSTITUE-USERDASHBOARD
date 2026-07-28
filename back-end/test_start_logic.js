const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Result = require('./models/Result');
const Assessment = require('./models/Assessment');

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function simulate() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // 1. Find user (student)
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.error('No users found in database!');
      process.exit(1);
    }
    const userId = user._id;
    console.log('Found user:', userId, user.email);

    // 2. Find skill assessment
    const skillName = '.NET Developer';
    const skillAssessment = await db.collection('skillassessments').findOne({
      status: 'active',
      $or: [
        { instructions: { $regex: new RegExp('^' + skillName + '$', 'i') } },
        { questionCategory: { $regex: new RegExp('^' + skillName + '$', 'i') } }
      ]
    });

    if (!skillAssessment) {
      console.error('Skill assessment not found!');
      process.exit(1);
    }
    console.log('Found skill assessment:', skillAssessment._id, skillAssessment.assessmentName);

    // 3. Mimic the results start route logic
    console.log('Mimicking results.js route logic...');
    
    // Check if user already has an in-progress attempt
    const existingResult = await Result.findOne({
        userId,
        assessmentId: skillAssessment._id,
        completionStatus: 'in-progress'
    });

    if (existingResult) {
      console.log('Found existing result in-progress:', existingResult._id);
      process.exit(0);
    }

    const questionIds = skillAssessment.questions.map(q => q._id || q.questionId);
    console.log('Question IDs:', questionIds);
    const shuffledQuestionIds = shuffleArray(questionIds);
    const totalQuestions = skillAssessment.questions.length;

    // Create new result document
    const result = new Result({
        userId,
        assessmentId: skillAssessment._id,
        assessmentCode: skillAssessment.assessmentCode || ("SKILL-" + skillAssessment._id.toString().slice(-6).toUpperCase()),
        assessmentName: skillAssessment.assessmentName,
        questionOrder: shuffledQuestionIds,
        totalQuestions: totalQuestions,
        completionStatus: 'in-progress'
    });

    console.log('Attempting to save result document...');
    await result.save();
    console.log('✅ Result document saved successfully! ID:', result._id);

    // Clean up
    await Result.deleteOne({ _id: result._id });
    console.log('Cleaned up test result document.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('🚨 Error caught in logic simulation:', err);
    process.exit(1);
  }
}

simulate();
