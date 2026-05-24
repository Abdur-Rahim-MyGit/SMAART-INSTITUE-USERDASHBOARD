require('dotenv').config();
const mongoose = require('mongoose');

function deriveUrl(certName, issuingBody) {
  const c = (certName  || '').toLowerCase();
  const p = (issuingBody || '').toLowerCase();
  if (p.includes('github') || c.includes('github'))          return 'https://learn.microsoft.com/en-us/certifications/github/';
  if (p.includes('google') && c.includes('it automation'))   return 'https://www.coursera.org/professional-certificates/google-it-automation';
  if (p.includes('google') && c.includes('technical writing')) return 'https://developers.google.com/tech-writing';
  if (p.includes('google'))                                  return 'https://grow.google/certificates/';
  if (p.includes('deeplearning') || c.includes('deeplearning')) return 'https://www.deeplearning.ai/courses/';
  if (p.includes('hugging face') || c.includes('hugging face')) return 'https://huggingface.co/learn';
  if (p.includes('docker') || p.includes('mirantis') || c.includes('docker')) return 'https://training.mirantis.com/dca-certification-exam/';
  if (p.includes('atlassian') || c.includes('atlassian') || c.includes('jira')) return 'https://university.atlassian.com/';
  if (p.includes('meity') || c.includes('dpdp')) return 'https://meity.gov.in/';
  if (p.includes('microsoft')) return 'https://learn.microsoft.com/en-us/certifications/';
  return `https://www.google.com/search?q=${encodeURIComponent(certName)}`;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const roleTitle = 'Computer Vision Engineer';
  const roleSkillRows = await db.collection('roleskillslist')
    .find({ 'Job Role': roleTitle }).toArray();
  const skillIds = [...new Set(roleSkillRows.map(r => r['Skill ID']).filter(Boolean))];
  const certs = await db.collection('career-agent-certifaction')
    .find({ skill_id: { $in: skillIds } }).toArray();

  console.log(`\n✅ ${roleTitle}: ${certs.length} certs | ${skillIds.length} skills matched`);
  console.log('\n--- TECHNICAL ---');
  certs.filter(c => c.category === 'Technical').forEach(c => {
    console.log(`  ${c.skill_id} | ${c.skill_name} → ${c.suggested_certificates}`);
    console.log(`    URL: ${deriveUrl(c.suggested_certificates, c.issuing_body)}`);
  });
  console.log('\n--- AI-TOOL ---');
  certs.filter(c => c.category === 'AI-Tool').forEach(c => {
    console.log(`  ${c.skill_id} | ${c.skill_name} → ${c.suggested_certificates}`);
    console.log(`    URL: ${deriveUrl(c.suggested_certificates, c.issuing_body)}`);
  });
  console.log('\n--- DOMAIN ---');
  certs.filter(c => c.category === 'Domain').forEach(c => {
    console.log(`  ${c.skill_id} | ${c.skill_name} → ${c.suggested_certificates}`);
    console.log(`    URL: ${deriveUrl(c.suggested_certificates, c.issuing_body)}`);
  });

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
