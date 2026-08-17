/**
 * Import / enrich CollegeLead records from an official export (CSV or XLSX).
 *
 * This is how phone + email actually get into the CRM. Source options:
 *   - AISHE institution data:  https://data.gov.in/catalog/institutions-aishe-survey
 *   - TNEA Anna University list: https://www.tnea.in/collegelist.html
 *   - Your own field-verified sheet
 *
 * Expected column headers (case-insensitive, extra columns ignored):
 *   collegeName | name            (required — matched case-insensitively against existing leads)
 *   phone       | contactNumber   (comma-separate for multiple)
 *   email       | institutionEmail
 *   website, aisheCode, area, street, city, district, pincode,
 *   category, institutionType, affiliatedUniversity, establishedYear,
 *   contactName, contactDesignation, contactEmail, contactPhone
 *
 * Rows that match an existing lead ENRICH it and flip contactStatus -> 'verified'.
 * Rows that don't match are created as new leads.
 *
 * Usage:
 *   node scripts/importCollegeLeads.js ./data/aishe-chennai.xlsx --dry-run
 *   node scripts/importCollegeLeads.js ./data/aishe-chennai.xlsx
 *   node scripts/importCollegeLeads.js ./data/verified.csv --source "AISHE Import"
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

require('../models/Counter');
const CollegeLead = require('../models/CollegeLead');

const args = process.argv.slice(2);
const FILE = args.find((a) => !a.startsWith('--'));
const DRY_RUN = args.includes('--dry-run');
const sourceIdx = args.indexOf('--source');
const SOURCE = sourceIdx !== -1 ? args[sourceIdx + 1] : 'AISHE Import';

if (!FILE) {
  console.error('Usage: node scripts/importCollegeLeads.js <file.csv|file.xlsx> [--dry-run] [--source "AISHE Import"]');
  process.exit(1);
}

const PHONE_RE = /^(?:\+?91[-\s]?)?(?:0)?[\d][\d\s-]{7,14}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normalise header keys so "College Name", "college_name", "COLLEGENAME" all collapse to "collegename". */
function normaliseRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[String(k).toLowerCase().replace(/[^a-z0-9]/g, '')] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

