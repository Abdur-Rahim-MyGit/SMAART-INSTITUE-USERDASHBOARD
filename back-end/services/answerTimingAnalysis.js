/**
 * Answer-timing analysis.
 *
 * This is the strongest signal in the whole system, and the only one the
 * candidate genuinely cannot tamper with. Every browser detector — face, gaze,
 * fullscreen, second screen — runs on their machine and can in principle be
 * disabled. This runs on ours, over data they themselves submitted, and
 * measures the one thing cheating always costs: time.
 *
 * Looking up an answer takes seconds. Being fed one arrives suspiciously fast.
 * Neither pattern can be hidden without changing the behaviour itself.
 *
 * Everything here is a FLAG, not a verdict. Fast answers can mean a strong
 * candidate; a long pause can mean a bathroom break. The output feeds the risk
 * score alongside everything else and a human makes the final call.
 */

// Below this, a considered answer is implausible — it is not enough time to
// read the stem and four options, let alone reason about them.
const IMPLAUSIBLE_MS = 2000;

// A gap this long suggests the candidate left the question to do something
// else. Combined with a correct answer immediately after, it is interesting.
const LONG_GAP_MS = 45000;

// How many implausibly fast answers before it stops looking like luck.
const FAST_ANSWER_LIMIT = 3;

// A burst of rapid-fire answers after a long pause is the classic signature of
// someone who stepped away, obtained the answers, and is now entering them.
const BURST_SIZE = 4;
const BURST_WINDOW_MS = 12000;

/**
 * Analyse a completed attempt.
 *
 * @param {object} result - the Result document (needs responses[].answeredAt)
 * @returns {{ anomalies: string[], fastAnswers: number, bursts: number, suspicious: boolean }}
 */
const analyseTiming = (result) => {
  const report = { anomalies: [], fastAnswers: 0, bursts: 0, suspicious: false };

  const responses = (result?.responses || [])
    .filter((r) => r && r.answeredAt)
    .slice()
    .sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));

  // Two answers are the minimum needed to measure anything at all.
  if (responses.length < 2) return report;

  const gaps = [];
  for (let i = 1; i < responses.length; i++) {
    const gap = new Date(responses[i].answeredAt) - new Date(responses[i - 1].answeredAt);
    // Guard against clock skew or duplicate timestamps producing negatives.
    gaps.push({ index: i, gap: Math.max(0, gap), response: responses[i] });
  }

  // ── Implausibly fast answers ──────────────────────────────────────────
  const fast = gaps.filter((g) => g.gap > 0 && g.gap < IMPLAUSIBLE_MS);
  report.fastAnswers = fast.length;

  if (fast.length >= FAST_ANSWER_LIMIT) {
    report.anomalies.push(
      `${fast.length} answers submitted in under ${IMPLAUSIBLE_MS / 1000}s each.`
    );
  }

  // ── Rapid burst immediately after a long gap ──────────────────────────
  // Left the question for a while, came back, then filled in several answers
  // in quick succession.
  for (let i = 0; i < gaps.length; i++) {
    if (gaps[i].gap < LONG_GAP_MS) continue;

    let burst = 0;
    let elapsed = 0;
    for (let j = i + 1; j < gaps.length; j++) {
      elapsed += gaps[j].gap;
      if (elapsed > BURST_WINDOW_MS) break;
      burst += 1;
    }

    if (burst >= BURST_SIZE) {
      report.bursts += 1;
      i += burst; // Don't double-count the same burst
    }
  }

  if (report.bursts > 0) {
    report.anomalies.push(
      `${report.bursts} burst(s) of rapid answers immediately after a long pause.`
    );
  }

  // ── Whole-attempt implausibility ──────────────────────────────────────
  // A full paper finished far faster than anyone could read it.
  const total = new Date(responses[responses.length - 1].answeredAt) - new Date(responses[0].answeredAt);
  const perQuestion = total / responses.length;
  if (responses.length >= 10 && perQuestion < IMPLAUSIBLE_MS) {
    report.anomalies.push(
      `Whole assessment averaged ${(perQuestion / 1000).toFixed(1)}s per question.`
    );
  }

  report.suspicious = report.anomalies.length > 0;
  return report;
};

module.exports = {
  analyseTiming,
  // Exported for tests
  IMPLAUSIBLE_MS,
  LONG_GAP_MS,
  FAST_ANSWER_LIMIT,
  BURST_SIZE
};
