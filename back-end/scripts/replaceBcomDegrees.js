/**
 * Replaces the current B.Com Degree records (9 specialisations) with the new,
 * complete set of 17 specialisations from the 2026 B.Com Career Direction
 * research data.
 *
 * This is a DESTRUCTIVE step for the old B.Com entries (they get deleted),
 * so it is deliberately extra-cautious:
 *
 *  - Default (no flag) = PREVIEW ONLY. Shows exactly which existing Degree
 *    documents would be deleted and which 17 new ones would be inserted.
 *    Zero writes.
 *  - --apply = actually makes the change. Before deleting anything, it
 *    automatically saves a full backup of every B.Com Degree document it's
 *    about to remove into scripts/backups/, so nothing is ever lost.
 *  - Only touches Degree documents belonging to B.Com (abbreviation "B.Com.",
 *    level "Undergraduate (UG)"). Every other degree (BBA/BCA/BSc/etc.) is
 *    never queried or touched.
 *
 * Usage:
 *   node scripts/replaceBcomDegrees.js            (preview only, no writes)
 *   node scripts/replaceBcomDegrees.js --apply     (backs up, then replaces)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const newDegrees = require('./data/bcom_new_degrees.json');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';
const isApply = process.argv.includes('--apply');

const degreeSchema = new mongoose.Schema({}, { strict: false });
const DegreeModel = mongoose.models['Degree'] || mongoose.model('Degree', degreeSchema, 'degrees');

// Scope strictly to B.Com, undergraduate level, so no other degree is ever touched.
const BCOM_FILTER = { abbreviation: 'B.Com.', level: 'Undergraduate (UG)' };

async function run() {
  console.log(isApply ? 'APPLY MODE — this WILL delete + insert records.\n' : 'PREVIEW MODE — no changes will be written.\n');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const existing = await DegreeModel.find(BCOM_FILTER).lean();

  console.log(`--- Existing B.Com Degree records found: ${existing.length} ---`);
  existing.forEach((d) => console.log(`  ${d.uniqueId}  |  ${d.specialization}`));

  console.log(`\n--- New B.Com Degree records to insert: ${newDegrees.length} ---`);
  newDegrees.forEach((d) => console.log(`  ${d.uniqueId}  |  ${d.specialization}`));

  if (!isApply) {
    console.log('\nThis was a PREVIEW only. Nothing was changed.');
    console.log('Run again with --apply to actually back up, delete the old records, and insert the new 17.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Safety backup before deleting anything.
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `degree_bcom_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(existing, null, 2));
  console.log(`\nBacked up ${existing.length} existing B.Com Degree records to:\n  ${backupPath}`);

  const deleteResult = await DegreeModel.deleteMany(BCOM_FILTER);
  console.log(`Deleted ${deleteResult.deletedCount} old B.Com Degree records.`);

  const insertResult = await DegreeModel.insertMany(newDegrees);
  console.log(`Inserted ${insertResult.length} new B.Com Degree records.`);

  console.log('\n--- Done. ---');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
