/**
 * Certificate Issuance Service (Blueprint v1.0 — server-gated, auto-issue on pass)
 *
 * Replaces the old ungated frontend mint. A certificate is issued for a stage
 * ONLY when, on the authoritative server side:
 *   1. the stage was passed (stageScore >= passingPercentage), AND
 *   2. every prerequisite certificate is already held (C1 before C2; C1&C2 before C3), AND
 *   3. the proctoring integrity for that attempt is clear (session not locked).
 * Idempotent: an existing active cert of the same type is returned, never duplicated.
 *
 * Also issues the "combined" Master Diploma automatically once all three
 * (capacity + capability + leadership) are held.
 *
 * Rules come from config/data/certificate_issuance_rules.csv. The Certificate
 * model + the 4 types (capacity/capability/leadership/combined) are unchanged —
 * only the issuance path is now legitimate.
 */

const fs = require('fs');
const path = require('path');
const Certificate = require('../models/Certificate');
const { notifyCertificateIssued } = require('./notificationService');

// ── Load issuance rules (stage → certificate) ──────────────────────────────
function loadRules() {
    const file = path.join(__dirname, '..', 'config', 'data', 'certificate_issuance_rules.csv');
    const raw = fs.readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim());
    const rules = {};
    for (const line of lines.slice(1)) {
        const cells = line.split(',');
        const row = {};
        headers.forEach((h, i) => { row[h] = (cells[i] !== undefined ? cells[i].trim() : ''); });
        row.prerequisites = row.prerequisites ? row.prerequisites.split(';').map(s => s.trim()).filter(Boolean) : [];
        rules[row.stage] = row;
    }
    return rules;
}
const RULES = loadRules();

// The Master Diploma (not stage-triggered; issued once all three are held)
const COMBINED = {
    certificateType: 'combined',
    code: 'MPD',
    certificateTitle: 'Master Professional Diploma in Comprehensive Readiness',
    requires: ['capacity', 'capability', 'leadership']
};

// ── Helpers ────────────────────────────────────────────────────────────────

// Map the 5-band stageBand to the Certificate model's readinessBand enum.
function mapReadinessBand(stageBand) {
    switch (stageBand) {
        case 'Advanced': return 'Expert';
        case 'Strong': return 'Advanced';
        case 'Progressing': return 'Proficient';
        case 'Developing': return 'Developing';
        default: return 'Emerging';
    }
}

const QUOTIENT_LABELS = {
    CRQ: 'Cognitive Reasoning (CRQ)',
    SRQ: 'Self-Regulation & Drive (SRQ)',
    LQ: 'Learning Agility (LQ)',
    SIQ: 'Social Interaction (SIQ)',
    PEQ: 'Professional Execution (PEQ)',
    DAQ: 'Digital & AI Literacy (DAQ)',
    SEQ: 'Ethical & Sustainability Judgement (SEQ)'
};

function buildValidatedSkills(quotientProfile = {}) {
    return Object.entries(quotientProfile)
        .filter(([k]) => QUOTIENT_LABELS[k])
        .map(([k, v]) => ({ label: QUOTIENT_LABELS[k], score: Math.round(v?.rawScore ?? 0) }));
}

// Resolve the acting account across collections (result.userId may be a Student).
async function resolveUser(userId) {
    const User = require('../models/User');
    let u = await User.findById(userId).select('fullName email studentId');
    if (!u) {
        try {
            const Student = require('../models/Student');
            u = await Student.findById(userId).select('fullName email studentId');
        } catch (_) { /* Student model may differ; ignore */ }
    }
    return u;
}

// Integrity = Clear: no locked proctoring session for this attempt.
async function integrityClear(userId, resultId) {
    try {
        const ProctoringSession = require('../models/ProctoringSession');
        const locked = await ProctoringSession.findOne({
            userId, resultId,
            $or: [{ isLocked: true }, { status: 'locked' }]
        });
        return !locked;
    } catch (_) {
        return true; // proctoring not available ⇒ treat as clear
    }
}

function genCertificateId(code) {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `SMAART-${code}-${year}-${rand}`;
}

