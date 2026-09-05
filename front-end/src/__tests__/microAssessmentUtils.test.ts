/**
 * microAssessmentUtils.test.ts
 * Unit tests for src/utils/microAssessmentUtils.js
 *
 * Covers: normalizeQuizQuestion, normalizeQuizQuestions, getCorrectOptionIndex,
 *         isAnswerCorrect, computeQuizScore, OPTION_LABELS, getOptionLabel.
 */
import { describe, it, expect } from "vitest";
import {
  OPTION_LABELS,
  getOptionLabel,
  normalizeQuizQuestion,
  normalizeQuizQuestions,
  getCorrectOptionIndex,
  isAnswerCorrect,
  computeQuizScore,
} from "@/utils/microAssessmentUtils";

// ─────────────────────────────────────────────────────────────
// OPTION_LABELS / getOptionLabel
// ─────────────────────────────────────────────────────────────
describe("OPTION_LABELS", () => {
  it("starts with A", () => {
    expect(OPTION_LABELS[0]).toBe("A");
  });

  it("includes A through F", () => {
    expect(OPTION_LABELS).toEqual(expect.arrayContaining(["A", "B", "C", "D", "E", "F"]));
  });
});

describe("getOptionLabel", () => {
  it("returns A for index 0", () => {
    expect(getOptionLabel(0)).toBe("A");
  });

  it("returns D for index 3", () => {
    expect(getOptionLabel(3)).toBe("D");
  });

  it("falls back to '(index+1)' for out-of-range indices", () => {
    expect(getOptionLabel(10)).toBe("11");
  });
});

