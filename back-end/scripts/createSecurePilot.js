/**
 * Create (or refresh) the Secure Pilot assessment.
 *
 * Copies the live T2 paper (ASM00002) into ASM00009 "Secure Pilot", switches
 * secure mode on and limits it to the accounts you name. Results for ASM00009
 * are stored under stage "SP" and never touch progression, PLVI or
 * certificates, so the pilot cannot affect a real student's record.
 *
 * Usage (from back-end/):
 *   node scripts/createSecurePilot.js --emails you@college.edu,tester@college.edu \
 *        [--quit-password 1234] [--interval 30] [--retention 90] [--no-screen]
 *
 * Re-running updates the pilot in place (question copy included).
 *
 * To flip the REAL T2 to secure mode after the pilot passes:
 *   node scripts/createSecurePilot.js --enable-code ASM00002 [--emails ...]
 * (an empty --emails list means every student).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const Student = require('../models/Student');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};

const emails = String(flag('--emails', '') || '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const quitPassword = String(flag('--quit-password', '') || '');
const interval = parseInt(flag('--interval', '30'), 10);
const retention = parseInt(flag('--retention', '90'), 10);
const noScreen = args.includes('--no-screen');
const enableCode = flag('--enable-code', null);
const disableCode = flag('--disable-code', null);

const SOURCE_CODE = 'ASM00002';
const PILOT_CODE = 'ASM00009';

async function resolvePilotUsers() {
  if (emails.length === 0) return [];
  const students = await Student.find({ email: { $in: emails } }).select('_id email');
  const found = new Set(students.map((s) => s.email.toLowerCase()));
  emails.filter((e) => !found.has(e)).forEach((e) => console.warn(`  ! no student found for ${e}`));
  return students.map((s) => s._id);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const pilotUserIds = await resolvePilotUsers();

  if (disableCode) {
    const r = await Assessment.updateOne({ assessmentCode: disableCode }, { $set: { 'secure.enabled': false } });
    console.log(`Secure mode OFF for ${disableCode} (${r.modifiedCount} updated)`);
    return;
  }

  if (enableCode) {
    const doc = await Assessment.findOne({ assessmentCode: enableCode });
    if (!doc) throw new Error(`Assessment ${enableCode} not found`);
    doc.secure = {
      ...(doc.secure?.toObject?.() || doc.secure || {}),
      enabled: true,
      requireSeb: true,
      requireScreenCapture: !noScreen,
      screenshotIntervalSec: interval,
      retentionDays: retention,
      pilotUserIds
    };
    if (quitPassword) doc.secure.quitPassword = quitPassword;
    await doc.save();
    console.log(`Secure mode ON for ${enableCode} — ${pilotUserIds.length === 0 ? 'all students' : pilotUserIds.length + ' pilot account(s)'}`);
    return;
  }

  const source = await Assessment.findOne({ assessmentCode: SOURCE_CODE });
  if (!source) throw new Error(`Source assessment ${SOURCE_CODE} (T2) not found`);

  const questions = source.questions.map((q) => {
    const plain = q.toObject ? q.toObject() : { ...q };
    delete plain._id;
    return plain;
  });

  let pilot = await Assessment.findOne({ assessmentCode: PILOT_CODE });
  const secure = {
    enabled: true,
    requireSeb: true,
    requireScreenCapture: !noScreen,
    screenshotIntervalSec: interval,
    retentionDays: retention,
    quitPassword: quitPassword || pilot?.secure?.quitPassword || '',
    allowedUrls: [],
    pilotUserIds,
    notes: `Secure pilot cloned from ${SOURCE_CODE} on ${new Date().toISOString()}`
  };

  if (!pilot) {
    pilot = new Assessment({
      assessmentCode: PILOT_CODE,
      assessmentName: 'Secure Pilot (T2 mirror)',
      description: 'Pilot of the Safe Exam Browser flow. Same paper as T2; results are kept separately and do not count.',
      questionCategory: source.questionCategory,
      questions,
      duration: source.duration,
      createdBy: source.createdBy,
      status: 'active',
      randomizeQuestions: source.randomizeQuestions,
      showResults: source.showResults,
      allowRetake: true,
      maxAttempts: 3,
      passingScore: source.passingScore,
      mcqConfig: source.mcqConfig,
      tags: [...(source.tags || []), 'secure-pilot'],
      secure
    });
    await pilot.save();
    console.log(`Created ${PILOT_CODE} with ${questions.length} questions`);
  } else {
    pilot.questions = questions;
    pilot.status = 'active';
    pilot.secure = secure;
    await pilot.save();
    console.log(`Updated ${PILOT_CODE} with ${questions.length} questions`);
  }
  console.log(`Pilot accounts: ${pilotUserIds.length === 0 ? 'none (nobody sees the card until you add --emails)' : pilotUserIds.length}`);
}

main()
  .then(() => mongoose.disconnect())
  .catch((err) => { console.error(err.message); mongoose.disconnect(); process.exit(1); });
