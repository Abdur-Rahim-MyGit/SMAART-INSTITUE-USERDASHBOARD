// Simple distress classifier combining keyword hits and sentiment-ish scoring.
// Returns { riskLevel: 'low' | 'medium' | 'high', score, hits }

const DISTRESS_KEYWORDS = [
  'suicide', 'self-harm', 'self harm', 'kill myself', 'want to die', 'hopeless', 'worthless',
  'depressed', 'anxious', 'panic attack', 'panic', 'overwhelmed', 'can\'t cope', 'end it',
  'end my life', 'hurt myself', 'cutting', 'burning', 'abuse', 'violence', 'assault'
];

const NEGATIVE_WORDS = [
  'sad', 'angry', 'upset', 'anxious', 'depressed', 'lonely', 'tired', 'empty', 'lost', 'scared',
  'panic', 'stressed', 'overwhelmed', 'fail', 'failing', 'helpless', 'hopeless'
];

const classifyDistress = (text) => {
  const normalized = (text || '').toLowerCase();
  let score = 0;
  const hits = [];

  for (const kw of DISTRESS_KEYWORDS) {
    if (normalized.includes(kw)) {
      score += 3;
      hits.push(kw);
    }
  }

  for (const neg of NEGATIVE_WORDS) {
    if (normalized.includes(neg)) {
      score += 1;
      hits.push(neg);
    }
  }

  // crude sentiment: count neg vs pos
  const negCount = (normalized.match(/(sad|angry|upset|anxious|depress|panic|stress|hopeless|helpless|worthless|fail)/g) || []).length;
  score += negCount * 0.5;

  let riskLevel = 'low';
  if (score >= 6) riskLevel = 'high';
  else if (score >= 3) riskLevel = 'medium';

  return { riskLevel, score, hits: [...new Set(hits)] };
};

module.exports = { classifyDistress };
