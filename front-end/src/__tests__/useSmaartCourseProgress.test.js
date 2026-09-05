import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSmaartCourseProgress } from "../hooks/useSmaartCourseProgress";
import { assessmentApi } from "../services/assessmentApi";
import { courseEnrollmentAPI } from "../services/api";
import * as courseProgressStorage from "../utils/courseProgressStorage";
import * as courseUnlock from "../utils/courseUnlock";

vi.mock("../services/assessmentApi", () => ({
  assessmentApi: {
    getStageStatus: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  courseEnrollmentAPI: {
    getByStudent: vi.fn(),
  },
}));

vi.mock("../utils/courseProgressStorage", () => ({
  getCompletedCourseIds: vi.fn(),
}));

vi.mock("../utils/courseUnlock", () => ({
  isCapacityDevUnlock: vi.fn(),
}));

vi.mock("../data/courseStructureData", () => ({
  STAGES: [
    {
      id: "stage-1",
      courses: [{ id: "S01" }, { id: "S02" }],
    },
    {
      id: "stage-2",
      courses: [{ id: "S03" }, { id: "S04" }],
    },
  ],
  TRACKS: [
    {
      id: "track-1",
      courses: [{ id: "S01" }, { id: "S02" }, { id: "S03" }],
    },
  ],
}));

describe("useSmaartCourseProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    courseProgressStorage.getCompletedCourseIds.mockReturnValue([]);
    courseUnlock.isCapacityDevUnlock.mockReturnValue(false);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("handles empty/null userId without making API calls", async () => {
    courseProgressStorage.getCompletedCourseIds.mockReturnValue(["S01"]);

    const { result } = renderHook(() => useSmaartCourseProgress(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(assessmentApi.getStageStatus).not.toHaveBeenCalled();
    expect(courseEnrollmentAPI.getByStudent).not.toHaveBeenCalled();
    expect(result.current.userProgress.completedCourses).toEqual(["S01"]);
  });

  it("fetches and merges stage status and completed enrollments", async () => {
    courseProgressStorage.getCompletedCourseIds.mockReturnValue(["S01"]);
    assessmentApi.getStageStatus.mockResolvedValueOnce({
      success: true,
      data: {
        "stage-1": { completed: true },
        "stage-2": { completed: false },
      },
    });

    courseEnrollmentAPI.getByStudent.mockResolvedValueOnce({
      success: true,
      data: [
        {
          course: { _id: "c2", courseCode: "CRS02", courseNumber: "S02" },
          status: "completed",
          progress: 100,
        },
      ],
    });

    const { result } = renderHook(() => useSmaartCourseProgress("usr_123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(assessmentApi.getStageStatus).toHaveBeenCalledWith("usr_123");
    expect(courseEnrollmentAPI.getByStudent).toHaveBeenCalledWith("usr_123");

    // S01 from storage, CRS02 + normalized S02 + courseNumber S02 + id c2 from enrollments
    expect(result.current.userProgress.completedCourses).toContain("S01");
    expect(result.current.userProgress.completedCourses).toContain("CRS02");
    expect(result.current.userProgress.completedCourses).toContain("S02");
    expect(result.current.userProgress.completedCourses).toContain("c2");

    // Stage 1 courses are S01 and S02, both are completed, so completedStages includes stage-1
    expect(result.current.userProgress.completedStages).toContain("stage-1");
    expect(result.current.userProgress.completedStages).not.toContain("stage-2");
    expect(result.current.userProgress.assessmentsPassed).toEqual(["stage-1"]);
  });

  it("appends T1 to assessmentsPassed if isCapacityDevUnlock is true", async () => {
    courseUnlock.isCapacityDevUnlock.mockReturnValue(true);

    assessmentApi.getStageStatus.mockResolvedValueOnce({
      success: true,
      data: {
        "stage-1": { completed: true },
      },
    });
    courseEnrollmentAPI.getByStudent.mockResolvedValueOnce({ success: true, data: [] });

    const { result } = renderHook(() => useSmaartCourseProgress("usr_t1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userProgress.assessmentsPassed).toContain("stage-1");
    expect(result.current.userProgress.assessmentsPassed).toContain("T1");
  });

  it("normalizes various course code formats (S, PIQ, AIQ, SQ, BC)", async () => {
    courseEnrollmentAPI.getByStudent.mockResolvedValueOnce({
      success: true,
      data: [
        { course: { courseCode: "CRS15" }, status: "completed" },
        { course: { courseCode: "CRS26" }, status: "completed" },
        { course: { courseCode: "CRS31" }, status: "completed" },
        { course: { courseCode: "CRS36" }, status: "completed" },
        { course: { courseCode: "CRS41" }, status: "completed" },
        { course: { courseCode: "OTHER_CODE" }, status: "completed" },
      ],
    });
    assessmentApi.getStageStatus.mockResolvedValueOnce({ success: true, data: {} });

    const { result } = renderHook(() => useSmaartCourseProgress("usr_codes"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const completed = result.current.userProgress.completedCourses;
    expect(completed).toContain("S15");
    expect(completed).toContain("PIQ01");
    expect(completed).toContain("AIQ01");
    expect(completed).toContain("SQ01");
    expect(completed).toContain("BC01");
    expect(completed).toContain("OTHER_CODE");
  });

  it("retains previous assessmentsPassed and stageStatus when stage status fetch fails", async () => {
    assessmentApi.getStageStatus.mockResolvedValueOnce({
      success: true,
      data: { "stage-1": { completed: true } },
    });
    courseEnrollmentAPI.getByStudent.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useSmaartCourseProgress("usr_retry"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.userProgress.assessmentsPassed).toEqual(["stage-1"]);
    });

    // On second fetch (refresh), stage status fails
    assessmentApi.getStageStatus.mockResolvedValueOnce({
      success: false,
      error: "Temporary server failure",
    });
    courseEnrollmentAPI.getByStudent.mockResolvedValueOnce([]);

    await act(async () => {
      await result.current.refresh();
    });

    // Should retain previous stage-1
    expect(result.current.userProgress.assessmentsPassed).toEqual(["stage-1"]);
  });

  it("reads currentCourse from localStorage", async () => {
    localStorage.setItem("usr_course_smaart_last_watched_course", "S02");
    assessmentApi.getStageStatus.mockResolvedValueOnce({ success: true, data: {} });
    courseEnrollmentAPI.getByStudent.mockResolvedValueOnce({ success: true, data: [] });

    const { result } = renderHook(() => useSmaartCourseProgress("usr_course"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userProgress.currentCourse).toBe("S02");
  });

  it("handles promise rejection and keeps previous progress", async () => {
    // Provide initial state
    assessmentApi.getStageStatus.mockResolvedValueOnce({
      success: true,
      data: { "stage-1": { completed: true } },
    });
    courseEnrollmentAPI.getByStudent.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useSmaartCourseProgress("usr_err"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate fatal error in refresh
    assessmentApi.getStageStatus.mockRejectedValueOnce(new Error("Network disconnect"));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.userProgress.assessmentsPassed).toEqual(["stage-1"]);
  });
});
