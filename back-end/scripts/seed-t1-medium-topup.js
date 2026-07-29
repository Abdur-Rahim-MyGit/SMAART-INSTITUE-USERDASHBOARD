/**
 * T1 medium top-up — bring ASM00001 from 240 → 260 (Blueprint §6 target).
 *
 * Adds the 20 MISSING medium (L2) items the source banks couldn't supply:
 *   CRQ +4, SRQ +2, LQ +1, SIQ +2, PEQ +7, DAQ +4.
 *
 * ⚠️ These 20 items are AI-DRAFTED baseline readiness MCQs and MUST be reviewed
 * by a content/psychometrics owner before high-stakes use. They are tagged
 * `tags:['ai-draft','review-required']` so they're easy to find and replace.
 *
 * Safe: DRY RUN by default (writes only with `--apply`); backs up ASM00001.questions
 * first; idempotent (skips questionIds already present); caps each quotient's medium
 * at the 260 target so it can never overshoot.
 *
 *   node scripts/seed-t1-medium-topup.js           # dry run
 *   node scripts/seed-t1-medium-topup.js --apply    # write
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Assessment = require('../models/Assessment');
const APPLY = process.argv.includes('--apply');

// medium targets (no SEQ at T1)
const MEDIUM_TARGET = { CRQ: 20, SRQ: 18, LQ: 18, SIQ: 18, PEQ: 22, DAQ: 20 };

// Authored items: correctText + 3 distractors; correct letter spread across A–D.
const ITEMS = [
    // ── CRQ (Cognitive Reasoning) ×4 ──
    { quotient: 'CRQ', correct: 'B', questionText: 'A policy states every report must be reviewed before release. This report has not been reviewed. What follows?', correctText: 'It cannot be released yet.', distractors: ['It can be released now.', 'It was already released.', 'Review is optional here.'] },
    { quotient: 'CRQ', correct: 'C', questionText: 'A project’s cost doubled while its timeline was halved. What is the most reasonable inference about how it was delivered?', correctText: 'More resources were applied to compress the schedule.', distractors: ['Fewer resources were used.', 'The scope was quietly reduced.', 'Nothing about resourcing changed.'] },
    { quotient: 'CRQ', correct: 'A', questionText: 'Sales rose each month for a year, then dropped sharply in one month. What is the best FIRST step to understand the drop?', correctText: 'Compare that month against the recent trend and the same period last year for anomalies.', distractors: ['Assume the decline is permanent.', 'Immediately cut the budget.', 'Ignore it as random noise.'] },
    { quotient: 'CRQ', correct: 'D', questionText: 'Four tasks all depend on one shared input, and that input is delayed. What is the most logical consequence?', correctText: 'All four tasks are at risk of delay.', distractors: ['Only one task is affected.', 'The shared input is irrelevant.', 'The tasks will finish faster.'] },

    // ── SRQ (Self-Regulation & Drive) ×2 ──
    { quotient: 'SRQ', correct: 'C', questionText: 'You receive harsh but fair feedback minutes before an important meeting. What is the most self-regulated response?', correctText: 'Acknowledge it, stay composed, and focus on the meeting first.', distractors: ['Argue the point immediately.', 'Withdraw and skip the meeting.', 'Ignore the feedback entirely.'] },
    { quotient: 'SRQ', correct: 'A', questionText: 'You have a long, unappealing task due tomorrow and feel unmotivated. Which approach best sustains your drive?', correctText: 'Break it into small steps and start with one step now.', distractors: ['Wait until motivation arrives.', 'Do only easy tasks all day.', 'Request an extension by default.'] },

    // ── LQ (Learning Agility) ×1 ──
    { quotient: 'LQ', correct: 'D', questionText: 'Your team will switch to a new tool you have never used, starting next week. What is the most learning-agile response?', correctText: 'Proactively explore it now and try a small task before launch.', distractors: ['Resist the change until forced.', 'Wait for formal training months later.', 'Delegate all of it to others.'] },

    // ── SIQ (Social Interaction) ×2 ──
    { quotient: 'SIQ', correct: 'B', questionText: 'A normally engaged teammate becomes quiet and withdrawn in meetings. What is the most socially intelligent first step?', correctText: 'Check in with them privately and listen.', distractors: ['Report them to management.', 'Assume they have become lazy.', 'Do nothing and wait it out.'] },
    { quotient: 'SIQ', correct: 'C', questionText: 'Two colleagues disagree sharply during a discussion you are leading. What is the best facilitation move?', correctText: 'Restate each view fairly and steer toward shared goals.', distractors: ['Pick a side quickly to end it.', 'Abruptly end the meeting.', 'Let them argue without structure.'] },

    // ── PEQ (Professional Execution) ×7 ──
    { quotient: 'PEQ', correct: 'A', questionText: 'You realize you will miss a deadline you committed to. What is the most professional action?', correctText: 'Inform stakeholders early and propose a revised plan.', distractors: ['Say nothing and hope it works out.', 'Blame others for the delay.', 'Deliver incomplete work without comment.'] },
    { quotient: 'PEQ', correct: 'D', questionText: 'Just before submitting a deliverable, what is the most reliable quality step?', correctText: 'Review it against the requirements or checklist.', distractors: ['Send it immediately to save time.', 'Ask someone else to own the outcome.', 'Skip checks to meet the clock.'] },
    { quotient: 'PEQ', correct: 'B', questionText: 'You are handed an ambiguous task with unclear scope. What is the most professional first step?', correctText: 'Clarify the scope and success criteria before starting.', distractors: ['Guess the intent and proceed.', 'Refuse the task outright.', 'Wait indefinitely for details.'] },
    { quotient: 'PEQ', correct: 'C', questionText: 'A recurring manual step causes errors almost every week. Professional execution favors which response?', correctText: 'Standardize or automate the step to reduce errors.', distractors: ['Keep repeating it exactly as-is.', 'Ignore the errors as minor.', 'Blame the tool and move on.'] },
    { quotient: 'PEQ', correct: 'A', questionText: 'You finish your assigned work well ahead of time. What is the most accountable next action?', correctText: 'Verify quality, then help others or advance the next priority.', distractors: ['Conceal the spare capacity.', 'Leave early without telling anyone.', 'Start unrelated personal tasks.'] },
    { quotient: 'PEQ', correct: 'D', questionText: 'A stakeholder requests a change that puts the deadline at risk. What is the most professional response?', correctText: 'Explain the trade-off and agree on priorities together.', distractors: ['Silently absorb all the extra work.', 'Refuse the request outright.', 'Ignore the request and continue.'] },
    { quotient: 'PEQ', correct: 'B', questionText: 'Good handover documentation for your task should primarily ensure that:', correctText: 'Another competent person can continue it without you.', distractors: ['Only you are able to run it.', 'It looks as impressive as possible.', 'It is as long as it can be.'] },

    // ── DAQ (Digital & AI Literacy) ×4 ──
    { quotient: 'DAQ', correct: 'C', questionText: 'An AI assistant confidently gives you an answer you plan to use in a client report. What is the most digitally literate step?', correctText: 'Verify the key facts against a reliable source before using them.', distractors: ['Trust the answer completely.', 'Never use AI for anything.', 'Publish it without any checks.'] },
    { quotient: 'DAQ', correct: 'A', questionText: 'You get an unexpected email urging you to log in via a provided link to “verify” your account. What is the safest action?', correctText: 'Avoid the link, go to the site directly, and report the email.', distractors: ['Click the link and log in.', 'Forward it to colleagues to check.', 'Reply with your credentials.'] },
    { quotient: 'DAQ', correct: 'D', questionText: 'A dataset has many blank and inconsistent entries. Before running analysis, what is the best first step?', correctText: 'Clean and validate the data.', distractors: ['Ignore data quality issues.', 'Delete the column blindly.', 'Assume the data is already correct.'] },
    { quotient: 'DAQ', correct: 'B', questionText: 'When sharing a file that contains customer personal data, what reflects good data practice?', correctText: 'Restrict access to those who need it and follow privacy rules.', distractors: ['Share it publicly for convenience.', 'Email it to the whole company.', 'Post it in an open channel.'] }
];

const LETTERS = ['A', 'B', 'C', 'D'];
function buildOptions(item) {
    // place correctText at item.correct; fill the rest with distractors in order
    const rest = [...item.distractors];
    return LETTERS.map(L => ({ value: L, label: L === item.correct ? item.correctText : rest.shift() }));
}

function normDiff(l) { l = String(l || '').toLowerCase(); if (l === 'l1' || l === 'easy') return 'easy'; if (l === 'l3' || l === 'hard') return 'hard'; return 'medium'; }

(async () => {
    if (!process.env.MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected. Mode: ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

    const t1 = await Assessment.findOne({ assessmentCode: 'ASM00001' });
    if (!t1) { console.error('❌ ASM00001 not found'); process.exit(1); }

    // current medium counts per quotient
    const med = { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0 };
    const existingIds = new Set();
    for (const q of (t1.questions || [])) {
        existingIds.add(q.questionId);
        const quo = String(q.quotient || '').toUpperCase();
        if (med[quo] !== undefined && normDiff(q.difficultyLevel) === 'medium') med[quo]++;
    }

    // group authored items by quotient, number them, cap at target
    const perQ = {};
    const toAdd = [];
    let skipped = 0;
    for (const item of ITEMS) {
        const quo = item.quotient;
        perQ[quo] = (perQ[quo] || 0) + 1;
        const questionId = `T1-TOPUP-${quo}-M-${String(perQ[quo]).padStart(2, '0')}`;
        if (existingIds.has(questionId)) { skipped++; continue; }        // idempotent
        if (med[quo] + toAdd.filter(a => a.quotient === quo).length >= MEDIUM_TARGET[quo]) { continue; } // cap
        toAdd.push({
            questionId, questionText: item.questionText, type: 'mcq',
            options: buildOptions(item), correctAnswer: item.correct,
            quotient: quo, difficultyLevel: 'L2', points: 1,
            explanation: 'Baseline readiness item (AI-drafted; pending review).',
            tags: ['ai-draft', 'review-required'], order: 0
        });
    }

    console.log('Current medium → target (gap filled by this run):');
    for (const q of Object.keys(MEDIUM_TARGET)) {
        const add = toAdd.filter(a => a.quotient === q).length;
        console.log(`  ${q.padEnd(4)} have ${String(med[q]).padStart(2)} + ${add} → ${med[q] + add} / target ${MEDIUM_TARGET[q]}`);
    }
    console.log(`\nItems to add: ${toAdd.length}${skipped ? `  (skipped ${skipped} already present)` : ''}`);
    console.log(`Projected T1 pool: ${t1.questions.length} → ${t1.questions.length + toAdd.length}`);

    if (!APPLY) { console.log('\nℹ️  DRY RUN — re-run with --apply to write.'); await mongoose.disconnect(); process.exit(0); }
    if (toAdd.length === 0) { console.log('\n✅ Nothing to add (already at target).'); await mongoose.disconnect(); process.exit(0); }

    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `ASM00001-questions-${stamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(t1.questions, null, 2));
    console.log(`\n💾 Backup: ${backupPath}`);

    toAdd.forEach(a => t1.questions.push(a));
    t1.questions.forEach((q, i) => { q.order = i; });
    t1.totalQuestions = t1.questions.length;
    await t1.save();
    console.log(`✅ ASM00001 updated → ${t1.questions.length} questions (+${toAdd.length} medium, tagged ai-draft/review-required).`);

    await mongoose.disconnect();
    console.log('\n✅ Done. Re-run scripts/audit-item-bank.js to confirm 260.');
    process.exit(0);
})().catch(err => { console.error('❌ Failed:', err.message); process.exit(1); });
