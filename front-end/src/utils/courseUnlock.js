import { STAGES, TRACKS } from "@/data/courseStructureData";

/**
 * When true, stages/courses follow T1–T4 and prerequisite rules.
 */
export const ENFORCE_PROGRESSION_GATES = false;

/** Set via enableCapacityDevUnlock() — local to this browser only (quiz / Capacity testing). */
export const CAPACITY_DEV_UNLOCK_KEY = "smaart_dev_unlock_capacity";

export const isCapacityDevUnlock = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CAPACITY_DEV_UNLOCK_KEY) === "1";
};

export const enableCapacityDevUnlock = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CAPACITY_DEV_UNLOCK_KEY, "1");
};

export const hasPassedBaseline = (userProgress) =>
  isCapacityDevUnlock() ||
  (userProgress?.assessmentsPassed || []).includes("T1");

const strictStageUnlocked = (stage, userProgress) => {
  const passed = userProgress?.assessmentsPassed || [];
  const completed = userProgress?.completedCourses || [];

  if (stage.id === 1) {
    return passed.includes("T1");
  }

  if (stage.id === 2) {
    return passed.includes("T2") && completed.includes(stage.unlockAfter || "S10");
  }

  if (stage.id === 3) {
    return passed.includes("T3") && completed.includes(stage.unlockAfter || "S19");
  }

  return false;
};

const strictTrackUnlocked = (track, userProgress) => {
  const completed = userProgress?.completedCourses || [];
  if (!track.unlockAfter) return true;
  return completed.includes(track.unlockAfter);
};

const strictCourseUnlockedInStage = (courseId, stage, userProgress) => {
  if (!strictStageUnlocked(stage, userProgress)) return false;

  const courseIndex = stage.courses.findIndex((c) => c.id === courseId);
  if (courseIndex <= 0) return true;

  const previousCourse = stage.courses[courseIndex - 1];
  return (userProgress?.completedCourses || []).includes(previousCourse.id);
};

const strictCourseUnlockedInTrack = (courseId, track, userProgress) => {
  if (!strictTrackUnlocked(track, userProgress)) return false;

  const courseIndex = track.courses.findIndex((c) => c.id === courseId);
  if (courseIndex <= 0) return true;

  const previousCourse = track.courses[courseIndex - 1];
  return (userProgress?.completedCourses || []).includes(previousCourse.id);
};

export const isStageUnlocked = (stage, userProgress) =>
  ENFORCE_PROGRESSION_GATES ? strictStageUnlocked(stage, userProgress) : true;

export const isTrackUnlocked = (track, userProgress) =>
  ENFORCE_PROGRESSION_GATES ? strictTrackUnlocked(track, userProgress) : true;

export const isCourseUnlockedInStage = (courseId, stage, userProgress) =>
  ENFORCE_PROGRESSION_GATES
    ? strictCourseUnlockedInStage(courseId, stage, userProgress)
    : true;

/** Whether the learner may open this course (e.g. resume banner). */
export const canAccessCourse = (courseId, userProgress) => {
  if (!courseId) return false;
  if (!ENFORCE_PROGRESSION_GATES) return true;
  if (!hasPassedBaseline(userProgress)) return false;

  for (const stage of STAGES) {
    if (stage.courses.some((c) => c.id === courseId)) {
      return strictCourseUnlockedInStage(courseId, stage, userProgress);
    }
  }

  for (const track of TRACKS) {
    if (track.courses.some((c) => c.id === courseId)) {
      return strictCourseUnlockedInTrack(courseId, track, userProgress);
    }
  }

  return true;
};

export const resolveStaticCourseTitle = (courseId) => {
  for (const stage of STAGES) {
    const match = stage.courses.find((c) => c.id === courseId);
    if (match) return match.title;
  }
  for (const track of TRACKS) {
    const match = track.courses.find((c) => c.id === courseId);
    if (match) return match.title;
  }
  return null;
};