// ─────────────────────────────────────────────────────────────
// normalizeQuizQuestion
// ─────────────────────────────────────────────────────────────
describe("normalizeQuizQuestion", () => {
  it("normalizes a question with array options", () => {
    const raw = { question: "What is 2+2?", options: ["3", "4", "5"], correctAnswer: 1 };
    const result = normalizeQuizQuestion(raw);
    expect(result.question).toBe("What is 2+2?");
    expect(result.options).toEqual(["3", "4", "5"]);
    expect(result.correctAnswer).toBe(1);
  });

  it("normalizes an object options map (A/B/C/D format)", () => {
    const raw = {
      question: "Capital of France?",
      options: { A: "Berlin", B: "Paris", C: "Rome" },
      correctAnswer: "B",
    };
    const result = normalizeQuizQuestion(raw);
    expect(result.options).toContain("Paris");
    expect(result.options.length).toBe(3);
  });

  it("sets type to 'mcq' by default", () => {
    const result = normalizeQuizQuestion({ question: "Q?", options: ["A", "B"] });
    expect(result.type).toBe("mcq");
  });

  it("preserves existing type", () => {
    const result = normalizeQuizQuestion({ question: "Q?", options: ["A", "B"], type: "truefalse" });
    expect(result.type).toBe("truefalse");
  });

  it("sets points to 1 by default", () => {
    const result = normalizeQuizQuestion({ question: "Q?", options: ["A", "B"] });
    expect(result.points).toBe(1);
  });

  it("trims whitespace from question text", () => {
    const result = normalizeQuizQuestion({ question: "  Trimmed?  ", options: ["A"] });
    expect(result.question).toBe("Trimmed?");
  });

  it("uses questionText as fallback for question field", () => {
    const result = normalizeQuizQuestion({ questionText: "From questionText?", options: ["A", "B"] });
    expect(result.question).toBe("From questionText?");
  });

  it("filters empty option strings", () => {
    const result = normalizeQuizQuestion({ question: "Q?", options: ["A", "", "  ", "B"] });
    expect(result.options).toEqual(["A", "B"]);
  });

  it("handles missing options gracefully", () => {
    const result = normalizeQuizQuestion({ question: "Q?" });
    expect(result.options).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// normalizeQuizQuestions
// ─────────────────────────────────────────────────────────────
describe("normalizeQuizQuestions", () => {
  it("returns an empty array for empty input", () => {
    expect(normalizeQuizQuestions([])).toEqual([]);
  });

  it("returns an empty array for null/undefined", () => {
    expect(normalizeQuizQuestions(null)).toEqual([]);
    expect(normalizeQuizQuestions(undefined)).toEqual([]);
  });

  it("filters out questions with fewer than 2 options", () => {
    const questions = [
      { question: "Valid?", options: ["A", "B"], correctAnswer: 0 },
      { question: "Invalid (1 option)", options: ["A"], correctAnswer: 0 },
      { question: "Also invalid (no options)", options: [], correctAnswer: 0 },
    ];
    const result = normalizeQuizQuestions(questions);
    expect(result.length).toBe(1);
    expect(result[0].question).toBe("Valid?");
  });

  it("filters out questions with no question text", () => {
    const questions = [
      { question: "", options: ["A", "B"], correctAnswer: 0 },
      { question: "Valid?", options: ["A", "B"], correctAnswer: 0 },
    ];
    const result = normalizeQuizQuestions(questions);
    expect(result.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// getCorrectOptionIndex
// ─────────────────────────────────────────────────────────────
describe("getCorrectOptionIndex", () => {
  const q3 = { options: ["Alpha", "Beta", "Gamma"], correctAnswer: null };

  it("returns -1 when correctAnswer is null", () => {
    expect(getCorrectOptionIndex(q3)).toBe(-1);
  });

  it("returns -1 when question is null/undefined", () => {
    expect(getCorrectOptionIndex(null)).toBe(-1);
    expect(getCorrectOptionIndex(undefined)).toBe(-1);
  });

  it("resolves a numeric index directly", () => {
    const q = { options: ["A", "B", "C"], correctAnswer: 2 };
    expect(getCorrectOptionIndex(q)).toBe(2);
  });

  it("resolves a letter answer (A → 0)", () => {
    const q = { options: ["A", "B", "C"], correctAnswer: "A" };
    expect(getCorrectOptionIndex(q)).toBe(0);
  });

  it("resolves a letter answer (B → 1)", () => {
    const q = { options: ["A", "B", "C"], correctAnswer: "B" };
    expect(getCorrectOptionIndex(q)).toBe(1);
  });

  it("resolves a letter answer case-insensitively", () => {
    const q = { options: ["A", "B", "C"], correctAnswer: "c" };
    expect(getCorrectOptionIndex(q)).toBe(2);
  });

  it("resolves by matching text content", () => {
    const q = { options: ["Paris", "Berlin", "Rome"], correctAnswer: "Paris" };
    expect(getCorrectOptionIndex(q)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// isAnswerCorrect
// ─────────────────────────────────────────────────────────────
describe("isAnswerCorrect", () => {
  const question = { options: ["A", "B", "C"], correctAnswer: 1 };

  it("returns true when selected index matches correct answer", () => {
    expect(isAnswerCorrect(question, 1)).toBe(true);
  });

  it("returns false when selected index does not match", () => {
    expect(isAnswerCorrect(question, 0)).toBe(false);
  });

  it("returns false when selectedIndex is null", () => {
    expect(isAnswerCorrect(question, null)).toBe(false);
  });

  it("returns false when selectedIndex is undefined", () => {
    expect(isAnswerCorrect(question, undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// computeQuizScore
// ─────────────────────────────────────────────────────────────
describe("computeQuizScore", () => {
  const questions = [
    { options: ["A", "B"], correctAnswer: 0, points: 1 },
    { options: ["A", "B"], correctAnswer: 1, points: 2 },
    { options: ["A", "B"], correctAnswer: 0, points: 1 },
  ];

  it("returns total points for all correct answers", () => {
    const answers = [0, 1, 0]; // all correct
    expect(computeQuizScore(questions, answers)).toBe(4);
  });

  it("returns 0 when all answers are wrong", () => {
    const answers = [1, 0, 1]; // all wrong
    expect(computeQuizScore(questions, answers)).toBe(0);
  });

  it("returns partial score for partial correctness", () => {
    const answers = [0, 0, 1]; // first correct (1pt), others wrong
    expect(computeQuizScore(questions, answers)).toBe(1);
  });

  it("returns 0 for empty questions array", () => {
    expect(computeQuizScore([], [])).toBe(0);
  });
});
