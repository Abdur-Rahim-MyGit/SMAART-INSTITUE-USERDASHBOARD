/**
 * Item-Bank Audit (Blueprint v1.0 §6) — READ ONLY
 *
 * Checks the question pools that feed the stage assessments against:
 *   (A) Per-stage satisfiability — can the stratified shuffler fill each stage's
 *       required quotient×difficulty distribution WITHOUT reuse? (pool >= required)
 *   (B) Master-bank targets — the 300-item/domain target from the Blueprint:
 *       CRQ45 SRQ40 LQ40 SIQ40 PEQ50 DAQ45 SEQ40 (difficulty 30/45/25).
 *
 * The pools audited are the embedded `questions` on the T1–T4 Assessment docs
 * (ASM00001–04) — the exact source `selectStratifiedQuestionsForStage` samples.
 * Also reports the standalone QuestionBank collection for reference.
 *
 * Run:  node scripts/audit-item-bank.js
 * (No writes. Requires MONGODB_URI in back-end/.env.)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Assessment = require('../models/Assessment');
const { getStageConfig } = require('../config/stage_distributions');

const STAGES = ['T1', 'T2', 'T3', 'T4'];
const QUOTIENTS = ['CRQ', 'SRQ', 'LQ', 'SIQ', 'PEQ', 'DAQ', 'SEQ'];
const DIFFS = ['easy', 'medium', 'hard'];

// Blueprint §6 master-bank targets (per domain)
const MASTER_TARGET = {
    CRQ: { total: 45, easy: 14, medium: 20, hard: 11 },
    SRQ: { total: 40, easy: 12, medium: 18, hard: 10 },
    LQ: { total: 40, easy: 12, medium: 18, hard: 10 },
    SIQ: { total: 40, easy: 12, medium: 18, hard: 10 },
    PEQ: { total: 50, easy: 15, medium: 22, hard: 13 },
    DAQ: { total: 45, easy: 14, medium: 20, hard: 11 },
    SEQ: { total: 40, easy: 12, medium: 18, hard: 10 }
};

function normDiff(level) {
    const l = String(level || '').toLowerCase();
    if (l === 'l1' || l === 'easy') return 'easy';
    if (l === 'l3' || l === 'hard') return 'hard';
    return 'medium'; // l2/medium/unknown
}

function emptyGrid() {
    const g = {};
    QUOTIENTS.forEach(q => { g[q] = { easy: 0, medium: 0, hard: 0, total: 0 }; });
    return g;
}

function tally(questions, grid) {
    for (const q of (questions || [])) {
        const quo = String(q.quotient || '').toUpperCase();
        if (!grid[quo]) continue; // skip unknown/blank quotient
        const d = normDiff(q.difficultyLevel);
        grid[quo][d] += 1;
        grid[quo].total += 1;
    }
}

function pad(s, n) { return String(s).padEnd(n); }
function padn(s, n) { return String(s).padStart(n); }

(async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) { console.error('❌ MONGODB_URI not set in back-end/.env'); process.exit(1); }
    await mongoose.connect(uri);
    console.log('✅ Connected. Auditing item bank (read-only)…\n');

    const master = emptyGrid();
    let grandUnknownQuotient = 0;

    for (const stage of STAGES) {
        const cfg = getStageConfig(stage);
        if (!cfg) { console.log(`(no config for ${stage})`); continue; }
        const assessment = await Assessment.findOne({ assessmentCode: cfg.code }).lean();

        console.log(`══════════ ${stage} (${cfg.code} — ${cfg.name}) ══════════`);
        if (!assessment) {
            console.log(`  ⚠️  Assessment doc ${cfg.code} NOT FOUND — stage cannot be served.\n`);
            continue;
        }
        const pool = assessment.questions || [];
        const grid = emptyGrid();
        // count blank-quotient items
        let unknown = 0;
        for (const q of pool) { if (!grid[String(q.quotient || '').toUpperCase()]) unknown++; }
        grandUnknownQuotient += unknown;
        tally(pool, grid);
        tally(pool, master);

        console.log(`  Pool size: ${pool.length} questions${unknown ? `  (⚠️ ${unknown} with blank/unknown quotient — not usable)` : ''}`);
        console.log(`  Required per attempt: ${cfg.totalQuestions}`);
        console.log(`  ${pad('Quotient', 9)} ${pad('need(E/M/H)', 16)} ${pad('have(E/M/H)', 16)} status`);

        let stageOk = true;
        for (const q of QUOTIENTS) {
            const need = cfg.quotients[q];
            if (!need) continue; // quotient not used by this stage
            const have = grid[q];
            const needStr = `${need.easy}/${need.medium}/${need.hard}`;
            const haveStr = `${have.easy}/${have.medium}/${have.hard}`;
            const shortfalls = DIFFS.filter(d => have[d] < (need[d] || 0));
            const ok = shortfalls.length === 0;
            if (!ok) stageOk = false;
            console.log(`  ${pad(q, 9)} ${pad(needStr, 16)} ${pad(haveStr, 16)} ${ok ? 'OK' : '❌ short: ' + shortfalls.map(d => `${d}(${have[d]}/${need[d]})`).join(', ')}`);
        }
        console.log(`  → ${stageOk ? '✅ Stage can be served from its pool.' : '❌ Pool cannot satisfy the required distribution (will fall back / risk reuse).'}\n`);
    }

    // Master-bank comparison (aggregate across T1–T4 pools)
    console.log('══════════ MASTER BANK vs Blueprint §6 target (300/domain) ══════════');
    console.log(`  ${pad('Quotient', 9)} ${pad('target', 8)} ${pad('have', 6)} ${pad('E t/h', 9)} ${pad('M t/h', 9)} ${pad('H t/h', 9)} status`);
    let masterTotal = 0, targetTotal = 0;
    for (const q of QUOTIENTS) {
        const t = MASTER_TARGET[q];
        const h = master[q];
        masterTotal += h.total; targetTotal += t.total;
        const gaps = DIFFS.filter(d => h[d] < t[d]);
        const ok = h.total >= t.total && gaps.length === 0;
        console.log(`  ${pad(q, 9)} ${padn(t.total, 6)}   ${padn(h.total, 4)}   ${pad(`${t.easy}/${h.easy}`, 9)} ${pad(`${t.medium}/${h.medium}`, 9)} ${pad(`${t.hard}/${h.hard}`, 9)} ${ok ? 'OK' : '❌ ' + (h.total < t.total ? `deficit ${t.total - h.total}` : `diff ${gaps.join(',')}`)}`);
    }
    console.log(`  ───────────────────────────────────────────`);
    console.log(`  TOTAL have ${masterTotal} / target ${targetTotal}  → deficit ${Math.max(0, targetTotal - masterTotal)}`);
    if (grandUnknownQuotient) console.log(`  ⚠️  ${grandUnknownQuotient} questions have a blank/unknown quotient and don't count toward any bucket.`);

    // QuestionBank reference (standalone pool, if used)
    try {
        const QuestionBank = require('../models/QuestionBank');
        const qbTotal = await QuestionBank.countDocuments({ isActive: true });
        console.log(`\n(Reference) QuestionBank collection: ${qbTotal} active items (category/tags-based; not the stage sampling source).`);
    } catch (_) { /* optional */ }

    await mongoose.disconnect();
    console.log('\n✅ Audit complete (no data modified).');
    process.exit(0);
})().catch(err => {
    console.error('❌ Audit failed:', err.message);
    process.exit(1);
});
