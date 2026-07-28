const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Result = require('./models/Result');
const Assessment = require('./models/Assessment');
const ProctoringSession = require('./models/ProctoringSession');
const SupportTicket = require('./models/SupportTicket');
const { getStageByCode } = require('./config/stage_distributions');

// Copy shuffle logic
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    // Get a real user
    const userDoc = await db.collection('users').findOne({});
    if (!userDoc) {
      console.error('No users found in database!');
      process.exit(1);
    }
    const userId = userDoc._id;
    console.log('Using user ID:', userId);

    const assessmentId = '6a5a2792bc1532c9c8fcb259'; // .NET Developer Skill Verification ID
    console.log('Using assessment ID:', assessmentId);

    // --- PASTE START ROUTE LOGIC WITH VERBOSE CONSOLE.LOGS ---
    console.log('1. Fetching assessment...');
    let assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        console.log('Assessment not found in main collection. Checking skillassessments...');
        const dbConn = mongoose.connection.db;
        assessment = await dbConn.collection('skillassessments').findOne({ _id: new mongoose.Types.ObjectId(assessmentId) });
    }

    if (!assessment) {
        console.error('❌ Assessment not found in DB!');
        process.exit(1);
    }
    console.log('Found assessment name:', assessment.assessmentName);

    console.log('2. Creating questionMap...');
    const questionMap = new Map();
    assessment.questions.forEach(q => {
        const qId = q._id || q.questionId;
        if (qId) {
            questionMap.set(qId.toString(), q);
        }
    });
    console.log('questionMap size:', questionMap.size);

    console.log('3. Checking proctoring lock...');
    const activeLock = await ProctoringSession.findOne({
        userId,
        assessmentId,
        isLocked: true
    });
    console.log('activeLock found:', !!activeLock);

    console.log('4. Checking existing result...');
    const existingResult = await Result.findOne({
        userId,
        assessmentId,
        completionStatus: 'in-progress'
    });
    console.log('existingResult found:', !!existingResult);

    const stageInfo = getStageByCode(assessment.assessmentCode);
    const stageKey = stageInfo ? stageInfo.stage : null;
    const expectedQuestions = stageInfo ? stageInfo.totalQuestions : assessment.questions.length;
    console.log('stageKey:', stageKey, 'expectedQuestions:', expectedQuestions);

    if (existingResult) {
        console.log('Resuming path...');
        // Resuming path simulation...
    } else {
        console.log('New attempt path...');
        let shuffledQuestionIds;
        let totalQuestions;

        if (stageKey) {
            console.log('Stage assessment logic...');
        } else {
            console.log('Standard assessment logic...');
            const questionIds = assessment.questions.map(q => q._id || q.questionId);
            shuffledQuestionIds = shuffleArray(questionIds);
            totalQuestions = assessment.questions.length;
        }

        console.log('5. Creating new result document...');
        const result = new Result({
            userId,
            assessmentId: assessment._id,
            assessmentCode: assessment.assessmentCode || ("SKILL-" + assessment._id.toString().slice(-6).toUpperCase()),
            assessmentName: assessment.assessmentName,
            questionOrder: shuffledQuestionIds,
            totalQuestions: totalQuestions,
            completionStatus: 'in-progress'
        });

        console.log('6. Saving new result...');
        await result.save();
        console.log('✅ Result saved successfully! ID:', result._id);

        console.log('7. Mapping shuffledQuestions...');
        const shuffledQuestions = shuffledQuestionIds.map(qId => {
            const idStr = qId.toString();
            const question = questionMap.get(idStr);
            return {
                _id: question?._id || question?.questionId,
                questionText: question?.questionText,
                type: question?.type,
                options: question?.options,
                order: question?.order || 0
            };
        });
        console.log('shuffledQuestions count:', shuffledQuestions.length);

        console.log('8. Deleting temporary test result...');
        await Result.deleteOne({ _id: result._id });
        console.log('Cleaned up successfully.');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('🚨 ERROR CAUGHT IN SIMULATION:', err);
  }
}

run();
