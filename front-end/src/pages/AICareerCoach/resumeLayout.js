/**
 * Resume layout contract for the builder and templates.
 * Mirror of back-end/utils/resumeLayout.js — keep SECTION_KEYS in sync.
 */
export const SECTION_KEYS = [
  'summary',
  'education',
  'internships',
  'experience',
  'projects',
  'skills',
  'certifications',
  'positions',
  'publications',
  'awards',
];

export const SECTION_LABELS = {
  summary: 'Summary / Objective',
  education: 'Education',
  internships: 'Internships',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  positions: 'Positions & Activities',
  publications: 'Publications & Patents',
  awards: 'Awards & Achievements',
};

export const FONT_SIZES = [9, 10, 11, 12];
export const SPACINGS = [
  { id: 'compact', label: 'Compact' },
  { id: 'normal', label: 'Normal' },
  { id: 'relaxed', label: 'Relaxed' },
];

export const DEFAULT_LAYOUT = Object.freeze({
  fontSize: 10,
  spacing: 'normal',
  sectionOrder: [...SECTION_KEYS],
  hiddenSections: [],
  sectionSpacing: {},
});

/** Returns a complete, valid layout; unknown keys dropped, missing ones filled. */
export const normalizeLayout = (input) => {
  const l = input && typeof input === 'object' ? input : {};
  const fontSize = FONT_SIZES.includes(Number(l.fontSize)) ? Number(l.fontSize) : DEFAULT_LAYOUT.fontSize;
  const spacing = SPACINGS.some((s) => s.id === l.spacing) ? l.spacing : DEFAULT_LAYOUT.spacing;
  const seen = new Set();
  const sectionOrder = (Array.isArray(l.sectionOrder) ? l.sectionOrder : [])
    .filter((k) => SECTION_KEYS.includes(k) && !seen.has(k) && seen.add(k));
  SECTION_KEYS.forEach((k) => { if (!seen.has(k)) sectionOrder.push(k); });
  const hiddenSections = (Array.isArray(l.hiddenSections) ? l.hiddenSections : []).filter((k) => SECTION_KEYS.includes(k));
  const sectionSpacing = {};
  const src = l.sectionSpacing && typeof l.sectionSpacing === 'object' ? l.sectionSpacing : {};
  SECTION_KEYS.forEach((k) => {
    const n = Number(src instanceof Map ? src.get(k) : src[k]);
    if (Number.isInteger(n) && n > 0) sectionSpacing[k] = Math.min(n, 3);
  });
  return { fontSize, spacing, sectionOrder, hiddenSections, sectionSpacing };
};

export const isDefaultLayout = (layout) => {
  const l = normalizeLayout(layout);
  return (
    l.fontSize === DEFAULT_LAYOUT.fontSize &&
    l.spacing === DEFAULT_LAYOUT.spacing &&
    l.hiddenSections.length === 0 &&
    Object.keys(l.sectionSpacing).length === 0 &&
    l.sectionOrder.every((k, i) => k === SECTION_KEYS[i])
  );
};

/** Which sections actually have content, so the panel can grey out empty ones. */
export const sectionHasContent = (key, resumeData) => {
  const r = resumeData || {};
  const filled = (arr, ...fields) => Array.isArray(arr) && arr.some((x) => x && fields.some((f) => String(x[f] || '').trim()));
  switch (key) {
    case 'summary': return !!String((r.summaryMode === 'objective' ? r.objective : r.summary) || '').trim();
    case 'education': return filled(r.education, 'degree', 'institution');
    case 'internships': return Array.isArray(r.experience) && r.experience.some((e) => e && e.type === 'internship' && (e.role || e.company));
    case 'experience': return Array.isArray(r.experience) && r.experience.some((e) => e && e.type !== 'internship' && (e.role || e.company));
    case 'projects': return filled(r.projects, 'title');
    case 'skills': return ['technical', 'domain', 'ai', 'soft', 'languages'].some((k) => String(r.skills?.[k] || '').trim());
    case 'certifications': return filled(r.certifications, 'name');
    case 'positions': return filled(r.positions, 'title');
    case 'publications': return filled(r.publications, 'title');
    case 'awards': return filled(r.achievements, 'title');
    default: return false;
  }
};
