const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const careerRolesSchema = new mongoose.Schema({}, { strict: false });
const CareerRoleModel = mongoose.models['CareerRole'] ||
  mongoose.model('CareerRole', careerRolesSchema, 'careerroles');

async function testRoleProfile(roleTitle) {
  console.log(`\n=== Testing: "${roleTitle}" ===`);
  const escTitle = roleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleRegex = new RegExp(`^${escTitle}$`, 'i');

  const db = mongoose.connection.db;

  // Priority 1: roles-profile-data
  const rawDoc = await db.collection('roles-profile-data').findOne({
    'Role Title': { $regex: titleRegex }
  });

  if (rawDoc) {
    const keys = Object.keys(rawDoc);
    const salaryKey0 = keys.find(k => k.includes('Year 0'));
    const salaryKey2 = keys.find(k => k.includes('Year 2'));
    console.log('SOURCE: roles-profile-data ✅');
    console.log('whatRoleDoes:', String(rawDoc['What This Role Actually Does'] || '').substring(0, 80));
    console.log('howAiChanging:', String(rawDoc['How AI Is Changing This Role'] || '').substring(0, 80));
    console.log('whoShouldConsider:', String(rawDoc['Who Should Consider This Role'] || '').substring(0, 80));
    console.log('careerGrowthPath:', String(rawDoc['Career Growth Path'] || '(no field)').substring(0, 80));
    console.log('salaryYear0_1:', salaryKey0 ? rawDoc[salaryKey0] : '(none)');
    return;
  }

  // Priority 2: careerroles
  const careerRoleDoc = await CareerRoleModel.findOne({
    $or: [
      { role_name: { $regex: titleRegex } },
      { 'Job Role': { $regex: titleRegex } }
    ]
  }).lean();

  if (careerRoleDoc) {
    console.log('SOURCE: careerroles ✅');
    console.log('whatRoleDoes (para1):', String(careerRoleDoc.narrative_para1 || '(EMPTY)').substring(0, 100));
    console.log('howAiChanging (para2):', String(careerRoleDoc.narrative_para2 || '(EMPTY)').substring(0, 100));
    console.log('whoShouldConsider (para3):', String(careerRoleDoc.narrative_para3 || '(EMPTY)').substring(0, 100));
    const low = careerRoleDoc.salary_range_low;
    const high = careerRoleDoc.salary_range_high;
    console.log('salary_range:', low && high ? `₹${Math.round(Number(low)/100000)}L – ₹${Math.round(Number(high)/100000)}L` : '(none)');
    return;
  }

  console.log('❌ NOT FOUND in either collection!');
}

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB');
  await testRoleProfile('Cloud Engineer');
  await testRoleProfile('DevOps Engineer');
  await testRoleProfile('Full Stack Developer');
  await testRoleProfile('Data Analyst');
  await testRoleProfile('AWS Solutions Architect');
  await testRoleProfile('Kubernetes Engineer');
  mongoose.disconnect();
  console.log('\n✅ All tests done!');
}).catch(e => console.error('Error:', e.message));
