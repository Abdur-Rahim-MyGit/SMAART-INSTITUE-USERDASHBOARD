/**
 * Word of the Day — a shared everyday word for everyone, revealing a
 * technical term matched to the viewer's locked career path when flipped.
 *
 * DOMAINS: a small, curated set of broad career buckets. A student's locked
 * primary role (from /career-agent/final-pathway) is classified into one of
 * these by keyword match — see classifyDomain(). "general" is the fallback
 * for anyone with no locked path yet, or a role that matches nothing.
 *
 * WORDS: each entry is the shared plain word/definition plus one technical
 * term + one-line definition per domain. Every word maps to every domain on
 * purpose, so the reveal always feels earned rather than forced.
 */

export const DOMAINS = {
  software: { label: 'Software & Web Development', keywords: ['software developer', 'software engineer', 'web developer', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'fullstack', 'mobile developer', 'app developer', 'programmer', 'sde', 'game developer'] },
  data: { label: 'Data Science & AI', keywords: ['data scientist', 'data analyst', 'data engineer', 'machine learning', 'ml engineer', 'artificial intelligence', 'ai researcher', 'ai engineer', 'ai', 'nlp', 'deep learning', 'analytics'] },
  cloud: { label: 'Cloud & DevOps', keywords: ['cloud', 'devops', 'sre', 'site reliability', 'infrastructure', 'platform engineer', 'kubernetes', 'sysadmin', 'system admin', 'network engineer'] },
  security: { label: 'Cybersecurity', keywords: ['security', 'cybersecurity', 'cyber security', 'penetration', 'soc analyst', 'infosec', 'ethical hacker'] },
  design: { label: 'Design & UX', keywords: ['designer', 'ux', 'ui', 'product design', 'graphic design', 'visual design'] },
  marketing: { label: 'Marketing & Growth', keywords: ['marketing', 'growth', 'seo', 'content creator', 'social media', 'brand', 'digital marketing'] },
  business: { label: 'Business, Finance & Analytics', keywords: ['business analyst', 'finance', 'financial', 'accountant', 'accounting', 'investment', 'investment banker', 'consultant', 'consulting', 'operations', 'product manager', 'project manager', 'entrepreneur', 'strategy'] },
  engineering: { label: 'Core Engineering', keywords: ['mechanical engineer', 'civil engineer', 'electrical engineer', 'electronics engineer', 'core engineer', 'manufacturing', 'automobile engineer', 'structural engineer', 'production engineer'] },
  hr: { label: 'HR & People Operations', keywords: ['human resource', 'hr executive', 'hr manager', 'hr generalist', 'recruiter', 'talent acquisition', 'people operations'] },
  general: { label: 'Professional Skills', keywords: [] },
};

// Specific, narrow-keyword domains are checked before the broader software
// bucket so e.g. "Cloud Engineer" or "Data Engineer" land correctly instead
// of matching a generic "engineer"/"developer" pattern first.
const DOMAIN_ORDER = ['data', 'cloud', 'security', 'design', 'marketing', 'engineering', 'hr', 'business', 'software'];

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Word-boundary matching, not plain substring: a naive text.includes(kw)
// let short keywords like "ui" match inside unrelated words -- "Talent
// Acquisition" contains "ui" as a literal substring. \b around each
// (possibly multi-word) keyword confines the match to real word/phrase
// boundaries instead.
const keywordPattern = (kw) => new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');

/** Best-effort classification of a free-text role name into one domain key. */
export const classifyDomain = (roleName) => {
  const text = String(roleName || '').toLowerCase().trim();
  if (!text) return 'general';
  for (const key of DOMAIN_ORDER) {
    if (DOMAINS[key].keywords.some((kw) => keywordPattern(kw).test(text))) return key;
  }
  return 'general';
};

