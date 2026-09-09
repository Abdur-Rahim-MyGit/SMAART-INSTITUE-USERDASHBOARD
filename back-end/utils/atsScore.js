/**
 * Deterministic ATS-readiness score (0–100) for a Resume document.
 *
 * Section weights add up to 100. The score rewards completeness and the
 * fields recruiters' parsers actually key on (contact, dated education,
 * quantified experience, skills with structure) — not prose quality.
 */
const has = (v) => typeof v === 'string' && v.trim().length > 0;
const filled = (arr, ...keys) => (Array.isArray(arr) ? arr.filter((x) => x && keys.some((k) => has(x[k]))) : []);
const listLen = (csv) => (has(csv) ? csv.split(',').map((s) => s.trim()).filter(Boolean).length : 0);
const clamp = (n, max) => Math.max(0, Math.min(max, n));

function computeAtsScore(resume) {
  const r = resume && typeof resume.toObject === 'function' ? resume.toObject() : resume || {};
  const p = r.personalInfo || {};
  const s = r.skills || {};
  let score = 0;

  // Contact & identity — 15
  score += has(p.fullName) ? 4 : 0;
  score += has(p.email) ? 4 : 0;
  score += has(p.mobile) ? 3 : 0;
  score += has(p.linkedinUrl) || has(p.githubUrl) || has(p.portfolioUrl) ? 2 : 0;
  score += has(p.location) ? 2 : 0;

  // Target role + summary — 10
  score += has(p.targetRole) ? 4 : 0;
  const summaryWords = has(r.summary) ? r.summary.trim().split(/\s+/).length : 0;
  score += summaryWords >= 30 ? 6 : summaryWords >= 12 ? 4 : summaryWords > 0 ? 2 : 0;

  // Education — 15
  const edu = filled(r.education, 'degree', 'institution');
  if (edu.length) {
    score += 6;
    const first = edu[0];
    score += has(first.year) ? 3 : 0;
    score += has(first.grade) ? 3 : 0;
    score += has(first.specialisation) || has(first.board) ? 3 : 0;
  }

  // Experience / internships — 15
  const exp = filled(r.experience, 'role', 'company');
  if (exp.length) {
    score += 6;
    score += exp.some((e) => has(e.duration)) ? 3 : 0;
    score += exp.some((e) => has(e.description) && e.description.trim().split(/\s+/).length >= 15) ? 4 : 0;
    score += exp.some((e) => has(e.type)) ? 2 : 0;
  }

  // Projects — 15
  const projects = filled(r.projects, 'title');
  if (projects.length) {
    score += clamp(projects.length * 3, 6);
    score += projects.some((x) => has(x.techStack)) ? 4 : 0;
    score += projects.some((x) => has(x.outcome)) ? 3 : 0;
    score += projects.some((x) => has(x.link)) ? 2 : 0;
  }

  // Skills — 15
  const skillCount = listLen(s.technical) + listLen(s.domain) + listLen(s.ai);
  score += skillCount >= 8 ? 8 : skillCount >= 4 ? 5 : skillCount > 0 ? 3 : 0;
  score += has(s.soft) ? 2 : 0;
  score += has(s.languages) ? 2 : 0;
  const levels = Array.isArray(s.levels) ? s.levels.filter((l) => l && has(l.name) && has(l.level)) : [];
  score += levels.length >= 3 ? 3 : levels.length > 0 ? 1 : 0;

  // Certifications — 8
  const certs = filled(r.certifications, 'name');
  if (certs.length) {
    score += clamp(certs.length * 2, 5);
    score += certs.some((c) => has(c.issuer)) ? 2 : 0;
    score += certs.some((c) => has(c.link) || has(c.credentialId)) ? 1 : 0;
  }

  // Achievements — 7
  const ach = filled(r.achievements, 'title');
  score += ach.length ? clamp(3 + ach.length * 2, 7) : 0;

  return clamp(Math.round(score), 100);
}

module.exports = { computeAtsScore };
