require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await mongoose.connection.db.collection('users').find({
      email: { $regex: 'dharsini', $options: 'i' }
    }).toArray();
    console.log('Found users:', users.map(u => ({ id: u._id, email: u.email })));

    const students = await mongoose.connection.db.collection('students').find({
      email: { $regex: 'dharsini', $options: 'i' }
    }).toArray();
    console.log('Found students:', students.map(s => ({ id: s._id, email: s.email })));

    // Target all matching user IDs and student IDs
    const targetUserIds = [
      ...users.map(u => u._id),
      ...students.map(s => s._id)
    ];

    for (const u of users) {
      const existing = await mongoose.connection.db.collection('baselineresults').findOne({
        userId: u._id
      });
      if (!existing) {
        const dummyResultId = new mongoose.Types.ObjectId();
        await mongoose.connection.db.collection('baselineresults').insertOne({
          userId: u._id,
          resultId: dummyResultId,
          baselineScore: 85,
          stageBand: 'Progressing',
          t1Profile: {
            CRQ: { rawScore: 85, level: 'Progressing', earned: 85, possible: 100 },
            SRQ: { rawScore: 80, level: 'Progressing', earned: 80, possible: 100 },
            LQ: { rawScore: 90, level: 'Strong', earned: 90, possible: 100 },
            SIQ: { rawScore: 85, level: 'Progressing', earned: 85, possible: 100 },
            PEQ: { rawScore: 80, level: 'Progressing', earned: 80, possible: 100 },
            DAQ: { rawScore: 90, level: 'Strong', earned: 90, possible: 100 }
          },
          score: 85,
          totalScore: 100,
          percentage: 85,
          assessmentType: 'T1_BASELINE',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created BaseLineResult for user ${u.email} (${u._id})`);
      } else {
        console.log(`BaseLineResult already exists for user ${u.email}`);
      }
    }

    // Also for student IDs in case frontend queries with student._id
    for (const s of students) {
      const existing = await mongoose.connection.db.collection('baselineresults').findOne({
        userId: s._id
      });
      if (!existing) {
        const dummyResultId = new mongoose.Types.ObjectId();
        await mongoose.connection.db.collection('baselineresults').insertOne({
          userId: s._id,
          resultId: dummyResultId,
          baselineScore: 85,
          stageBand: 'Progressing',
          t1Profile: {
            CRQ: { rawScore: 85, level: 'Progressing', earned: 85, possible: 100 },
            SRQ: { rawScore: 80, level: 'Progressing', earned: 80, possible: 100 },
            LQ: { rawScore: 90, level: 'Strong', earned: 90, possible: 100 },
            SIQ: { rawScore: 85, level: 'Progressing', earned: 85, possible: 100 },
            PEQ: { rawScore: 80, level: 'Progressing', earned: 80, possible: 100 },
            DAQ: { rawScore: 90, level: 'Strong', earned: 90, possible: 100 }
          },
          score: 85,
          totalScore: 100,
          percentage: 85,
          assessmentType: 'T1_BASELINE',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created BaseLineResult for student ${s.email} (${s._id})`);
      } else {
        console.log(`BaseLineResult already exists for student ${s.email}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