export const WORDS = [
  {
    word: 'Speed', meaning: 'How quickly something gets done.',
    terms: {
      software: { term: 'Latency', def: 'The delay between a request and its response.' },
      data: { term: 'Time Complexity', def: 'How an algorithm’s running time grows with input size.' },
      cloud: { term: 'Throughput', def: 'How much work a system completes per unit of time.' },
      security: { term: 'Detection Time', def: 'How fast a threat is spotted after it starts.' },
      design: { term: 'Time to First Interaction', def: 'How quickly a user can act on a screen.' },
      marketing: { term: 'Conversion Velocity', def: 'How fast leads move from interest to purchase.' },
      business: { term: 'Time to Market', def: 'How quickly a product goes from idea to launch.' },
      engineering: { term: 'Cycle Time', def: 'Time taken to complete one full production cycle.' },
      hr: { term: 'Time to Hire', def: 'Days between a job opening and an accepted offer.' },
      general: { term: 'Turnaround Time', def: 'The time taken to complete a task from start to finish.' },
    },
  },
  {
    word: 'Memory', meaning: 'The ability to store and recall information.',
    terms: {
      software: { term: 'Cache', def: 'A small, fast storage layer that saves recent results for reuse.' },
      data: { term: 'Feature Store', def: 'A shared repository of precomputed data used to train models.' },
      cloud: { term: 'Persistent Storage', def: 'Storage that keeps data even after a server restarts.' },
      security: { term: 'Audit Log', def: 'A stored record of every action taken in a system.' },
      design: { term: 'Design System', def: 'A reusable library of components that keeps a product consistent.' },
      marketing: { term: 'Brand Recall', def: 'How easily customers remember a brand without a prompt.' },
      business: { term: 'Institutional Knowledge', def: 'Know-how a company retains beyond any one employee.' },
      engineering: { term: 'Material Fatigue Record', def: 'Logged data on how a material weakens under repeated stress.' },
      hr: { term: 'Employee Record', def: 'The stored history of an employee’s role, reviews and growth.' },
      general: { term: 'Retention', def: 'How well information or people are kept over time.' },
    },
  },
  {
    word: 'Growth', meaning: 'The process of becoming bigger, better, or stronger.',
    terms: {
      software: { term: 'Scalability', def: 'A system’s ability to handle more load without breaking.' },
      data: { term: 'Model Drift', def: 'How a model’s accuracy changes as real-world data evolves.' },
      cloud: { term: 'Auto-scaling', def: 'Automatically adding or removing servers to match demand.' },
      security: { term: 'Attack Surface', def: 'The total set of points an attacker could target as a system grows.' },
      design: { term: 'Design Scalability', def: 'How well a design system extends to new products and screens.' },
      marketing: { term: 'Customer Acquisition Growth', def: 'The rate at which a business gains new paying customers.' },
      business: { term: 'Compound Annual Growth Rate', def: 'A business’s average yearly growth rate over several years.' },
      engineering: { term: 'Load Capacity', def: 'The maximum stress a structure can bear as demand increases.' },
      hr: { term: 'Career Progression', def: 'The planned path an employee follows to grow within a company.' },
      general: { term: 'Scaling Up', def: 'Expanding capacity or capability to handle more.' },
    },
  },
  {
    word: 'Trust', meaning: 'A firm belief in the reliability of someone or something.',
    terms: {
      software: { term: 'Code Signing', def: 'A cryptographic signature proving software came from a verified source.' },
      data: { term: 'Model Explainability', def: 'How clearly a model’s decisions can be understood by humans.' },
      cloud: { term: 'Zero Trust Architecture', def: 'A security model that verifies every request, inside or outside the network.' },
      security: { term: 'Chain of Trust', def: 'A verified sequence of certificates that proves a system is authentic.' },
      design: { term: 'Trust Signal', def: 'A visual cue, like a badge or review, that reassures a user.' },
      marketing: { term: 'Social Proof', def: 'Evidence like reviews or testimonials that build customer confidence.' },
      business: { term: 'Due Diligence', def: 'A thorough check performed before trusting a deal or partner.' },
      engineering: { term: 'Factor of Safety', def: 'A built-in margin beyond expected load to keep a structure reliable.' },
      hr: { term: 'Psychological Safety', def: 'A workplace where people feel safe to speak up without fear.' },
      general: { term: 'Credibility', def: 'The quality of being trusted and believed.' },
    },
  },
  {
    word: 'Flow', meaning: 'The steady, continuous movement of something.',
    terms: {
      software: { term: 'Data Pipeline', def: 'An automated sequence that moves and transforms data between systems.' },
      data: { term: 'ETL', def: 'Extract, Transform, Load: the flow of raw data into usable form.' },
      cloud: { term: 'CI/CD Pipeline', def: 'The automated flow of code from commit to deployment.' },
      security: { term: 'Traffic Flow Analysis', def: 'Studying network traffic patterns to spot unusual activity.' },
      design: { term: 'User Flow', def: 'The path a user takes through a product to complete a task.' },
      marketing: { term: 'Funnel', def: 'The stages a customer moves through, from awareness to purchase.' },
      business: { term: 'Cash Flow', def: 'The movement of money into and out of a business.' },
      engineering: { term: 'Fluid Dynamics', def: 'The study of how liquids and gases move through systems.' },
      hr: { term: 'Workflow Automation', def: 'Using tools to move routine HR tasks along without manual steps.' },
      general: { term: 'Process', def: 'A series of steps that move work toward a result.' },
    },
  },
  {
    word: 'Structure', meaning: 'The way parts are organized or arranged.',
    terms: {
      software: { term: 'Architecture', def: 'The high-level way a software system’s components are organized.' },
      data: { term: 'Schema', def: 'The defined structure that describes how data is organized in a database.' },
      cloud: { term: 'Infrastructure as Code', def: 'Defining servers and networks in version-controlled configuration files.' },
      security: { term: 'Access Control Hierarchy', def: 'The layered structure that decides who can access what.' },
      design: { term: 'Information Architecture', def: 'How content and navigation are organized so users find things.' },
      marketing: { term: 'Campaign Structure', def: 'How a marketing campaign’s channels and stages are organized.' },
      business: { term: 'Org Chart', def: 'A diagram showing how roles and reporting lines are arranged.' },
      engineering: { term: 'Load-Bearing Structure', def: 'The part of a building that carries and transfers weight safely.' },
      hr: { term: 'Reporting Structure', def: 'The defined lines of authority and communication in a team.' },
      general: { term: 'Framework', def: 'An organized structure that shapes how work gets done.' },
    },
  },
  {
    word: 'Signal', meaning: 'Something that indicates or points to information.',
    terms: {
      software: { term: 'Event', def: 'A notification a system sends when something happens.' },
      data: { term: 'Feature', def: 'A measurable input variable a model uses to make predictions.' },
      cloud: { term: 'Health Check', def: 'A periodic ping a system sends to prove a service is running.' },
      security: { term: 'Indicator of Compromise', def: 'Evidence, like an unusual login, suggesting a system was breached.' },
      design: { term: 'Affordance', def: 'A visual hint that tells a user how something can be used.' },
      marketing: { term: 'Buying Signal', def: 'An action, like a repeat visit, showing a lead is close to purchasing.' },
      business: { term: 'Leading Indicator', def: 'A metric that predicts future performance before it happens.' },
      engineering: { term: 'Sensor Reading', def: 'A measured value a sensor reports about a system’s condition.' },
      hr: { term: 'Attrition Signal', def: 'An early sign, like disengagement, that an employee may leave.' },
      general: { term: 'Indicator', def: 'A sign that points to a fact or trend.' },
    },
  },
  {
    word: 'Balance', meaning: 'A state where things are even or stable.',
    terms: {
      software: { term: 'Load Balancer', def: 'A component that spreads traffic evenly across multiple servers.' },
      data: { term: 'Class Balance', def: 'Having roughly equal examples of each category so a model learns fairly.' },
      cloud: { term: 'Resource Allocation', def: 'Distributing compute power evenly across workloads.' },
      security: { term: 'Risk-Usability Balance', def: 'Weighing strong protection against a system staying easy to use.' },
      design: { term: 'Visual Balance', def: 'Arranging elements so a layout feels evenly weighted.' },
      marketing: { term: 'Channel Mix Balance', def: 'Spreading budget across marketing channels for the best combined return.' },
      business: { term: 'Balance Sheet', def: 'A snapshot of a company’s assets, liabilities and equity.' },
      engineering: { term: 'Structural Equilibrium', def: 'The state where all forces on a structure cancel out safely.' },
      hr: { term: 'Work-Life Balance', def: 'A healthy split between an employee’s job and personal time.' },
      general: { term: 'Equilibrium', def: 'A stable state where opposing forces are equal.' },
    },
  },
  {
    word: 'Risk', meaning: 'The chance that something bad might happen.',
    terms: {
      software: { term: 'Technical Debt', def: 'The future cost of taking a quick shortcut in code today.' },
      data: { term: 'Overfitting', def: 'When a model learns noise in training data and performs poorly on new data.' },
      cloud: { term: 'Single Point of Failure', def: 'A component whose failure would bring down the whole system.' },
      security: { term: 'Vulnerability', def: 'A weakness in a system that could be exploited by an attacker.' },
      design: { term: 'Usability Risk', def: 'The chance users fail a task because of a confusing design.' },
      marketing: { term: 'Brand Risk', def: 'The chance a campaign or message could damage a brand’s reputation.' },
      business: { term: 'Market Risk', def: 'The chance of losses due to overall market movements.' },
      engineering: { term: 'Safety Margin', def: 'The buffer built in to reduce the chance of structural failure.' },
      hr: { term: 'Compliance Risk', def: 'The chance a company breaks employment law or policy.' },
      general: { term: 'Exposure', def: 'The degree to which something is open to potential harm.' },
    },
  },
  {
    word: 'Connection', meaning: 'A link or relationship between two things.',
    terms: {
      software: { term: 'API', def: 'A defined way for two pieces of software to talk to each other.' },
      data: { term: 'Correlation', def: 'A statistical relationship showing how two variables move together.' },
      cloud: { term: 'Network Peering', def: 'A direct link between two networks that skips the public internet.' },
      security: { term: 'Session', def: 'A tracked, authenticated connection between a user and a system.' },
      design: { term: 'Interaction Design', def: 'Designing how a user connects with a product through their actions.' },
      marketing: { term: 'Customer Relationship', def: 'The ongoing connection a brand builds with its customers over time.' },
      business: { term: 'Networking', def: 'Building professional relationships that create business opportunities.' },
      engineering: { term: 'Joint', def: 'The point where two structural components are connected.' },
      hr: { term: 'Employee Engagement', def: 'How connected and invested an employee feels in their work.' },
      general: { term: 'Relationship', def: 'A connection between two or more things or people.' },
    },
  },
  {
    word: 'Pattern', meaning: 'A repeated or regular way something happens.',
    terms: {
      software: { term: 'Design Pattern', def: 'A reusable, proven solution to a common coding problem.' },
      data: { term: 'Trend', def: 'A consistent pattern a model or analyst finds in data over time.' },
      cloud: { term: 'Usage Pattern', def: 'The recurring rhythm of traffic a system typically receives.' },
      security: { term: 'Anomaly Detection', def: 'Spotting behavior that breaks a system’s normal pattern.' },
      design: { term: 'UI Pattern', def: 'A familiar layout, like a search bar, users already know how to use.' },
      marketing: { term: 'Purchase Pattern', def: 'The recurring habits customers show when they buy.' },
      business: { term: 'Seasonality', def: 'A predictable pattern in sales tied to time of year.' },
      engineering: { term: 'Stress Pattern', def: 'The distribution of force across a material under load.' },
      hr: { term: 'Attendance Pattern', def: 'Recurring trends in when and how often employees are present.' },
      general: { term: 'Trend', def: 'A general direction in which something is developing.' },
    },
  },
  {
    word: 'Foundation', meaning: 'The base that everything else is built upon.',
    terms: {
      software: { term: 'Core Library', def: 'The base set of code that the rest of an application depends on.' },
      data: { term: 'Baseline Model', def: 'A simple first model used as the reference point for improvement.' },
      cloud: { term: 'Base Infrastructure', def: 'The core servers and networking every other service runs on.' },
      security: { term: 'Root of Trust', def: 'The foundational component a system’s entire security relies on.' },
      design: { term: 'Design Tokens', def: 'The base values, like colors and spacing, everything else is built from.' },
      marketing: { term: 'Brand Foundation', def: 'The core identity, values and voice every campaign builds on.' },
      business: { term: 'Business Model', def: 'The core plan for how a company creates and captures value.' },
      engineering: { term: 'Footing', def: 'The base structure that transfers a building’s load to the ground.' },
      hr: { term: 'Onboarding', def: 'The foundational process that sets up a new employee for success.' },
      general: { term: 'Base', def: 'The starting point everything else builds from.' },
    },
  },
  {
    word: 'Feedback', meaning: 'Information given in response to an action.',
    terms: {
      software: { term: 'Error Log', def: 'A recorded message a system produces when something goes wrong.' },
      data: { term: 'Loss Function', def: 'A measure of how far a model’s prediction is from the right answer.' },
      cloud: { term: 'Monitoring Alert', def: 'An automatic notification when a system’s metrics cross a threshold.' },
      security: { term: 'Incident Report', def: 'A documented account of what happened during a security event.' },
      design: { term: 'Usability Testing', def: 'Watching real users try a product to see what confuses them.' },
      marketing: { term: 'Customer Feedback Loop', def: 'The cycle of gathering and acting on what customers say.' },
      business: { term: 'Performance Review', def: 'A structured evaluation of how well work met its goals.' },
      engineering: { term: 'Control Loop', def: 'A system that adjusts itself based on measured output.' },
      hr: { term: '360-Degree Feedback', def: 'Performance input gathered from peers, managers and reports alike.' },
      general: { term: 'Response', def: 'A reaction that follows and reflects on an action.' },
    },
  },
  {
    word: 'Scale', meaning: 'The size or extent of something.',
    terms: {
      software: { term: 'Horizontal Scaling', def: 'Adding more machines to share the load, instead of a bigger one.' },
      data: { term: 'Big Data', def: 'Datasets too large or fast-moving for traditional tools to handle.' },
      cloud: { term: 'Elasticity', def: 'A cloud system’s ability to grow and shrink resources on demand.' },
      security: { term: 'Enterprise Security', def: 'Protection designed to hold up across a very large organization.' },
      design: { term: 'Design at Scale', def: 'Keeping a design consistent across hundreds of screens and teams.' },
      marketing: { term: 'Reach', def: 'The total number of people a campaign is shown to.' },
      business: { term: 'Economies of Scale', def: 'Lower cost per unit as production volume grows.' },
      engineering: { term: 'Prototype-to-Production Scale', def: 'Taking a small working model up to full manufacturing size.' },
      hr: { term: 'Headcount Planning', def: 'Forecasting how many people a growing company will need to hire.' },
      general: { term: 'Magnitude', def: 'The relative size or extent of something.' },
    },
  },
  {
    word: 'Privacy', meaning: 'The right to keep personal information to oneself.',
    terms: {
      software: { term: 'Data Encryption', def: 'Scrambling data so only authorized parties can read it.' },
      data: { term: 'Data Anonymization', def: 'Removing identifying details from a dataset before it’s used.' },
      cloud: { term: 'Access Control', def: 'Rules that decide exactly who can view or change cloud data.' },
      security: { term: 'PII Protection', def: 'Safeguarding personally identifiable information from exposure.' },
      design: { term: 'Privacy by Design', def: 'Building data protection into a product from the very first sketch.' },
      marketing: { term: 'Consent Management', def: 'Tracking and respecting what data a user has agreed to share.' },
      business: { term: 'Data Governance', def: 'The policies a company follows to manage data responsibly.' },
      engineering: { term: 'Confidential Design Data', def: 'Protected specifications and drawings restricted to authorized staff.' },
      hr: { term: 'Employee Data Confidentiality', def: 'Keeping personal employee records restricted to those who need them.' },
      general: { term: 'Confidentiality', def: 'Keeping information restricted to those authorized to see it.' },
    },
  },
];
