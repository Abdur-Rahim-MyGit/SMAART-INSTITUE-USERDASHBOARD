/**
 * Adds the new B.Com-related job roles (from the 2026 B.Com Career Direction
 * research workbooks) to the master `careerroles` collection.
 *
 * Safe by design:
 *  - Only ADDS missing roles. Never deletes or overwrites an existing role's data.
 *  - Matches existing roles case-insensitively, so it will never create a
 *    near-duplicate like "gst executive" next to an existing "GST Executive".
 *  - Does not touch any other collection (Degree, careerdirections, etc.).
 *  - Supports --dry-run to preview exactly what would happen with zero writes.
 *
 * Usage:
 *   node scripts/importBcomNewRoles.js --dry-run   (preview only, no writes)
 *   node scripts/importBcomNewRoles.js             (actually writes)
 *
 * Requires MONGODB_URI to be set (via environment or a real .env file) and
 * point at the real database before running for real.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const newRoles = require('./data/bcom_new_roles.json');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';
const isDryRun = process.argv.includes('--dry-run');

const careerRolesSchema = new mongoose.Schema({}, { strict: false });
const CareerRoleModel =
  mongoose.models['CareerRole'] || mongoose.model('CareerRole', careerRolesSchema, 'careerroles');

async function run() {
  console.log(isDryRun ? 'DRY RUN — no changes will be written.\n' : 'LIVE RUN — this will write to the database.\n');
  console.log(`Connecting to MongoDB (${MONGO_URI.replace(/\/\/.*@/, '//<hidden>@')})...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  let toInsert = 0;
  let alreadyExists = 0;
  const skippedExamples = [];

  for (const role of newRoles) {
    const existing = await CareerRoleModel.findOne({
      role_name: { $regex: `^${escapeRegex(role.role_name)}$`, $options: 'i' }
    }).lean();

    if (existing) {
      alreadyExists++;
      if (skippedExamples.length < 5) skippedExamples.push(role.role_name);
      continue;
    }

    toInsert++;
    if (!isDryRun) {
      await CareerRoleModel.create({
        role_name: role.role_name,
        job_family: role.job_family,
        role_id: role.role_id,
        source: 'bcom-career-direction-2026-import',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  console.log('--- Summary ---');
  console.log(`Total roles considered: ${newRoles.length}`);
  console.log(`Already present in careerroles (skipped, untouched): ${alreadyExists}`);
  if (skippedExamples.length) {
    console.log(`  e.g. ${skippedExamples.join(', ')}${alreadyExists > skippedExamples.length ? ', ...' : ''}`);
  }
  console.log(`${isDryRun ? 'Would be inserted' : 'Newly inserted'}: ${toInsert}`);

  await mongoose.disconnect();
  process.exit(0);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
