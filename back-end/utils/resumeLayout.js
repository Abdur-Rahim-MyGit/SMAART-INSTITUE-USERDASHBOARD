/**
 * Resume layout contract shared by the model, the server PDF and (mirrored
 * in) the web builder. Keep SECTION_KEYS in sync with
 * front-end/src/pages/AICareerCoach/resumeLayout.js.
 */
const SECTION_KEYS = [
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

const FONT_SIZES = [9, 10, 11, 12];
const SPACINGS = ['compact', 'normal', 'relaxed'];

const DEFAULT_LAYOUT = {
  fontSize: 10,
  spacing: 'normal',
  sectionOrder: [...SECTION_KEYS],
  hiddenSections: [],
  sectionSpacing: {},
};

/** Returns a complete, valid layout; unknown keys are dropped, missing ones filled. */
function normalizeLayout(input) {
  const l = input && typeof input === 'object' ? input : {};
  const fontSize = FONT_SIZES.includes(Number(l.fontSize)) ? Number(l.fontSize) : DEFAULT_LAYOUT.fontSize;
  const spacing = SPACINGS.includes(l.spacing) ? l.spacing : DEFAULT_LAYOUT.spacing;
  const seen = new Set();
  const order = (Array.isArray(l.sectionOrder) ? l.sectionOrder : [])
    .filter((k) => SECTION_KEYS.includes(k) && !seen.has(k) && seen.add(k));
  SECTION_KEYS.forEach((k) => { if (!seen.has(k)) order.push(k); });
  const hiddenSections = (Array.isArray(l.hiddenSections) ? l.hiddenSections : []).filter((k) => SECTION_KEYS.includes(k));
  const sectionSpacing = {};
  const src = l.sectionSpacing && typeof l.sectionSpacing === 'object' ? l.sectionSpacing : {};
  const read = (k) => (src instanceof Map ? src.get(k) : src[k]);
  SECTION_KEYS.forEach((k) => {
    const n = Number(read(k));
    if (Number.isInteger(n) && n > 0) sectionSpacing[k] = Math.min(n, 3);
  });
  return { fontSize, spacing, sectionOrder: order, hiddenSections, sectionSpacing };
}

module.exports = { SECTION_KEYS, FONT_SIZES, SPACINGS, DEFAULT_LAYOUT, normalizeLayout };
