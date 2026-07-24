/**
 * MCQ scoring and option shuffling.
 *
 * Pure functions, no I/O, so the grading rules can be asserted directly —
 * scoring is the one place a subtle bug silently corrupts real student
 * outcomes, and it is worth proving rather than eyeballing.
 */

const crypto = require('crypto');

/**
 * Deterministic per-(attempt, question) option order.
 *
 * Seeded rather than random so a page refresh, a resume after a dropped
 * connection, or a re-render all produce the SAME order. Without that a
 * candidate could reload and see the letters move under a selected answer.
 *
 * The persisted Result.optionOrder is still the authority — this only has to
 * generate the order once, consistently.
 */
const shuffleOptionsForQuestion = (options, seedKey) => {
  if (!Array.isArray(options) || options.length < 2) return options || [];

  const decorated = options.map((option, index) => {
    const hash = crypto
      .createHash('sha256')
      .update(`${seedKey}:${index}`)
      .digest('hex')
      .slice(0, 12);
    return { option, sortKey: hash };
  });

  decorated.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return decorated.map((d) => d.option);
};

/**
 * Compare a candidate's answer to the correct one.
 *
 * The old check was `question.correctAnswer === selectedValue` on a Mixed
 * field. That fails two ways: a stored number 2 never equals the string "2"
 * that arrives over JSON, and a multi-correct question whose answer is an
 * array never equals anything at all. Both are silent — the answer just grades
 * as wrong.
 *
 * @param {*} correctAnswer - scalar, or array when multipleCorrect
 * @param {*} selectedValue - scalar, or array
 * @param {boolean} multipleCorrect
 */
const isAnswerCorrect = (correctAnswer, selectedValue, multipleCorrect = false) => {
  if (correctAnswer === undefined || correctAnswer === null) return undefined;
  if (selectedValue === undefined || selectedValue === null) return false;

  // Compare as trimmed strings so 2 and "2", "B" and "b " all match.
  const norm = (v) => String(v).trim().toLowerCase();

  if (multipleCorrect || Array.isArray(correctAnswer)) {
    const expected = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]).map(norm);
    const given = (Array.isArray(selectedValue) ? selectedValue : [selectedValue]).map(norm);

    // Set equality: every expected option chosen, and nothing extra. Partial
    // credit is deliberately not given — "B and C" when the answer is "B, C
    // and D" is a different claim, not most of the right one.
    if (expected.length !== given.length) return false;
    const expectedSet = new Set(expected);
    return given.every((g) => expectedSet.has(g));
  }

  return norm(correctAnswer) === norm(selectedValue);
};

/**
 * Marks for a single response.
 *
 * Negative marking applies ONLY to a wrong answer. An unanswered question
 * scores zero — never negative — because penalising a blank punishes the
 * honest candidate who left it and pushes everyone toward guessing.
 */
const scoreResponse = ({ question, selectedValue, config = {} }) => {
  const {
    marksPerQuestion = 1,
    negativeMarksPerWrong = 0,
    multipleCorrect = false
  } = config;

  const answered =
    selectedValue !== undefined &&
    selectedValue !== null &&
    !(Array.isArray(selectedValue) && selectedValue.length === 0) &&
    String(selectedValue).trim() !== '';

  if (!answered) return { isCorrect: undefined, score: 0, answered: false };

  const correct = isAnswerCorrect(question?.correctAnswer, selectedValue, multipleCorrect);

  // No correct answer recorded (a Likert item, say) — not gradeable.
  if (correct === undefined) return { isCorrect: undefined, score: 0, answered: true };

  // A question's own `points` wins over the assessment default when set.
  const positive = question?.points > 0 ? question.points : marksPerQuestion;

  return {
    isCorrect: correct,
    score: correct ? positive : -Math.abs(negativeMarksPerWrong),
    answered: true
  };
};

/**
 * Total an attempt.
 *
 * `earned` may go negative with aggressive negative marking; the reported
 * total is floored at zero so nobody is shown a negative score, while the raw
 * figure stays available for analysis.
 */
const scoreAttempt = ({ responses = [], questionsById = {}, config = {} }) => {
  const { marksPerQuestion = 1, passingMarks = 0, multipleCorrect = false } = config;

  let raw = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let maxScore = 0;

  const graded = responses.map((response) => {
    const question = questionsById[String(response.questionId)] || {};
    const result = scoreResponse({
      question,
      selectedValue: response.selectedValue,
      config: { ...config, multipleCorrect }
    });

    maxScore += question?.points > 0 ? question.points : marksPerQuestion;
    raw += result.score;

    if (!result.answered) unansweredCount += 1;
    else if (result.isCorrect === true) correctCount += 1;
    else if (result.isCorrect === false) wrongCount += 1;

    return { ...response, isCorrect: result.isCorrect, score: result.score };
  });

  const earned = Math.max(0, raw);
  const percentage = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;

  return {
    graded,
    raw,
    earned,
    maxScore,
    percentage,
    correctCount,
    wrongCount,
    unansweredCount,
    passed: passingMarks > 0 ? earned >= passingMarks : null
  };
};

module.exports = {
  shuffleOptionsForQuestion,
  isAnswerCorrect,
  scoreResponse,
  scoreAttempt
};
