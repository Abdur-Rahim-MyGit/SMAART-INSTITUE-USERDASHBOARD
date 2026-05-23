require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const PLACEHOLDER = 'https://www.coursera.org/professional-certificates/google-it-automation';
  function deriveUrl(certName, issuingBody) {
    const c = (certName  || '').toLowerCase();
    const p = (issuingBody || '').toLowerCase();
    if (p.includes('github') || c.includes('github'))          return 'https://learn.microsoft.com/en-us/certifications/github/';
    if (p.includes('google') && c.includes('it automation'))   return 'https://www.coursera.org/professional-certificates/google-it-automation';
    if (p.includes('google') && c.includes('technical writing')) return 'https://developers.google.com/tech-writing';
    if (p.includes('google'))                                  return 'https://grow.google/certificates/';
    if (p.includes('aws') || c.includes('aws'))                return 'https://aws.amazon.com/certification/';
    if (p.includes('deeplearning') || c.includes('deeplearning')) return 'https://www.deeplearning.ai/courses/';
    if (p.includes('hugging face') || c.includes('hugging face')) return 'https://huggingface.co/learn';
    if (p.includes('docker') || p.includes('mirantis') || c.includes('docker')) return 'https://training.mirantis.com/dca-certification-exam/';
    if (p.includes('atlassian') || c.includes('atlassian') || c.includes('jira')) return 'https://university.atlassian.com/';
    if (p.includes('meity') || c.includes('dpdp'))             return 'https://meity.gov.in/';
    if (c.includes('niti aayog') || p.includes('niti'))        return 'https://www.niti.gov.in/';
    if (p.includes('microsoft'))                               return 'https://learn.microsoft.com/en-us/certifications/';
    return `https://www.google.com/search?q=${encodeURIComponent(certName)}`;
  }

  // Simulate the certifications route for Python Developer
  const roleTitle = 'Python Developer';
  const rows = await db.collection('roleskillslist')
    .find({ 'Job Role': roleTitle }).toArray();
  const skillIds = [...new Set(rows.map(r => r['Skill ID']).filter(Boolean))];
  const certs = await db.collection('career-agent-certifaction')
    .find({ skill_id: { $in: skillIds } }).toArray();
  
  console.log(`✅ Python Developer: ${rows.length} role rows, ${skillIds.length} unique skills, ${certs.length} certs`);
  console.log('Skill IDs:', skillIds);
  const tech = certs.filter(c => c.category === 'Technical');
  const ai = certs.filter(c => c.category === 'AI-Tool');
  const domain = certs.filter(c => c.category === 'Domain');
  console.log(`Technical: ${tech.length}, AI: ${ai.length}, Domain: ${domain.length}`);
  
  // Show first 3 with URL derivation
  console.log('\n--- Sample with URL ---');
  certs.slice(0, 5).forEach(c => {
    const dbUrl = c.official_url || '';
    const url = dbUrl && dbUrl !== PLACEHOLDER ? dbUrl : deriveUrl(c.suggested_certificates, c.issuing_body);
    console.log(`  ${c.category} | ${c.skill_name}: ${c.suggested_certificates}`);
    console.log(`    → ${url}`);
  });

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
