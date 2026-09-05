import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCompletedCourseIds,
  markCourseCompleted,
  isCourseMarkedComplete,
} from "../utils/courseProgressStorage";

describe("courseProgressStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe("getCompletedCourseIds", () => {
    it("returns an empty array when no user and no completed courses exist in storage", () => {
      const result = getCompletedCourseIds();
      expect(result).toEqual([]);
    });

    it("retrieves courses for authenticated user with _id from localStorage", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_123" }));
      localStorage.setItem("usr_123_smaart_completed_courses", JSON.stringify(["S01", "S02"]));

      const result = getCompletedCourseIds();
      expect(result).toEqual(["S01", "S02"]);
    });

    it("retrieves courses for authenticated user with id instead of _id", () => {
      sessionStorage.setItem("user", JSON.stringify({ id: "usr_456" }));
      localStorage.setItem("usr_456_smaart_completed_courses", JSON.stringify(["PIQ01"]));

      const result = getCompletedCourseIds();
      expect(result).toEqual(["PIQ01"]);
    });

    it("falls back to 'anon' when user JSON lacks id and _id", () => {
      sessionStorage.setItem("user", JSON.stringify({ name: "Guest" }));
      localStorage.setItem("anon_smaart_completed_courses", JSON.stringify(["CRS01"]));

      const result = getCompletedCourseIds();
      expect(result).toEqual(["CRS01"]);
    });

    it("falls back to legacy global key 'smaart_completed_courses' in localStorage if user-specific key is missing", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_legacy" }));
      localStorage.setItem("smaart_completed_courses", JSON.stringify(["LEGACY_CRS"]));

      const result = getCompletedCourseIds();
      expect(result).toEqual(["LEGACY_CRS"]);

      // Confirms migrated to user-scoped key
      expect(localStorage.getItem("usr_legacy_smaart_completed_courses")).toBe(
        JSON.stringify(["LEGACY_CRS"])
      );
    });

    it("returns empty array and handles malformed JSON in user key gracefully", () => {
      sessionStorage.setItem("user", "{ broken json");
      localStorage.setItem("anon_smaart_completed_courses", JSON.stringify(["S01"]));

      const result = getCompletedCourseIds();
      expect(result).toEqual(["S01"]);
    });

    it("returns empty array when course data in localStorage is malformed JSON", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_corrupted" }));
      localStorage.setItem("usr_corrupted_smaart_completed_courses", "{ not-an-array");

      const result = getCompletedCourseIds();
      expect(result).toEqual([]);
    });

    it("returns empty array if stored data is not an array", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_obj" }));
      localStorage.setItem("usr_obj_smaart_completed_courses", JSON.stringify({ course: "S01" }));

      const result = getCompletedCourseIds();
      expect(result).toEqual([]);
    });

    it("handles malformed JSON in legacy data gracefully", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_bad_legacy" }));
      localStorage.setItem("smaart_completed_courses", "{ broken legacy");

      const result = getCompletedCourseIds();
      expect(result).toEqual([]);
    });
  });

  describe("markCourseCompleted", () => {
    it("does nothing if courseId is undefined, null, empty string", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_empty" }));
      markCourseCompleted();
      markCourseCompleted(null);
      markCourseCompleted("");

      expect(localStorage.getItem("usr_empty_smaart_completed_courses")).toBeNull();
    });

    it("saves courseId into user-scoped localStorage", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_save" }));

      markCourseCompleted("CRS01");

      const stored = JSON.parse(localStorage.getItem("usr_save_smaart_completed_courses"));
      expect(stored).toEqual(["CRS01"]);
    });

    it("does not duplicate courseId if already marked completed", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_dup" }));
      localStorage.setItem("usr_dup_smaart_completed_courses", JSON.stringify(["S01"]));

      markCourseCompleted("S01");

      const stored = JSON.parse(localStorage.getItem("usr_dup_smaart_completed_courses"));
      expect(stored).toEqual(["S01"]);
      expect(stored.length).toBe(1);
    });

    it("appends new course to existing completed list", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_append" }));
      localStorage.setItem("usr_append_smaart_completed_courses", JSON.stringify(["S01"]));

      markCourseCompleted("S02");

      const stored = JSON.parse(localStorage.getItem("usr_append_smaart_completed_courses"));
      expect(stored).toEqual(["S01", "S02"]);
    });
  });

  describe("isCourseMarkedComplete", () => {
    it("returns true if course is completed, false otherwise", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_check" }));
      localStorage.setItem("usr_check_smaart_completed_courses", JSON.stringify(["S01", "CRS02"]));

      expect(isCourseMarkedComplete("S01")).toBe(true);
      expect(isCourseMarkedComplete("CRS02")).toBe(true);
      expect(isCourseMarkedComplete("S03")).toBe(false);
    });

    it("returns false for missing course inputs", () => {
      sessionStorage.setItem("user", JSON.stringify({ _id: "usr_check" }));
      localStorage.setItem("usr_check_smaart_completed_courses", JSON.stringify(["S01"]));

      expect(isCourseMarkedComplete(null)).toBe(false);
      expect(isCourseMarkedComplete(undefined)).toBe(false);
      expect(isCourseMarkedComplete("")).toBe(false);
    });
  });

  describe("User isolation", () => {
    it("maintains separate progress per user", () => {
      // User A
      sessionStorage.setItem("user", JSON.stringify({ _id: "userA" }));
      markCourseCompleted("COURSE_A");

      // User B
      sessionStorage.setItem("user", JSON.stringify({ _id: "userB" }));
      markCourseCompleted("COURSE_B");

      expect(isCourseMarkedComplete("COURSE_B")).toBe(true);
      expect(isCourseMarkedComplete("COURSE_A")).toBe(false);

      // Switch back to User A
      sessionStorage.setItem("user", JSON.stringify({ _id: "userA" }));
      expect(isCourseMarkedComplete("COURSE_A")).toBe(true);
      expect(isCourseMarkedComplete("COURSE_B")).toBe(false);
    });
  });
});
