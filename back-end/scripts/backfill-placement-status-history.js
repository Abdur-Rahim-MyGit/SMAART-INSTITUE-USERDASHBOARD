/**
 * backfill-placement-status-history.js
 * ────────────────────────────────────
 * ONE-TIME MIGRATION SCRIPT
 *
 * Placement applications written before `statusHistory` existed have no
 * stage-by-stage record. This script persists the same two-point fallback the
 * API synthesises at read time (applied at → current status) so every row in
 * `placementapplications` carries a real `statusHistory` array.
 *
 * Entries are written with `changedBy: 'migration'` and `synthesized: true`
 * so the student's timeline can still say the dates are approximate.
 *
 * SAFE to run multiple times — only rows with a missing or empty
 * `statusHistory` are touched. Nothing else on the document changes.
 *
 * Usage (from the back-end directory):
 *   node scripts/backfill-placement-status-history.js            # apply
 *   node scripts/backfill-placement-status-history.js --dry-run  # report only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PlacementApplication = require('../models/PlacementApplication');

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH = 500;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected${DRY_RUN ? ' (dry run — no writes)' : ''}`);

  const filter = {
    $or: [
      { statusHistory: { $exists: false } },
      { statusHistory: null },
      { statusHistory: { $size: 0 } },
    ],
  };

  const total = await PlacementApplication.countDocuments({});
  const pending = await PlacementApplication.countDocuments(filter);
  console.log(`📦 ${total} applications, ${pending} without statusHistory`);
  if (pending === 0) return;

  const cursor = PlacementApplication.find(filter)
    .select('_id status appliedAt createdAt updatedAt declineReason')
    .lean()
    .cursor();

  let ops = [];
  let updated = 0;
  let skipped = 0;

  const flush = async () => {
    if (!ops.length) return;
    if (!DRY_RUN) {
      const result = await PlacementApplication.bulkWrite(ops, { ordered: false });
      updated += result.modifiedCount || 0;
    } else {
      updated += ops.length;
    }
    ops = [];
  };

  for await (const app of cursor) {
    const statusHistory = PlacementApplication.buildFallbackHistory(app);
    if (!statusHistory.length) { skipped += 1; continue; }
    ops.push({
      updateOne: {
        // Re-check emptiness in the filter so a concurrent status change
        // that already wrote real history is never overwritten.
        filter: { _id: app._id, ...filter },
        update: { $set: { statusHistory } },
      },
    });
    if (ops.length >= BATCH) await flush();
  }
  await flush();

  console.log(`✨ ${DRY_RUN ? 'Would update' : 'Updated'} ${updated} application(s), skipped ${skipped}`);
}

run()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  });
