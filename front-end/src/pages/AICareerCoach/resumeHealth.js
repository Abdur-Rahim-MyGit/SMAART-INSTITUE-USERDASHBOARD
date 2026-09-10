/**
 * Rule-based resume health checks shown on the Review step.
 * Each check: { id, level: 'error' | 'warn' | 'info', message, step }
 * where `step` is the builder step id that fixes it.
 */
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const csvCount = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean).length;
const badLink = (u) => { const v = String(u || '').trim(); return v && !/^https?:\/\//i.test(v); };
const WEAK_OPENERS = /^(responsible for|worked on|helped|involved in|was part of|did)\b/i;

export const computeHealthChecks = (r = {}, pageCount = 1) => {
  const out = [];
  const p = r.personalInfo || {};
  const push = (id, level, message, step) => out.push({ id, level, message, step });

  if (!String(p.mobile || '').trim()) push('mobile', 'error', 'Mobile number is missing.', 'personal');
  if (!String(p.email || '').trim()) push('email', 'error', 'Email address is missing.', 'personal');
  if (!String(p.targetRole || '').trim()) push('role', 'warn', 'Add a target role so the resume reads as focused.', 'personal');
  if (!String(p.linkedinUrl || '').trim() && !String(p.githubUrl || '').trim()) push('links', 'info', 'Add a LinkedIn or GitHub link.', 'personal');
  [p.linkedinUrl, p.githubUrl, p.portfolioUrl].forEach((u, i) => {
    if (badLink(u)) push(`link-${i}`, 'warn', `Link "${u}" should start with https://`, 'personal');
  });

  const summaryText = r.summaryMode === 'objective' ? r.objective : r.summary;
  const sw = words(summaryText);
  if (sw === 0) push('summary', 'warn', r.summaryMode === 'objective' ? 'Career objective is empty.' : 'Professional summary is empty.', 'personal');
  else if (sw < 25) push('summary-short', 'info', 'Summary is short. Aim for 30 to 60 words.', 'personal');
  else if (sw > 90) push('summary-long', 'info', 'Summary is long. Keep it under 90 words.', 'personal');

  const edu = (r.education || []).filter((e) => e && (e.degree || e.institution));
  if (edu.length === 0) push('education', 'error', 'Add at least one education entry.', 'education');
  edu.forEach((e, i) => {
    if (!String(e.year || '').trim()) push(`edu-year-${i}`, 'warn', `Education "${e.degree || e.institution}" has no year.`, 'education');
    if (!String(e.grade || '').trim()) push(`edu-grade-${i}`, 'info', `Education "${e.degree || e.institution}" has no grade or CGPA.`, 'education');
  });

  const exp = (r.experience || []).filter((e) => e && (e.role || e.company));
  exp.forEach((e, i) => {
    const label = e.role || e.company;
    if (!String(e.duration || '').trim()) push(`exp-dur-${i}`, 'warn', `"${label}" has no duration.`, 'experience');
    if (words(e.description) < 15) push(`exp-desc-${i}`, 'warn', `"${label}" needs a fuller description (2 to 3 bullet points).`, 'experience');
    else if (!/\d/.test(e.description || '')) push(`exp-num-${i}`, 'info', `Add a number to "${label}" (users, %, time saved).`, 'experience');
    String(e.description || '').split('\n').forEach((line) => {
      if (WEAK_OPENERS.test(line.trim())) push(`exp-weak-${i}`, 'info', `In "${label}", start bullets with an action verb (Built, Led, Reduced).`, 'experience');
    });
  });

  const projects = (r.projects || []).filter((x) => x && x.title);
  if (projects.length === 0) push('projects', 'warn', 'Add at least one project. Freshers are judged on projects.', 'projects');
  projects.forEach((x, i) => {
    if (!String(x.techStack || '').trim()) push(`proj-tech-${i}`, 'warn', `Project "${x.title}" has no tech stack.`, 'projects');
    if (!String(x.outcome || '').trim()) push(`proj-outcome-${i}`, 'info', `Project "${x.title}" has no outcome or impact line.`, 'projects');
    if (badLink(x.link)) push(`proj-link-${i}`, 'warn', `Project "${x.title}" link should start with https://`, 'projects');
  });

  const skillCount = csvCount(r.skills?.technical) + csvCount(r.skills?.domain) + csvCount(r.skills?.ai);
  if (skillCount === 0) push('skills', 'error', 'No skills listed.', 'skills');
  else if (skillCount < 5) push('skills-few', 'warn', `Only ${skillCount} skills listed. Aim for 6 to 12.`, 'skills');

  if (!(r.certifications || []).some((c) => c && c.name)) push('certs', 'info', 'No certifications. Even one course certificate helps.', 'certifications');
  (r.certifications || []).forEach((c, i) => {
    if (c && badLink(c.link)) push(`cert-link-${i}`, 'warn', `Certification "${c.name}" link should start with https://`, 'certifications');
  });

  if (pageCount > 2) push('pages', 'error', `Resume runs to ${pageCount} pages. Recruiters expect one, at most two.`, 'preview');
  else if (pageCount === 2) push('pages', 'warn', 'Resume spills to a second page. Try Compact spacing or a smaller font.', 'preview');

  // De-duplicate repeated per-entry ids (e.g. several weak bullets in one entry).
  const seen = new Set();
  const unique = out.filter((c) => (seen.has(c.id) ? false : seen.add(c.id)));
  const rank = { error: 0, warn: 1, info: 2 };
  unique.sort((a, b) => rank[a.level] - rank[b.level]);
  return unique;
};

export const healthScore = (checks) => {
  const penalty = checks.reduce((n, c) => n + (c.level === 'error' ? 15 : c.level === 'warn' ? 6 : 2), 0);
  return Math.max(0, 100 - penalty);
};
