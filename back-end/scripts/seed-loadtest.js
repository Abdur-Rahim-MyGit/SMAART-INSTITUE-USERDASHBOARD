/**
 * seed-loadtest.js  —  Create disposable fixtures for LOCAL load testing.
 * ----------------------------------------------------------------------------
 * Creates: 1 College, 1 Assessment (with questions), and N Students, then
 * mints a valid JWT per student and writes them to ../../loadtest/tokens.json
 * for the k6 script to consume.
 *
 * WHY native inserts: this is throwaway local test data. We bypass Mongoose
 * validators/hooks (College has many required fields, Student hashes passwords)
 * because the load test never logs in with a password — it uses minted tokens.
 * We only populate the fields the API endpoints actually READ.
 *
 * RUN (from the back-end folder, against the exposed local Mongo):
 *   node scripts/seed-loadtest.js
 * Optional: COUNT=5000 node scripts/seed-loadtest.js
 *
 * SAFETY: refuses to run unless the target DB name contains "local" — so it can
 * never touch a real database by accident.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// A dedicated student with a REAL (bcrypt-hashed) password so the browser
// E2E test can actually log in through the UI. Password meets the app policy.
const E2E_EMAIL = 'e2e@loadtest.local';
const E2E_PASSWORD = 'E2eTest@12345';

// Host reaches the containerised Mongo on the published port (localhost:27017).
const MONGODB_URI =
  process.env.LOADTEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/smaart_local';
const JWT_SECRET = process.env.JWT_SECRET;
const COUNT = parseInt(process.env.COUNT || '2000', 10);
const TInfo = (...a) => console.log('  ', ...a);

async function main() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET missing — is back-end/.env.local present?');
  }
  const dbName = (MONGODB_URI.split('/').pop() || '').split('?')[0];
  if (!/local/i.test(dbName)) {
    throw new Error(`Refusing to seed: DB name "${dbName}" does not contain "local".`);
  }

  console.log(`\n🌱 Seeding load-test fixtures into ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const Colleges = db.collection('colleges');
  const Assessments = db.collection('assessments');
  const Students = db.collection('students');
  const Courses = db.collection('courses');

  const now = new Date();
  const oid = () => new mongoose.Types.ObjectId();

  // --- Clean any previous load-test fixtures (idempotent) -------------------
  TInfo('Cleaning previous load-test fixtures...');
  await Students.deleteMany({ email: /@loadtest\.local$/i });
  await Assessments.deleteMany({ assessmentCode: 'LOADTEST' });
  await Colleges.deleteMany({ collegeCode: 'LOADTEST' });
  await Courses.deleteMany({ loadtest: true });

  // --- College --------------------------------------------------------------
  const collegeId = oid();
  await Colleges.insertOne({
    _id: collegeId,
    collegeCode: 'LOADTEST',
    collegeNumber: '99',
    collegeName: 'Load Test Institute',
    email: 'loadtest@loadtest.local',
    contactNumber: '9999999999',
    status: 'Active',
    subscriptionPlan: 'premium',
    createdAt: now,
    updatedAt: now,
  });
  TInfo('College created:', collegeId.toString());

  // --- Assessment (with a few questions so /start has work to do) -----------
  const assessmentId = oid();
  const questions = Array.from({ length: 10 }, (_, i) => ({
    _id: oid(),
    question: `Load test question ${i + 1}?`,
    type: 'mcq',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    points: 1,
  }));
  await Assessments.insertOne({
    _id: assessmentId,
    assessmentCode: 'LOADTEST',
    assessmentName: 'Load Test Assessment',
    description: 'Disposable assessment for local load testing',
    questionCategory: 'Capacity',
    questions,
    duration: 30,
    totalQuestions: questions.length,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  TInfo('Assessment created:', assessmentId.toString());

  // --- Courses (realistic payloads so /api/courses serialization is real) ---
  const COURSE_COUNT = parseInt(process.env.SEED_COURSES || '60', 10);
  TInfo(`Creating ${COURSE_COUNT} courses...`);
  const courseDocs = [];
  for (let i = 0; i < COURSE_COUNT; i++) {
    const modules = Array.from({ length: 3 }, (_, m) => ({
      _id: oid(),
      title: `Module ${m + 1}`,
      moduleNumber: m + 1,
      days: Array.from({ length: 6 }, (_, d) => ({
        _id: oid(),
        dayNumber: d + 1,
        title: `Day ${d + 1}`,
        description: 'Lorem ipsum dolor sit amet consectetur. '.repeat(15),
        videoContent: {
          videoUrl: 'https://example.com/video.mp4',
          transcript: 'transcript text segment. '.repeat(25),
        },
        activities: Array.from({ length: 3 }, (_, a) => ({
          title: `Activity ${a + 1}`,
          type: 'quiz',
          points: 10,
        })),
      })),
    }));
    courseDocs.push({
      _id: oid(),
      loadtest: true,
      courseCode: `CRS${String(i + 1).padStart(5, '0')}`,
      title: `Load Test Course ${i + 1}`,
      description: 'Course description text. '.repeat(10),
      category: 'Capacity', // within the default allowed set
      status: 'active',
      modules,
      createdAt: now,
      updatedAt: now,
    });
  }
  await Courses.insertMany(courseDocs, { ordered: false });
  TInfo(`Courses created: ${courseDocs.length}`);

  // --- Students (native bulk insert — fast, no bcrypt, no hooks) ------------
  TInfo(`Creating ${COUNT} students...`);
  const docs = [];
  const ids = [];
  for (let i = 0; i < COUNT; i++) {
    const _id = oid();
    ids.push(_id);
    docs.push({
      _id,
      fullName: `Load Test Student ${i + 1}`,
      email: `student${i + 1}@loadtest.local`,
      mobile: '9000000000',
      password: 'unused-loadtest-placeholder', // never used; we mint tokens
      role: 'student',
      college: collegeId,
      rollNumber: `LT${String(i + 1).padStart(6, '0')}`,
      status: 'active',
      mustChangePassword: false,
      isFirstLogin: false,
      isRegistered: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  // Insert in batches to keep memory flat.
  const BATCH = 1000;
  for (let i = 0; i < docs.length; i += BATCH) {
    await Students.insertMany(docs.slice(i, i + BATCH), { ordered: false });
    TInfo(`  inserted ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
  }

  // --- One real-password student for the browser E2E login test ------------
  const e2eHash = await bcrypt.hash(E2E_PASSWORD, 10);
  await Students.insertOne({
    _id: oid(),
    fullName: 'E2E Test Student',
    email: E2E_EMAIL,
    mobile: '9000000001',
    password: e2eHash,
    role: 'student',
    college: collegeId,
    rollNumber: 'LTE2E0001',
    status: 'active',
    mustChangePassword: false,
    isFirstLogin: false,
    isRegistered: true,
    createdAt: now,
    updatedAt: now,
  });
  TInfo('E2E login student created:', E2E_EMAIL);

  // --- Mint a JWT per student (no sessionId => skips single-session check) ---
  TInfo('Minting JWTs...');
  const tokens = ids.map((id, i) =>
    jwt.sign(
      {
        userId: id.toString(),
        email: `student${i + 1}@loadtest.local`,
        userType: 'student',
        role: 'student',
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
  );

  // --- Write tokens.json for k6 ---------------------------------------------
  const outDir = path.join(__dirname, '..', '..', 'loadtest');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'tokens.json');
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        generatedAt: now.toISOString(),
        count: tokens.length,
        assessmentId: assessmentId.toString(),
        collegeId: collegeId.toString(),
        e2eEmail: E2E_EMAIL,
        e2ePassword: E2E_PASSWORD,
        tokens,
      },
      null,
      0
    )
  );
  console.log(`\n✅ Done. ${tokens.length} tokens written to loadtest/tokens.json`);
  console.log(`   assessmentId: ${assessmentId.toString()}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
