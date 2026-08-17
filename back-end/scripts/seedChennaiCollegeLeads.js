/**
 * Seed Chennai college PROSPECTS into the CollegeLead collection.
 *
 * These are sales leads, NOT onboarded institutions. Nothing here touches the
 * College collection, so the student-facing institution selector is unaffected.
 *
 * Usage:
 *   node scripts/seedChennaiCollegeLeads.js --dry-run    # show what would change, write nothing
 *   node scripts/seedChennaiCollegeLeads.js              # upsert by collegeName (safe to re-run)
 *   node scripts/seedChennaiCollegeLeads.js --print      # after seeding, print the table
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

require('../models/Counter');
const CollegeLead = require('../models/CollegeLead');

const DRY_RUN = process.argv.includes('--dry-run');
const PRINT = process.argv.includes('--print');

const DATA_FILE = path.resolve(__dirname, '../data/chennai-colleges.seed.json');

function loadDataset() {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const batch = raw._meta?.batch || 'chennai-seed';
  return raw.colleges.map((c) => ({
    ...c,
    address: {
      street: c.address?.street || '',
      area: c.address?.area || '',
      city: c.address?.city || 'Chennai',
      district: c.address?.district || 'Chennai',
      state: c.address?.state || 'Tamil Nadu',
      pincode: c.address?.pincode || '',
      country: 'India'
    },
    // Contact details are deliberately empty until an official source fills them.
    emails: [],
    phones: [],
    contactStatus: 'pending',
    contactSourceUrl: c.website || '',
    stage: 'New',
    source: 'Manual',
    sourceBatch: batch,
    tags: ['chennai', (c.category || 'other').toLowerCase().replace(/\s*&\s*/g, '-').replace(/\s+/g, '-')]
  }));
}

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI / MONGODB_URI not set in back-end/.env — aborting.');
    process.exit(1);
  }

  const colleges = loadDataset();
  console.log(`Loaded ${colleges.length} Chennai institutions from ${path.basename(DATA_FILE)}`);

  await mongoose.connect(mongoUri);
  console.log(`Connected to ${mongoose.connection.db.databaseName}${DRY_RUN ? '  [DRY RUN — no writes]' : ''}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const data of colleges) {
    const existing = await CollegeLead.findOne({ collegeName: data.collegeName })
      .collation({ locale: 'en', strength: 2 });

    if (existing) {
      // Never clobber sales progress or human-verified contacts on a re-run.
      const patch = {
        category: data.category,
        institutionType: data.institutionType,
        governanceType: data.governanceType,
        affiliatedUniversity: data.affiliatedUniversity,
        establishedYear: data.establishedYear,
        website: data.website,
        address: data.address
      };
      if (DRY_RUN) {
        console.log(`  ~ would refresh  ${data.collegeName}`);
      } else {
        await CollegeLead.updateOne({ _id: existing._id }, { $set: patch });
        console.log(`  ~ refreshed      ${data.collegeName}`);
      }
      updated += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  + would create   ${data.collegeName}`);
      created += 1;
      continue;
    }

    try {
      const lead = new CollegeLead(data);
      await lead.save(); // .save() so the leadCode pre-save hook runs
      console.log(`  + created        ${lead.leadCode}  ${lead.collegeName}`);
      created += 1;
    } catch (err) {
      console.error(`  ! failed         ${data.collegeName}: ${err.message}`);
      skipped += 1;
    }
  }

  console.log(`\n${DRY_RUN ? 'Would create' : 'Created'}: ${created}   ${DRY_RUN ? 'would refresh' : 'refreshed'}: ${updated}   failed: ${skipped}`);

  const total = await CollegeLead.countDocuments({});
  const pending = await CollegeLead.countDocuments({ contactStatus: 'pending' });
  console.log(`Total college leads in DB: ${total}   awaiting contact verification: ${pending}`);

  if (PRINT) await printTable();

  await mongoose.disconnect();
}

async function printTable() {
  const leads = await CollegeLead.find({ 'address.city': /chennai|chengalpattu|tiruvallur|kancheepuram/i })
    .sort({ category: 1, collegeName: 1 })
    .lean();

  const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n);
  console.log('\n' + '='.repeat(132));
  console.log(pad('LEAD CODE', 16) + pad('COLLEGE', 46) + pad('CATEGORY', 15) + pad('AREA', 18) + pad('PIN', 8) + pad('PHONE', 14) + pad('EMAIL', 14));
  console.log('-'.repeat(132));
  for (const l of leads) {
    console.log(
      pad(l.leadCode, 16) +
      pad(l.collegeName, 46) +
      pad(l.category, 15) +
      pad(l.address?.area, 18) +
      pad(l.address?.pincode, 8) +
      pad(l.phones?.[0] || '— pending', 14) +
      pad(l.emails?.[0] || '— pending', 14)
    );
  }
  console.log('='.repeat(132));
  console.log(`${leads.length} rows. Fill PHONE/EMAIL via: node scripts/importCollegeLeads.js <file.csv>\n`);
}

seed()
  .catch(async (err) => {
    console.error('Seeding failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  });
