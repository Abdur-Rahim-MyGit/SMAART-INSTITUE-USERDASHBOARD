import { useEffect, useState, useCallback } from "react";
import { assessmentApi } from "@/services/assessmentApi";
import { courseEnrollmentAPI } from "@/services/api";
import { getCompletedCourseIds } from "@/utils/courseProgressStorage";
import { isCapacityDevUnlock } from "@/utils/courseUnlock";
import { STAGES, TRACKS } from "@/data/courseStructureData";

const emptyProgress = {
  completedCourses: [],
  completedStages: [],
  tracksCompleted: [],
  assessmentsPassed: [],
  currentCourse: null,
  stageStatus: null,
  enrollmentProgress: [],
  overallProgressPct: 0,
};

const mapStageStatusToPassed = (stageStatus) => {
  if (!stageStatus) return [];
  return Object.entries(stageStatus)
    .filter(([, value]) => value?.completed === true)
    .map(([stage]) => stage);
};

const normalizeCode = (code) => {
  if (!code || !code.startsWith("CRS")) return code;
  const num = parseInt(code.replace(/\D/g, ""), 10);
  if (isNaN(num)) return code;
  if (num >= 1 && num <= 10) return `S${String(num).padStart(2, "0")}`;
  if (num >= 11 && num <= 25) return `S${num}`;
  if (num >= 26 && num <= 30) return `PIQ${String(num - 25).padStart(2, "0")}`;
  if (num >= 31 && num <= 35) return `AIQ${String(num - 30).padStart(2, "0")}`;
  if (num >= 36 && num <= 40) return `SQ${String(num - 35).padStart(2, "0")}`;
  if (num >= 41 && num <= 45) return `BC${String(num - 40).padStart(2, "0")}`;
  return code;
};

const mergeCompletedFromEnrollments = (enrollments = []) => {
  const fromStorage = getCompletedCourseIds();
  const fromDb = [];

  enrollments.forEach((enrollment) => {
    const courseRef = enrollment.course;
    const isComplete =
      enrollment.status === "completed" ||
      enrollment.progress >= 100;

    if (isComplete) {
      const code = typeof courseRef === "object" ? courseRef?.courseCode : null;
      const number = typeof courseRef === "object" ? courseRef?.courseNumber : null;
      const id =
        typeof courseRef === "object"
          ? courseRef?._id ? String(courseRef._id) : null
          : typeof courseRef === "string"
          ? courseRef
          : null;

      if (code) {
        fromDb.push(code);
        const norm = normalizeCode(code);
        if (norm && norm !== code) fromDb.push(norm);
      }
      if (number) fromDb.push(number);
      if (id) fromDb.push(id);
    }
  });

  return [...new Set([...fromStorage, ...fromDb])];
};

/**
 * Computes weighted overall progress percentage from enrollments.
 * Uses actual progress % per course so partially-done courses count.
 */
const computeOverallProgressPct = (enrollments = []) => {
  if (!enrollments.length) return 0;
  const total = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
  return Math.round(total / enrollments.length);
};

export const useSmaartCourseProgress = (userId) => {
  const [userProgress, setUserProgress] = useState(emptyProgress);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setUserProgress({
        ...emptyProgress,
        completedCourses: getCompletedCourseIds(),
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [stageRes, enrollmentsRes] = await Promise.allSettled([
        assessmentApi.getStageStatus(userId),
        courseEnrollmentAPI.getByStudent(userId),
      ]);

      const stageStatusFetchSucceeded = stageRes.status === "fulfilled" && stageRes.value?.success;
      const stageStatus = stageStatusFetchSucceeded ? stageRes.value.data : null;

      let assessmentsPassed = stageStatusFetchSucceeded
        ? mapStageStatusToPassed(stageStatus)
        : null; // sentinel: fetch failed, keep last known value instead of wiping it below
      if (assessmentsPassed && isCapacityDevUnlock() && !assessmentsPassed.includes("T1")) {
        assessmentsPassed = [...assessmentsPassed, "T1"];
      }

      const enrollments =
        enrollmentsRes.status === "fulfilled"
          ? Array.isArray(enrollmentsRes.value)
            ? enrollmentsRes.value
            : enrollmentsRes.value?.data || []
          : [];

      const completedCourses = mergeCompletedFromEnrollments(enrollments);

      const completedStages = STAGES.filter((stage) => {
        const stageComplete = stage.courses.every((c) =>
          completedCourses.includes(c.id)
        );
        return stageComplete;
      }).map((s) => s.id);

      const tracksCompleted = TRACKS.filter((track) => {
        return track.courses.every((c) => completedCourses.includes(c.id));
      }).map((t) => t.id);

      setUserProgress((prev) => ({
        completedCourses,
        completedStages,
        tracksCompleted,
        // A failed stage-status fetch keeps the last known assessmentsPassed
        // instead of wiping it to [] — otherwise a transient network hiccup
        // would look like the user's passed assessments got re-locked.
        assessmentsPassed: assessmentsPassed !== null ? assessmentsPassed : (prev.assessmentsPassed || []),
        currentCourse: localStorage.getItem(`${userId}_smaart_last_watched_course`) || localStorage.getItem("smaart_last_watched_course"),
        stageStatus: stageStatus || prev.stageStatus,
        enrollmentProgress: enrollments.map((e) => ({
          courseId: e.course?._id || e.course,
          courseCode: e.course?.courseCode,
          progress: e.progress || 0,
          status: e.status,
          moduleProgress: e.moduleProgress || [],
        })),
      }));
    } catch (err) {
      console.warn("[useSmaartCourseProgress] load failed:", err);
      // Keep whatever was already loaded rather than resetting real progress
      // to empty — only fall back to a fresh localStorage read if we never
      // had anything loaded in the first place (e.g. failure on first mount).
      setUserProgress((prev) =>
        prev.completedCourses.length || prev.assessmentsPassed.length
          ? prev
          : { ...emptyProgress, completedCourses: getCompletedCourseIds() }
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { userProgress, loading, refresh };
};

export default useSmaartCourseProgress;
