/**
 * Fixes a regression from replaceBcomDegrees.js: the new 17 B.Com Degree
 * records were inserted with only { uniqueId, level, domain, fullName,
 * abbreviation, specialization } — missing the `courseId` and `sourceDegree`
 * fields that the Admin Panel's "Add Degree" picker requires to show a degree
 * in its Undergraduate (UG) list (Admin repo: Backend/models/Degree.js,
 * Frontend/src/pages/Colleges/OnboardCollege.js — UG level is scoped to
 * `degrees.filter(d => d.courseId && d.sourceDegree)`).
 *
 * The old (pre-replacement) B.Com records had these fields set — seeded from
 * the admin's Backend/data/ugDegreeCatalog.js (courseId format "UG-BCOM-NNN",
 * sourceDegree "B.Com.") — so this restores them without touching anything
 * else on the document.
 *
 *  - Default (no flag) = PREVIEW ONLY. Shows exactly which B.Com Degree
 *    documents are missing courseId/sourceDegree and what would be set.
 *    Zero writes.
 *  - --apply = actually writes the two fields via $set (never touches any
 *    other field, never deletes/inserts anything).
 *  - Only touches Degree documents belonging to B.Com (abbreviation
 *    "B.Com.", level "Undergraduate (UG)"). Every other degree is never
 *    queried or touched.
 *
 * Usage:
 *   node scripts/fixBcomAdminCatalogFields.js            (preview only)
 *   node scripts/fixBcomAdminCatalogFields.js --apply     (writes the fix)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';
const isApply = process.argv.includes('--apply');

const degreeSchema = new mongoose.Schema({}, { strict: false });
const DegreeModel = mongoose.models['Degree'] || mongoose.model('Degree', degreeSchema, 'degrees');

// Scope strictly to B.Com, undergraduate level — same filter replaceBcomDegrees.js used.
const BCOM_FILTER = { abbreviation: 'B.Com.', level: 'Undergraduate (UG)' };
const SOURCE_DEGREE = 'B.Com.';

async function run() {
  console.log(isApply ? 'APPLY MODE — this WILL write courseId/sourceDegree.\n' : 'PREVIEW MODE — no changes will be written.\n');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const docs = await DegreeModel.find(BCOM_FILTER).lean();
  console.log(`--- B.Com Degree records found: ${docs.length} ---`);

  const needsFix = docs.filter((d) => !d.courseId || !d.sourceDegree);
  const alreadyOk = docs.length - needsFix.length;

  console.log(`  Already have courseId + sourceDegree: ${alreadyOk}`);
  console.log(`  Missing one or both (will be fixed):  ${needsFix.length}\n`);

  needsFix.forEach((d) => {
    console.log(`  ${d.uniqueId}  |  ${d.specialization}`);
    console.log(`    courseId:     ${d.courseId || '(missing)'}  ->  ${d.courseId || d.uniqueId}`);
    console.log(`    sourceDegree: ${d.sourceDegree || '(missing)'}  ->  ${d.sourceDegree || SOURCE_DEGREE}`);
  });

  if (needsFix.length === 0) {
    console.log('\nNothing to fix — every B.Com Degree record already has both fields.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (!isApply) {
    console.log('\nThis was a PREVIEW only. Nothing was changed.');
    console.log('Run again with --apply to actually write these fields.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let updated = 0;
  for (const d of needsFix) {
    const set = {};
    if (!d.courseId) set.courseId = d.uniqueId;
    if (!d.sourceDegree) set.sourceDegree = SOURCE_DEGREE;
    await DegreeModel.updateOne({ _id: d._id }, { $set: set });
    updated += 1;
  }

  console.log(`\nUpdated ${updated} B.Com Degree record(s).`);
  console.log('--- Done. ---');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
