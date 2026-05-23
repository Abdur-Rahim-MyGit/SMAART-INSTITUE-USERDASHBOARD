require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  const rawTitle = 'Computer Vision & Specialised AI';
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Step 1: exact match
  let rows = await db.collection('roleskillslist')
    .find({ 'Job Role': { $regex: new RegExp(`^${escapeRegex(rawTitle)}$`, 'i') } })
    .toArray();
  console.log('Step 1 (exact):', rows.length, 'rows');

  // Step 2: keyword match
  if (!rows.length) {
    const stopWords = new Set(['and', 'with', 'for', 'the', 'of', 'in', 'at', 'on', 'ai', '&']);
    const keywords = rawTitle
      .replace(/[&/\\]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()));
    console.log('Keywords:', keywords);
    if (keywords.length > 0) {
      const kw = keywords[0];
      rows = await db.collection('roleskillslist')
        .find({ 'Job Role': { $regex: new RegExp(escapeRegex(kw), 'i') } })
        .toArray();
      console.log('Step 2 (keyword "' + kw + '"):', rows.length, 'rows');
      const roles = [...new Set(rows.map(r => r['Job Role']))];
      console.log('Roles found:', roles);
    }
  }

  // Step 3: direction lookup
  if (!rows.length) {
    const dirDoc = await db.collection('careerdirections').findOne({
      'Career Direction': { $regex: new RegExp(escapeRegex(rawTitle), 'i') }
    });
    console.log('Step 3 (careerdirections):', dirDoc ? 'Found: ' + dirDoc['Career Direction'] : 'Not found');
  }

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
