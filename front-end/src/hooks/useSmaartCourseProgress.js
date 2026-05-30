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
};

const mapStageStatusToPassed = (stageStatus) => {
  if (!stageStatus) return [];
  return Object.entries(stageStatus)
    .filter(([, value]) => value?.completed === true)
    .map(([stage]) => stage);
};

const mergeCompletedFromEnrollments = (enrollments = []) => {
  const fromStorage = getCompletedCourseIds();
  const fromDb = [];

  enrollments.forEach((enrollment) => {
    const courseRef = enrollment.course;
    const code = typeof courseRef === "object" ? courseRef?.courseCode : null;
    const isComplete =
      enrollment.status === "completed" ||
      enrollment.progress >= 100;

    if (isComplete && code) fromDb.push(code);
  });

  return [...new Set([...fromStorage, ...fromDb])];
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

      const stageStatus =
        stageRes.status === "fulfilled" && stageRes.value?.success
          ? stageRes.value.data
          : null;

      let assessmentsPassed = mapStageStatusToPassed(stageStatus);
      if (isCapacityDevUnlock() && !assessmentsPassed.includes("T1")) {
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

      setUserProgress({
        completedCourses,
        completedStages,
        tracksCompleted,
        assessmentsPassed,
        currentCourse: localStorage.getItem("smaart_last_watched_course"),
        stageStatus,
        enrollmentProgress: enrollments.map((e) => ({
          courseId: e.course?._id || e.course,
          courseCode: e.course?.courseCode,
          progress: e.progress || 0,
          status: e.status,
        })),
      });
    } catch (err) {
      console.warn("[useSmaartCourseProgress] load failed:", err);
      setUserProgress({
        ...emptyProgress,
        completedCourses: getCompletedCourseIds(),
        assessmentsPassed: [],
      });
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
