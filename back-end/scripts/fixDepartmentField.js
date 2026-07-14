/**
 * fixDepartmentField.js
 * 
 * One-shot migration script to repair Student documents where `department`
 * was mistakenly stored as a plain string instead of a subdocument object.
 * 
 * Run with:  node scripts/fixDepartmentField.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

async function run() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  const db = mongoose.connection.db;
  const collection = db.collection('students');

  // Find all students where `department` is stored as a string (the corrupt state)
  const badDocs = await collection.find({ department: { $type: 'string' } }).toArray();
  console.log(`📋 Found ${badDocs.length} corrupted student document(s) with string department.`);

  if (badDocs.length === 0) {
    console.log('✅ No corrupted documents found. Database is clean.');
    await mongoose.disconnect();
    return;
  }

  for (const doc of badDocs) {
    const stringValue = doc.department; // e.g. "Master of Business Administration"
    console.log(`  ➡️  Fixing student: ${doc.email} | corrupted department value: "${stringValue}"`);

    // Unset the bad string value. The student's degree info is preserved in
    // doc.academic (degreeLevel, degreeGroup, domain, specialisation) so no
    // data is lost — only the invalid primitive is removed.
    await collection.updateOne(
      { _id: doc._id },
      { $unset: { department: '' } }
    );
  }

  console.log(`\n✅ Fixed ${badDocs.length} document(s). The 'department' field has been removed.`);
  console.log('ℹ️  Degree info is preserved in each student\'s "academic" subdocument.');

  await mongoose.disconnect();
  console.log('🔌 Disconnected.');
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
