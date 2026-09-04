/**
 * Career direction -> icon key.
 *
 * The dashboard shows a student's primary/secondary/tertiary career directions.
 * Those names are free text produced by the career engine (61 distinct values
 * appear in the current records, spanning tech, finance, marketing, legal,
 * aviation, maritime, HR and more), so this matches on keywords rather than an
 * exhaustive list -- a direction we have never seen still lands somewhere sane.
 *
 * RULES ARE ORDERED: the first match wins, so the most specific patterns must
 * come first. "E-Commerce Marketing & Growth" has to hit commerce before the
 * generic marketing rule, and "AI in Business Analytics" has to hit AI before
 * analytics.
 *
 * Keys map to components in CAREER_ICON_MAP (see @/components/icons/career).
 */

const RULES = [
  // --- narrow domains first ----------------------------------------------
  ["Social", /social media|community manage|influencer/],
  ["Commerce", /e-?commerce|marketplace|omnichannel|retail/],

  // Product before AI: "UX Research & Human-AI Interaction" is a design role.
  ["Product", /product manage|\bux\b|\bui\b|user experience|interaction design|\bdesign\b|creative/],

  // Security before AI: "Cybersecurity & AI Security" is a security role.
  // Note: no bare "compliance" here -- tax/legal compliance is handled below.
  ["Security", /security|cyber|privacy|data protection|\baml\b|fraud|penetration test/],

  ["AI", /\bai\b|artificial intelligence|machine learning|\bml\b|deep learning|computer vision|robotic|autonomous|automation/],
  ["Cloud", /cloud|devops|infrastructure|\bnetwork/],
  ["ITSupport", /\bit support\b|systems admin|help ?desk|technical support|\b5g\b|telecom/],
  ["Testing", /quality assurance|\bqa\b|\btesting\b|\bsdet\b/],
  ["Code", /software|developer|programming|\.net|full ?stack|front ?end|back ?end|\bweb\b|\bmobile\b|application development/],

  // --- money before data: "API Banking Analyst" is a finance role ---------
  ["Finance", /financ|accounting|accountant|book-?keeping|banking|credit|investment|equity|audit|treasury|fintech|\btax|\bgst\b|payroll|insurance/],

  ["Data", /data scien|data analy|statistic|business intelligence|\bbi\b|data engineer|big data/],

  // Operations before Analytics so "Operations & MIS" reads as operations.
  ["Operations", /supply chain|logistic|procurement|warehouse|operation|process improve|\bmis\b/],
  ["Analytics", /analytics|analysis|analyst|insight|reporting/],

  // --- commercial ---------------------------------------------------------
  ["Sales", /sales|business development|account manage|client relation|partnership/],
  ["Advertising", /performance marketing|paid advertising|\bseo\b|\bsem\b|digital marketing|growth market|advertis/],
  ["Marketing", /public relations|\bpr\b|brand|communication|\bevent|marketing|campaign/],

  // --- people & professions ----------------------------------------------
  ["People", /human resource|\bhr\b|recruit|talent|people ops|administration/],
  ["Legal", /legal|\blaw\b|judge|advocate|litigation|paralegal|compliance/],
  ["Aviation", /pilot|aviation|aircraft|cabin crew|aerospace/],
  // \bship\b, not `ship` -- otherwise it matches "entrepreneurSHIP".
  ["Maritime", /\bship\b|maritime|\bmarine\b|nautical|\bcaptain\b|merchant navy/],
  ["Health", /health|medical|clinic|nurse|pharma|biomed|hospital/],
  ["Education", /edtech|teach|training|academic|professor|lecturer|education|research/],
  ["Media", /journalis|content writ|editor|copywrit|media production|broadcast/],
  ["Manufacturing", /mechanical|civil|electrical|electronic|production|manufactur|chemical|instrumentation|automobile|textile|mining|structural|maintenance/],
  ["Entrepreneur", /entrepreneur|startup|founder|self-?employ|business owner/],
  ["Consulting", /consult|advisory|strategy|management trainee/],
];

/** Fallback when nothing matches -- a neutral "career" mark, not a book. */
export const DEFAULT_CAREER_ICON = "Career";

/**
 * @param {string} name career direction name, e.g. "Digital Sales & Business Development"
 * @returns {string} an icon key present in CAREER_ICON_MAP
 */
export function getCareerIconKey(name = "") {
  const n = String(name || "").toLowerCase().trim();
  if (!n) return DEFAULT_CAREER_ICON;
  for (const [key, pattern] of RULES) {
    if (pattern.test(n)) return key;
  }
  return DEFAULT_CAREER_ICON;
}

export default getCareerIconKey;
