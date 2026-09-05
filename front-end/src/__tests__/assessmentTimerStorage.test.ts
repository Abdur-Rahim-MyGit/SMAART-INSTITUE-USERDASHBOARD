/**
 * assessmentTimerStorage.test.ts
 * Unit tests for src/utils/assessmentTimerStorage.js
 *
 * Covers: buildAssessmentTimerStorageKeys, clearAssessmentTimerStorage.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  buildAssessmentTimerStorageKeys,
  clearAssessmentTimerStorage,
} from "@/utils/assessmentTimerStorage";

// ─────────────────────────────────────────────────────────────
// buildAssessmentTimerStorageKeys
// ─────────────────────────────────────────────────────────────
describe("buildAssessmentTimerStorageKeys", () => {
  it("returns an object with startTimeKey and warningShownKey", () => {
    const keys = buildAssessmentTimerStorageKeys("T1", "user1");
    expect(keys).toHaveProperty("startTimeKey");
    expect(keys).toHaveProperty("warningShownKey");
  });

  it("normalizes stage key to uppercase", () => {
    const { startTimeKey } = buildAssessmentTimerStorageKeys("t1", "user1");
    expect(startTimeKey).toContain("T1");
  });

  it("uses 'T1' as the default stage when none provided", () => {
    const { startTimeKey } = buildAssessmentTimerStorageKeys(null, "user1");
    expect(startTimeKey).toContain("T1");
  });

  it("uses 'anonymous' as default user when none provided", () => {
    const { startTimeKey } = buildAssessmentTimerStorageKeys("T2");
    expect(startTimeKey).toContain("anonymous");
  });

  it("produces different keys for different stages", () => {
    const t1 = buildAssessmentTimerStorageKeys("T1", "u1");
    const t2 = buildAssessmentTimerStorageKeys("T2", "u1");
    expect(t1.startTimeKey).not.toBe(t2.startTimeKey);
  });

  it("scopes key to the resultId when provided", () => {
    const { startTimeKey } = buildAssessmentTimerStorageKeys("T1", "u1", "result-999");
    expect(startTimeKey).toContain("result-999");
  });

  it("produces different keys for the same stage/user but different resultIds", () => {
    const k1 = buildAssessmentTimerStorageKeys("T1", "u1", "r1");
    const k2 = buildAssessmentTimerStorageKeys("T1", "u1", "r2");
    expect(k1.startTimeKey).not.toBe(k2.startTimeKey);
  });

  it("produces the same keys when resultId is omitted vs empty string", () => {
    const k1 = buildAssessmentTimerStorageKeys("T1", "u1");
    const k2 = buildAssessmentTimerStorageKeys("T1", "u1", "");
    expect(k1.startTimeKey).toBe(k2.startTimeKey);
  });
});

// ─────────────────────────────────────────────────────────────
// clearAssessmentTimerStorage
// ─────────────────────────────────────────────────────────────
describe("clearAssessmentTimerStorage", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("removes keys that start with the assessment timer prefix", () => {
    const { startTimeKey, warningShownKey } = buildAssessmentTimerStorageKeys("T1", "user1", "r1");
    localStorage.setItem(startTimeKey, "12345");
    localStorage.setItem(warningShownKey, "true");

    clearAssessmentTimerStorage();

    expect(localStorage.getItem(startTimeKey)).toBeNull();
    expect(localStorage.getItem(warningShownKey)).toBeNull();
  });

  it("removes legacy T1_startTime / T1_oneMinuteWarningShown keys", () => {
    localStorage.setItem("T1_startTime", "12345");
    localStorage.setItem("T1_oneMinuteWarningShown", "true");
    localStorage.setItem("T2_startTime", "67890");

    clearAssessmentTimerStorage();

    expect(localStorage.getItem("T1_startTime")).toBeNull();
    expect(localStorage.getItem("T1_oneMinuteWarningShown")).toBeNull();
    expect(localStorage.getItem("T2_startTime")).toBeNull();
  });

  it("does NOT remove unrelated localStorage keys", () => {
    localStorage.setItem("user_prefs", "some-value");
    localStorage.setItem("theme", "dark");

    clearAssessmentTimerStorage();

    expect(localStorage.getItem("user_prefs")).toBe("some-value");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("does not throw when localStorage is empty", () => {
    expect(() => clearAssessmentTimerStorage()).not.toThrow();
  });
});