const pick = (row, ...keys) => {
  for (const k of keys) {
    const v = row[k.toLowerCase().replace(/[^a-z0-9]/g, '')];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

const splitList = (s) => String(s || '').split(/[,;|/]+/).map((x) => x.trim()).filter(Boolean);

function cleanPhones(raw) {
  return splitList(raw)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => PHONE_RE.test(p));
}

function cleanEmails(raw) {
  return splitList(raw)
    .map((e) => e.toLowerCase())
    .filter((e) => EMAIL_RE.test(e));
}

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI / MONGODB_URI not set in back-end/.env — aborting.');
    process.exit(1);
  }
  const filePath = path.resolve(process.cwd(), FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }).map(normaliseRow);
  console.log(`Read ${rows.length} rows from ${path.basename(filePath)}${DRY_RUN ? '  [DRY RUN — no writes]' : ''}`);

  await mongoose.connect(mongoUri);
  console.log(`Connected to ${mongoose.connection.db.databaseName}\n`);

  let enriched = 0; let created = 0; let noContact = 0; let bad = 0;

  for (const [i, row] of rows.entries()) {
    const collegeName = pick(row, 'collegeName', 'name', 'institutionName', 'nameOfInstitute');
    if (!collegeName) { bad += 1; continue; }

    const phones = cleanPhones(pick(row, 'phone', 'phones', 'contactNumber', 'mobile', 'telephone'));
    const emails = cleanEmails(pick(row, 'email', 'emails', 'institutionEmail', 'emailId'));
    const website = pick(row, 'website', 'url', 'institutionWebsite');

    const contactPerson = pick(row, 'contactName', 'principalName', 'coordinatorName');
    const contacts = contactPerson ? [{
      name: contactPerson,
      designation: pick(row, 'contactDesignation', 'designation') || 'Principal',
      email: cleanEmails(pick(row, 'contactEmail'))[0] || '',
      phone: cleanPhones(pick(row, 'contactPhone'))[0] || '',
      isPrimary: true,
      verified: true
    }] : [];

    const hasContact = phones.length > 0 || emails.length > 0;
    if (!hasContact) noContact += 1;

    const addressPatch = {};
    const street = pick(row, 'street', 'address', 'addressLine');
    const area = pick(row, 'area', 'locality');
    const city = pick(row, 'city');
    const district = pick(row, 'district');
    const pincode = pick(row, 'pincode', 'pin', 'postalCode', 'zip');
    if (street) addressPatch['address.street'] = street;
    if (area) addressPatch['address.area'] = area;
    if (city) addressPatch['address.city'] = city;
    if (district) addressPatch['address.district'] = district;
    if (pincode) addressPatch['address.pincode'] = pincode;

    const existing = await CollegeLead.findOne({ collegeName })
      .collation({ locale: 'en', strength: 2 });

    if (existing) {
      const set = { ...addressPatch };
      // Union, don't overwrite — a lead can legitimately have several numbers.
      const mergedPhones = [...new Set([...(existing.phones || []), ...phones])];
      const mergedEmails = [...new Set([...(existing.emails || []), ...emails])];
      if (mergedPhones.length) set.phones = mergedPhones;
      if (mergedEmails.length) set.emails = mergedEmails;
      if (website && !existing.website) set.website = website;
      if (pick(row, 'aisheCode')) set.aisheCode = pick(row, 'aisheCode');
      if (contacts.length) set.contacts = [...(existing.contacts || []), ...contacts];
      if (hasContact) {
        set.contactStatus = 'verified';
        set.contactVerifiedAt = new Date();
        set.contactSourceUrl = website || existing.contactSourceUrl;
      }

      if (DRY_RUN) {
        console.log(`  ~ would enrich  ${collegeName}  (+${phones.length} phone, +${emails.length} email)`);
      } else {
        await CollegeLead.updateOne({ _id: existing._id }, { $set: set });
        console.log(`  ~ enriched      ${collegeName}  (+${phones.length} phone, +${emails.length} email)`);
      }
      enriched += 1;
      continue;
    }

    const doc = {
      collegeName,
      aisheCode: pick(row, 'aisheCode'),
      category: pick(row, 'category') || 'Other',
      institutionType: pick(row, 'institutionType') || 'College',
      affiliatedUniversity: pick(row, 'affiliatedUniversity', 'university'),
      establishedYear: Number(pick(row, 'establishedYear', 'yearOfEstablishment')) || undefined,
      website,
      phones,
      emails,
      contacts,
      contactStatus: hasContact ? 'verified' : 'pending',
      contactVerifiedAt: hasContact ? new Date() : undefined,
      contactSourceUrl: website,
      address: {
        street, area,
        city: city || 'Chennai',
        district: district || city || 'Chennai',
        state: pick(row, 'state') || 'Tamil Nadu',
        pincode,
        country: 'India'
      },
      stage: 'New',
      source: SOURCE,
      sourceBatch: path.basename(filePath),
      tags: ['imported']
    };

    if (DRY_RUN) {
      console.log(`  + would create  ${collegeName}`);
      created += 1;
      continue;
    }

    try {
      const lead = new CollegeLead(doc);
      await lead.save();
      console.log(`  + created       ${lead.leadCode}  ${collegeName}`);
      created += 1;
    } catch (err) {
      console.error(`  ! row ${i + 2} failed  ${collegeName}: ${err.message}`);
      bad += 1;
    }
  }

  console.log(`\nEnriched: ${enriched}   created: ${created}   rows with no usable contact: ${noContact}   bad/failed: ${bad}`);

  const verified = await CollegeLead.countDocuments({ contactStatus: 'verified' });
  const pending = await CollegeLead.countDocuments({ contactStatus: 'pending' });
  console.log(`Contact status across all leads — verified: ${verified}, pending: ${pending}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Import failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
