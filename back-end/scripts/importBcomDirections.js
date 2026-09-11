/**
 * Replaces all B.Com career direction documents in the `careerdirections`
 * collection with the new, complete set of 85 directions (17 specialisations
 * x 5 directions each) from the 2026 B.Com Career Direction research data.
 *
 * This writes documents in the EXACT SAME SHAPE the existing app code already
 * reads (verbatim field names with spaces, e.g. 'Direction ID', 'Career
 * Direction', 'Job Role 1'..'Job Role 10', 'Role ID 1'..'Role ID 10') so the
 * onboarding dropdown (GET /api/career-agent/directions/:uniqueId) and the
 * report engine (back-end/engine/careerEngine.js fetchDirectionFromDB) both
 * keep working with ZERO code changes.
 *
 * It also stores the new Achievability Tag / Mapping Rationale / Evidence
 * Source data per role in an extra `rolesDetail` field on each document.
 * Nothing currently reads this field, so it is 100% safe to store — it's
 * there and ready for when a future screen wants to show it.
 *
 * DESTRUCTIVE for old B.Com direction data, so:
 *  - Default (no flag) = PREVIEW ONLY. Shows exactly what would be deleted
 *    and what would be inserted. Zero writes.
 *  - --apply = actually makes the change. Backs up every matching existing
 *    document to scripts/backups/ before deleting anything.
 *  - Scoped strictly to B.Com directions: any 'careerdirections' document
 *    whose 'Spec ID' starts with "UG-005-" (old scheme) or "UG-BCOM-" (new
 *    scheme). No other degree's directions are ever queried or touched.
 *
 * Usage:
 *   node scripts/importBcomDirections.js            (preview only, no writes)
 *   node scripts/importBcomDirections.js --apply     (backs up, then replaces)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const newDirections = require('./data/bcom_directions_full.json');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';
const isApply = process.argv.includes('--apply');

const careerAgentDataSchema = new mongoose.Schema({}, { strict: false });
const CareerAgentDataModel =
  mongoose.models['CareerAgentData'] || mongoose.model('CareerAgentData', careerAgentDataSchema, 'careerdirections');

// Scope strictly to B.Com: old scheme (UG-005-*) and any interim/new B.Com scheme (UG-BCOM-*).
const BCOM_FILTER = { 'Spec ID': { $regex: /^UG-(005|BCOM)-/i } };

async function run() {
  console.log(isApply ? 'APPLY MODE — this WILL delete + insert records.\n' : 'PREVIEW MODE — no changes will be written.\n');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const existing = await CareerAgentDataModel.find(BCOM_FILTER).lean();

  console.log(`--- Existing B.Com direction documents found in 'careerdirections': ${existing.length} ---`);
  existing.forEach((d) => console.log(`  ${d['Direction ID'] || '(no ID)'}  |  ${d['Career Direction'] || '(no name)'}  |  Spec ID: ${d['Spec ID'] || '(none)'}`));

  console.log(`\n--- New B.Com direction documents to insert: ${newDirections.length} ---`);
  const bySpec = {};
  newDirections.forEach((d) => {
    bySpec[d['Spec ID']] = (bySpec[d['Spec ID']] || 0) + 1;
  });
  Object.entries(bySpec).forEach(([spec, count]) => console.log(`  ${spec}: ${count} directions`));

  if (!isApply) {
    console.log('\nThis was a PREVIEW only. Nothing was changed.');
    console.log('Run again with --apply to actually back up, delete the old B.Com directions, and insert the new 85.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Safety backup before deleting anything.
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `careerdirections_bcom_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(existing, null, 2));
  console.log(`\nBacked up ${existing.length} existing B.Com direction documents to:\n  ${backupPath}`);

  const deleteResult = await CareerAgentDataModel.deleteMany(BCOM_FILTER);
  console.log(`Deleted ${deleteResult.deletedCount} old B.Com direction documents.`);

  const insertResult = await CareerAgentDataModel.insertMany(newDirections);
  console.log(`Inserted ${insertResult.length} new B.Com direction documents.`);

  console.log('\n--- Done. ---');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
