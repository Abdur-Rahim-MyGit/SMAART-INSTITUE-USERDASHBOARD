/**
 * courseUnlock.test.ts
 * Unit tests for src/utils/courseUnlock.js
 *
 * Covers: normalizeCourseId, compareCourseIds, isCapacityDevUnlock,
 *         hasPassedBaseline, enableCapacityDevUnlock.
 *
 * Note: courseUnlock.js imports from @/data/courseStructureData.
 * We mock that module to isolate the utility from data changes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the data module that courseUnlock.js imports at module load time.
vi.mock("@/data/courseStructureData", () => ({
  STAGES: [],
  TRACKS: [],
}));

import {
  normalizeCourseId,
  compareCourseIds,
  isCapacityDevUnlock,
  enableCapacityDevUnlock,
  hasPassedBaseline,
  CAPACITY_DEV_UNLOCK_KEY,
} from "@/utils/courseUnlock";

// ─────────────────────────────────────────────────────────────
// normalizeCourseId
// ─────────────────────────────────────────────────────────────
describe("normalizeCourseId", () => {
  it("returns empty string for falsy input", () => {
    expect(normalizeCourseId(null)).toBe("");
    expect(normalizeCourseId(undefined)).toBe("");
    expect(normalizeCourseId("")).toBe("");
  });

  it("returns the id unchanged when it does not start with CRS", () => {
    expect(normalizeCourseId("S01")).toBe("S01");
    expect(normalizeCourseId("PIQ01")).toBe("PIQ01");
  });

  it("maps CRS00001 → S01 (stage 1 zero-padded)", () => {
    expect(normalizeCourseId("CRS00001")).toBe("S01");
  });

  it("maps CRS00010 → S10 (last in stage 1 range)", () => {
    expect(normalizeCourseId("CRS00010")).toBe("S10");
  });

  it("maps CRS00011 → S11 (stage 2 range)", () => {
    expect(normalizeCourseId("CRS00011")).toBe("S11");
  });

  it("maps CRS00019 → S19 (last of stage 2 range)", () => {
    expect(normalizeCourseId("CRS00019")).toBe("S19");
  });

  it("maps CRS00020 → S20 (stage 3 range)", () => {
    expect(normalizeCourseId("CRS00020")).toBe("S20");
  });

  it("maps CRS00026 → PIQ01 (PIQ track)", () => {
    expect(normalizeCourseId("CRS00026")).toBe("PIQ01");
  });

  it("maps CRS00031 → AIQ01 (AIQ track)", () => {
    expect(normalizeCourseId("CRS00031")).toBe("AIQ01");
  });

  it("maps CRS00036 → SQ01 (SQ track)", () => {
    expect(normalizeCourseId("CRS00036")).toBe("SQ01");
  });

  it("maps CRS00041 → BC01 (BC track)", () => {
    expect(normalizeCourseId("CRS00041")).toBe("BC01");
  });

  it("returns original id for unrecognised CRS numbers", () => {
    expect(normalizeCourseId("CRS00099")).toBe("CRS00099");
  });
});

// ─────────────────────────────────────────────────────────────
// compareCourseIds
// ─────────────────────────────────────────────────────────────
describe("compareCourseIds", () => {
  it("returns false when either id is falsy", () => {
    expect(compareCourseIds(null, "S01")).toBe(false);
    expect(compareCourseIds("S01", null)).toBe(false);
    expect(compareCourseIds(undefined, undefined)).toBe(false);
  });

  it("matches identical ids directly", () => {
    expect(compareCourseIds("S01", "S01")).toBe(true);
  });

  it("matches CRS00001 with S01 (normalized form)", () => {
    expect(compareCourseIds("CRS00001", "S01")).toBe(true);
  });

  it("matches S01 with CRS00001", () => {
    expect(compareCourseIds("S01", "CRS00001")).toBe(true);
  });

  it("does NOT match different course ids", () => {
    expect(compareCourseIds("S01", "S02")).toBe(false);
  });

  it("matches CRS00010 with S10", () => {
    expect(compareCourseIds("CRS00010", "S10")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// isCapacityDevUnlock / enableCapacityDevUnlock
// ─────────────────────────────────────────────────────────────
describe("isCapacityDevUnlock", () => {
  beforeEach(() => {
    localStorage.removeItem(CAPACITY_DEV_UNLOCK_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(CAPACITY_DEV_UNLOCK_KEY);
  });

  it("returns false when the key is not set", () => {
    expect(isCapacityDevUnlock()).toBe(false);
  });

  it("returns true after enableCapacityDevUnlock() is called", () => {
    enableCapacityDevUnlock();
    expect(isCapacityDevUnlock()).toBe(true);
  });

  it("returns false when key is set to a value other than '1'", () => {
    localStorage.setItem(CAPACITY_DEV_UNLOCK_KEY, "true");
    expect(isCapacityDevUnlock()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// hasPassedBaseline
// ─────────────────────────────────────────────────────────────
describe("hasPassedBaseline", () => {
  beforeEach(() => {
    localStorage.removeItem(CAPACITY_DEV_UNLOCK_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(CAPACITY_DEV_UNLOCK_KEY);
  });

  it("returns true when user has T1 in assessmentsPassed", () => {
    const progress = { assessmentsPassed: ["T1"] };
    expect(hasPassedBaseline(progress)).toBe(true);
  });

  it("returns false when assessmentsPassed is empty", () => {
    const progress = { assessmentsPassed: [] };
    expect(hasPassedBaseline(progress)).toBe(false);
  });

  it("returns false when userProgress is null", () => {
    expect(hasPassedBaseline(null)).toBe(false);
  });

  it("returns true when capacity dev unlock is enabled (bypasses T1 check)", () => {
    enableCapacityDevUnlock();
    expect(hasPassedBaseline({ assessmentsPassed: [] })).toBe(true);
  });
});
