/**
 * Seed T1 Baseline item bank (Path A) — expand ASM00001 to the Blueprint target
 * by copying balanced, de-duplicated NON-SEQ items from the existing T2/T3/T4
 * banks (ASM00002-04), and remove the dead SEQ items T1 no longer uses.
 *
 * Safe by design:
 *   - DRY RUN by default; writes ONLY with `--apply`.
 *   - Backs up ASM00001.questions to scripts/backups/ before any write.
 *   - Idempotent: re-running only tops up cells still below target.
 *   - Dedupes by question text (vs T1 and across sources); copies get fresh IDs.
 *
 * Usage:
 *   node scripts/seed-t1-bank.js            # dry run (plan only)
 *   node scripts/seed-t1-bank.js --apply    # write changes
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Assessment = require('../models/Assessment');

const APPLY = process.argv.includes('--apply');

// Blueprint §6 target for T1 (300/domain minus SEQ) — per quotient × difficulty.
const TARGET = {
    CRQ: { easy: 14, medium: 20, hard: 11 },
    SRQ: { easy: 12, medium: 18, hard: 10 },
    LQ: { easy: 12, medium: 18, hard: 10 },
    SIQ: { easy: 12, medium: 18, hard: 10 },
    PEQ: { easy: 15, medium: 22, hard: 13 },
    DAQ: { easy: 14, medium: 20, hard: 11 }
};
const QUOTIENTS = Object.keys(TARGET); // 6, no SEQ
const DIFFS = ['easy', 'medium', 'hard'];
const VALID_TYPES = ['likert', 'likert_negative', 'likert_7', 'mcq'];

const up = (s) => String(s || '').toUpperCase();
const normDiff = (l) => {
    l = String(l || '').toLowerCase();
    if (l === 'l1' || l === 'easy') return 'easy';
    if (l === 'l3' || l === 'hard') return 'hard';
    return 'medium';
};
const normText = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
const cell = (q, d) => `${q}|${d}`;

function cloneItem(item, quotient, n) {
    const type = VALID_TYPES.includes(item.type) ? item.type : 'mcq';
    const options = Array.isArray(item.options)
        ? item.options.map(o => ({ value: o.value, label: o.label }))
        : [];
    return {
        questionId: `T1-SEED-${quotient}-${String(n).padStart(4, '0')}`,
        questionText: item.questionText,
        type,
        options,
        correctAnswer: item.correctAnswer,
        quotient,
        difficultyLevel: item.difficultyLevel,
        points: item.points || 1,
        order: 0,
        explanation: item.explanation || ''
    };
}

function gridString(counts) {
    return QUOTIENTS.map(q => `${q} ${counts[q].easy}/${counts[q].medium}/${counts[q].hard}(${counts[q].easy + counts[q].medium + counts[q].hard})`).join('  ');
}

(async () => {
    if (!process.env.MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected. Mode: ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

    const t1 = await Assessment.findOne({ assessmentCode: 'ASM00001' });
    if (!t1) { console.error('❌ ASM00001 not found'); process.exit(1); }

    const sources = await Assessment.find({ assessmentCode: { $in: ['ASM00002', 'ASM00003', 'ASM00004'] } }).lean();

    // Dedup sets: texts already in T1, and texts already chosen from sources.
    const t1Texts = new Set((t1.questions || []).map(q => normText(q.questionText)));
    const chosenText = new Set();

    // Build source pool by cell (non-SEQ, deduped).
    const pool = {};
    for (const src of sources) {
        for (const q of (src.questions || [])) {
            const quo = up(q.quotient);
            if (!TARGET[quo]) continue; // skip SEQ / unknown
            const nt = normText(q.questionText);
            if (!nt || t1Texts.has(nt) || chosenText.has(nt)) continue;
            chosenText.add(nt);
            const key = cell(quo, normDiff(q.difficultyLevel));
            (pool[key] = pool[key] || []).push(q);
        }
    }

    // Current T1 counts (non-SEQ) + collect dead SEQ.
    const cur = {}; QUOTIENTS.forEach(q => cur[q] = { easy: 0, medium: 0, hard: 0 });
    let seqCount = 0;
    for (const q of (t1.questions || [])) {
        const quo = up(q.quotient);
        if (quo === 'SEQ') { seqCount++; continue; }
        if (TARGET[quo]) cur[quo][normDiff(q.difficultyLevel)]++;
    }

    console.log('Current usable T1:', gridString(cur));
    console.log(`Dead SEQ items to remove: ${seqCount}\n`);

    // Plan additions per cell.
    const toAdd = [];
    const shortfalls = [];
    let counter = 1;
    for (const q of QUOTIENTS) {
        for (const d of DIFFS) {
            const need = TARGET[q][d] - cur[q][d];
            if (need <= 0) continue;
            const avail = pool[cell(q, d)] || [];
            const take = avail.splice(0, need);
            if (take.length < need) shortfalls.push(`${q}/${d}: need ${need}, source had ${take.length}`);
            for (const item of take) toAdd.push(cloneItem(item, q, counter++));
        }
    }

    // Resulting projected counts.
    const proj = {}; QUOTIENTS.forEach(q => proj[q] = { ...cur[q] });
    for (const a of toAdd) proj[up(a.quotient)][normDiff(a.difficultyLevel)]++;

    console.log(`Items to add: ${toAdd.length}`);
    const addByQ = {}; QUOTIENTS.forEach(q => addByQ[q] = 0);
    toAdd.forEach(a => addByQ[up(a.quotient)]++);
    console.log('  per quotient:', QUOTIENTS.map(q => `${q}+${addByQ[q]}`).join('  '));
    console.log('Projected T1:', gridString(proj));
    const projTotal = QUOTIENTS.reduce((t, q) => t + proj[q].easy + proj[q].medium + proj[q].hard, 0);
    console.log(`Projected usable total: ${projTotal} (target 260)`);
    if (shortfalls.length) { console.log('\n⚠️ Shortfalls (source pool insufficient):'); shortfalls.forEach(s => console.log('   ' + s)); }

    if (!APPLY) {
        console.log('\nℹ️  DRY RUN — no changes written. Re-run with --apply to commit.');
        await mongoose.disconnect();
        process.exit(0);
    }

    // ---- APPLY ----
    // 1. Backup
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `ASM00001-questions-${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(t1.questions, null, 2));
    console.log(`\n💾 Backup written: ${backupPath}`);

    // 2. Remove dead SEQ + append new items
    t1.questions = (t1.questions || []).filter(q => up(q.quotient) !== 'SEQ');
    toAdd.forEach(a => t1.questions.push(a));
    // Re-number order
    t1.questions.forEach((q, i) => { q.order = i; });
    t1.totalQuestions = t1.questions.length;
    t1.lastModifiedBy = t1.lastModifiedBy || t1.createdBy;

    await t1.save();
    console.log(`✅ ASM00001 updated. New pool size: ${t1.questions.length} (removed ${seqCount} SEQ, added ${toAdd.length}).`);

    await mongoose.disconnect();
    console.log('\n✅ Done. Re-run scripts/audit-item-bank.js to confirm T1 is green.');
    process.exit(0);
})().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