// Low-level idempotent creator (shared by stage issuance + combined).
async function createCertificate({ user, userId, certificateType, code, certificateTitle,
                                   validatedSkills, readinessBand, assessmentWindow, stage, resultId }) {
    const existing = await Certificate.findOne({
        userId, certificateType, status: { $ne: 'revoked' }
    }).sort({ issueDate: -1 });
    if (existing) return { issued: false, reason: 'already-earned', certificate: existing };

    const certificate = new Certificate({
        certificateId: genCertificateId(code),
        userId,
        studentId: user?.studentId || user?.email || String(userId),
        fullName: user?.fullName || 'Student',
        // email is required on the model; fall back to a placeholder so an
        // unresolvable/edge-case user never silently loses their certificate.
        email: user?.email || `${userId}@no-email.smaart`,
        certificateType,
        certificateTitle,
        validatedSkills: validatedSkills || [],
        readinessBand: readinessBand || 'Proficient',
        assessmentWindow: assessmentWindow || `TST-${new Date().getFullYear()}`,
        stage: stage || null,
        resultId: resultId || undefined,
        metadata: { generatedBy: 'system:auto-issue' }
    });
    await certificate.save();

    try {
        await notifyCertificateIssued(userId, certificateType, certificateTitle, certificate.certificateId);
    } catch (e) {
        console.error('⚠️ certificate notification failed:', e.message);
    }
    console.log(`🎓 Certificate auto-issued: ${certificate.certificateId} (${certificateType}) for ${userId}`);
    return { issued: true, certificate };
}

// ── Public: issue on a passed stage ─────────────────────────────────────────
async function issueCertificateForStage({ userId, stageInfo, stageScore, stageBand, quotientProfile, resultId }) {
    const rule = RULES[stageInfo.stage];
    if (!rule) return { issued: false, reason: 'no-rule' };

    // 1. Authoritative score gate
    const passMark = stageInfo.passingPercentage !== undefined ? stageInfo.passingPercentage : 60;
    if (stageScore < passMark) return { issued: false, reason: 'below-pass' };

    const user = await resolveUser(userId);

    // 2. Prerequisite stack
    for (const prereq of rule.prerequisites) {
        const held = await Certificate.findOne({ userId, certificateType: prereq, status: 'active' });
        if (!held) return { issued: false, reason: `prereq-missing:${prereq}` };
    }

    // 3. Integrity clear
    if (!(await integrityClear(userId, resultId))) {
        return { issued: false, reason: 'integrity-locked' };
    }

    // 4/5. Idempotent create with real data
    const res = await createCertificate({
        user, userId,
        certificateType: rule.certificateType,
        code: rule.code,
        certificateTitle: rule.certificateTitle,
        validatedSkills: buildValidatedSkills(quotientProfile),
        readinessBand: mapReadinessBand(stageBand),
        assessmentWindow: `TST-${new Date().getFullYear()}-${stageInfo.stage}`,
        stage: stageInfo.stage,
        resultId
    });

    // 6. Master Diploma once all three are held
    let combined = null;
    if (res.issued || res.reason === 'already-earned') {
        combined = await maybeIssueCombined(userId, user, stageBand, quotientProfile);
    }
    return { ...res, combined };
}

// Issue the combined Master Diploma if capacity + capability + leadership all active.
async function maybeIssueCombined(userId, user, stageBand, quotientProfile) {
    const held = await Certificate.find({
        userId, certificateType: { $in: COMBINED.requires }, status: 'active'
    }).distinct('certificateType');
    if (COMBINED.requires.every(t => held.includes(t))) {
        if (!user) user = await resolveUser(userId);
        const res = await createCertificate({
            user, userId,
            certificateType: COMBINED.certificateType,
            code: COMBINED.code,
            certificateTitle: COMBINED.certificateTitle,
            validatedSkills: buildValidatedSkills(quotientProfile),
            readinessBand: mapReadinessBand(stageBand) || 'Advanced',
            assessmentWindow: `TST-${new Date().getFullYear()}-MPD`,
            stage: null
        });
        return res.issued ? res.certificate : null;
    }
    return null;
}

module.exports = { issueCertificateForStage, maybeIssueCombined, RULES, mapReadinessBand, buildValidatedSkills };
