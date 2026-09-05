/**
 * resumeSecurity.test.ts
 * Unit tests for src/utils/resumeSecurity.js
 *
 * Covers: normalizeText, stableStringify, hashString,
 *         buildResumeFingerprint, createResumePublicId, buildVerificationUrl.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  normalizeText,
  stableStringify,
  hashString,
  buildResumeFingerprint,
  createResumePublicId,
  buildVerificationUrl,
  ORG_NAME,
} from "@/utils/resumeSecurity";

// ─────────────────────────────────────────────────────────────
// ORG_NAME constant
// ─────────────────────────────────────────────────────────────
describe("ORG_NAME", () => {
  it("is 'SMAART Institute'", () => {
    expect(ORG_NAME).toBe("SMAART Institute");
  });
});

// ─────────────────────────────────────────────────────────────
// normalizeText
// ─────────────────────────────────────────────────────────────
describe("normalizeText", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("collapses multiple spaces to one", () => {
    expect(normalizeText("hello   world")).toBe("hello world");
  });

  it("handles null/undefined gracefully", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });

  it("handles numbers by converting to string", () => {
    expect(normalizeText(42)).toBe("42");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeText("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────
// stableStringify
// ─────────────────────────────────────────────────────────────
describe("stableStringify", () => {
  it("produces the same output regardless of object key order", () => {
    const a = stableStringify({ b: "2", a: "1" });
    const b = stableStringify({ a: "1", b: "2" });
    expect(a).toBe(b);
  });

  it("handles arrays deterministically", () => {
    const result = stableStringify(["x", "y"]);
    expect(result).toBe('["x","y"]');
  });

  it("handles nested objects", () => {
    const result = stableStringify({ outer: { inner: "value" } });
    expect(result).toContain("inner");
    expect(result).toContain("value");
  });

  it("handles primitive values", () => {
    expect(stableStringify("hello")).toBe('"hello"');
  });
});

// ─────────────────────────────────────────────────────────────
// hashString
// ─────────────────────────────────────────────────────────────
describe("hashString", () => {
  it("returns a non-empty string", () => {
    const h = hashString("test");
    expect(typeof h).toBe("string");
    expect(h.length).toBeGreaterThan(0);
  });

  it("returns the same hash for the same input (deterministic)", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });

  it("returns different hashes for different inputs", () => {
    expect(hashString("hello")).not.toBe(hashString("world"));
  });

  it("pads output to at least 7 characters", () => {
    const h = hashString("a");
    expect(h.length).toBeGreaterThanOrEqual(7);
  });

  it("output is uppercase alphanumeric", () => {
    const h = hashString("SMAART Institute resume data");
    expect(h).toMatch(/^[0-9A-Z]+$/);
  });
});

// ─────────────────────────────────────────────────────────────
// buildResumeFingerprint
// ─────────────────────────────────────────────────────────────
describe("buildResumeFingerprint", () => {
  const samplePayload = {
    personalInfo: { name: "Ali Khan" },
    summary: "A great student",
    experience: [],
    education: [{ institution: "SMAART" }],
    skills: ["React", "Node"],
    projects: [],
    achievements: [],
    personalDetails: {},
  };

  it("returns a non-empty string", () => {
    const fp = buildResumeFingerprint(samplePayload);
    expect(typeof fp).toBe("string");
    expect(fp.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same payload", () => {
    expect(buildResumeFingerprint(samplePayload)).toBe(
      buildResumeFingerprint(samplePayload)
    );
  });

  it("produces different fingerprints for different payloads", () => {
    const fp1 = buildResumeFingerprint(samplePayload);
    const fp2 = buildResumeFingerprint({
      ...samplePayload,
      summary: "A different student",
    });
    expect(fp1).not.toBe(fp2);
  });

  it("handles an empty payload without throwing", () => {
    expect(() => buildResumeFingerprint({})).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// createResumePublicId
// ─────────────────────────────────────────────────────────────
describe("createResumePublicId", () => {
  it("returns a string starting with SMR-", () => {
    const id = createResumePublicId("ABCDEF0");
    expect(id).toMatch(/^SMR-/);
  });

  it("includes the current year", () => {
    const year = new Date().getFullYear().toString();
    const id = createResumePublicId("ABCDEF0");
    expect(id).toContain(year);
  });

  it("includes the first 4 characters of the fingerprint", () => {
    const fingerprint = "XYZABCDEF";
    const id = createResumePublicId(fingerprint);
    expect(id).toContain("XYZA");
  });

  it("is different on each call (random component)", () => {
    const id1 = createResumePublicId("ABCDEF0");
    const id2 = createResumePublicId("ABCDEF0");
    // With crypto.randomUUID each call is unique
    expect(id1).not.toBe(id2);
  });
});

// ─────────────────────────────────────────────────────────────
// buildVerificationUrl
// ─────────────────────────────────────────────────────────────
describe("buildVerificationUrl", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // jsdom sets window.location.origin to 'http://localhost'
  });

  afterEach(() => {
    // Restore (no real change needed for jsdom)
  });

  it("returns a URL containing the resumePublicId", () => {
    const url = buildVerificationUrl("SMR-2026-ABCD-XYZ", "HASH123");
    expect(url).toContain("SMR-2026-ABCD-XYZ");
  });

  it("returns a URL containing the fingerprint hash", () => {
    const url = buildVerificationUrl("SMR-2026-ABCD-XYZ", "HASH123");
    expect(url).toContain("HASH123");
  });

  it("returns a URL on the correct origin (http://localhost)", () => {
    const url = buildVerificationUrl("SMR-2026-ABCD-XYZ", "HASH123");
    expect(url).toMatch(/^http:\/\/localhost/);
  });

  it("includes /verify-resume/ in the path", () => {
    const url = buildVerificationUrl("ID", "FP");
    expect(url).toContain("/verify-resume/");
  });
});
