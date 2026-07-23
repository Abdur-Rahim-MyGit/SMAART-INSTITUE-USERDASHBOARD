/**
 * Question bank audit.
 *
 * The retry model only works if a re-sit draws DIFFERENT questions. The
 * selector (utils/questionShuffler) already excludes previously-seen question
 * IDs, but when a pool runs dry it silently falls back to reusing them — which
 * would hand a flagged candidate the same paper they just saw.
 *
 * This reports, per stage and per quotient × difficulty cell, whether the bank
 * is deep enough to support MAX_RETRY_ATTEMPTS distinct papers.
 *
 * Usage:  node scripts/auditQuestionBank.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const { STAGE_DISTRIBUTIONS } = require('../config/stage_distributions');
const { MAX_RETRY_ATTEMPTS } = require('../config/proctoringPolicy');

// Attempts that must be servable with non-overlapping questions:
// the first sitting plus every allowed retake.
const PAPERS_NEEDED = MAX_RETRY_ATTEMPTS + 1;

const normalizeDifficulty = (level) => {
  const l = String(level || '').toLowerCase();
  if (l.includes('easy') || l === 'l1' || l === '1') return 'easy';
  if (l.includes('hard') || l === 'l3' || l === '3') return 'hard';
  return 'medium';
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to back-end/.env and retry.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected.\n');

  let anyShortfall = false;

  for (const [stageKey, stage] of Object.entries(STAGE_DISTRIBUTIONS)) {
    const assessment = await Assessment.findOne({ assessmentCode: stage.code });

    console.log('─'.repeat(72));
    console.log(`${stageKey}  ${stage.name}  (${stage.code})`);

    if (!assessment) {
      console.log('  ⚠️  No assessment found for this code — nothing to audit.\n');
      continue;
    }

    // Count the bank by quotient × difficulty
    const pools = {};
    (assessment.questions || []).forEach((q) => {
      if (!q.quotient) return;
      const key = `${q.quotient.toUpperCase()}_${normalizeDifficulty(q.difficultyLevel)}`;
      pools[key] = (pools[key] || 0) + 1;
    });

    console.log(
      `  Bank: ${assessment.questions?.length || 0} questions · ` +
      `Paper: ${stage.totalQuestions} · ` +
      `Max attempts: ${stage.maxAttempts}`
    );

    const shortfalls = [];
    let neededTotal = 0;

    for (const [quotient, difficulties] of Object.entries(stage.quotients)) {
      for (const [difficulty, perPaper] of Object.entries(difficulties)) {
        if (!perPaper) continue;

        const key = `${quotient}_${difficulty}`;
        const have = pools[key] || 0;
        // Only as many distinct papers as this stage actually allows.
        const papers = Math.min(PAPERS_NEEDED, stage.maxAttempts || 1);
        const need = perPaper * papers;
        neededTotal += need;

        if (have < need) {
          shortfalls.push({ key, have, need, perPaper, papers });
        }
      }
    }

    if (!shortfalls.length) {
      console.log(`  ✅ Bank supports ${Math.min(PAPERS_NEEDED, stage.maxAttempts || 1)} distinct paper(s).\n`);
      continue;
    }

    anyShortfall = true;
    console.log(`  ❌ Too shallow for ${Math.min(PAPERS_NEEDED, stage.maxAttempts || 1)} distinct paper(s).`);
    console.log(`     Needs ~${neededTotal} tagged questions in total.\n`);
    console.log('     cell                      have   need   short');
    shortfalls
      .sort((a, b) => (b.need - b.have) - (a.need - a.have))
      .forEach(({ key, have, need }) => {
        console.log(
          `     ${key.padEnd(24)} ${String(have).padStart(4)}  ${String(need).padStart(5)}  ${String(need - have).padStart(5)}`
        );
      });
    console.log('');
  }

  console.log('─'.repeat(72));
  if (anyShortfall) {
    console.log(
      '\nAt least one stage cannot serve a full set of distinct retake papers.\n' +
      'Until those cells are filled, a retake may reuse questions the candidate\n' +
      'has already seen. Either add tagged questions, or lower maxAttempts.\n'
    );
  } else {
    console.log('\nAll stages can serve distinct papers for every allowed attempt.\n');
  }

  await mongoose.disconnect();
  process.exit(anyShortfall ? 1 : 0);
};

run().catch(async (err) => {
  console.error('Audit failed:', err.message);
  try { await mongoose.disconnect(); } catch { /* already closed */ }
  process.exit(1);
});
