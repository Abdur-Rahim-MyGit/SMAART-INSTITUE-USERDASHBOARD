import { STAGES, TRACKS } from "@/data/courseStructureData";

/**
 * When true, stages/courses follow T1–T4 and prerequisite rules.
 */
export const ENFORCE_PROGRESSION_GATES = true;

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

/**
 * Normalizes course ID from database-side format (e.g., 'CRS00001')
 * to front-end schema format (e.g., 'S01').
 */
export const normalizeCourseId = (courseId) => {
  if (!courseId) return "";
  if (!courseId.startsWith("CRS")) return courseId;
  const num = parseInt(courseId.replace(/\D/g, ""), 10);
  if (isNaN(num)) return courseId;
  if (num >= 1 && num <= 10) return `S${String(num).padStart(2, "0")}`;
  if (num >= 11 && num <= 19) return `S${num}`;
  if (num >= 20 && num <= 25) return `S${num}`;
  if (num >= 26 && num <= 30) return `PIQ${String(num - 25).padStart(2, "0")}`;
  if (num >= 31 && num <= 35) return `AIQ${String(num - 30).padStart(2, "0")}`;
  if (num >= 36 && num <= 40) return `SQ${String(num - 35).padStart(2, "0")}`;
  return courseId;
};

/**
 * Flexible check for course ID matching (supports both CRS00001 and S01).
 */
export const compareCourseIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return id1 === id2 || normalizeCourseId(id1) === normalizeCourseId(id2);
};

const strictStageUnlocked = (stage, userProgress) => {
  const passed = userProgress?.assessmentsPassed || [];
  const completed = userProgress?.completedCourses || [];

  if (stage.id === 1) {
    return true; // Stage 1 is unlocked by default so the user starts with S1 (S01)
  }

  if (stage.id === 2) {
    const unlockAfter = stage.unlockAfter || "S10";
    return passed.includes("T2") && completed.some(comp => compareCourseIds(comp, unlockAfter));
  }

  if (stage.id === 3) {
    const unlockAfter = stage.unlockAfter || "S19";
    return passed.includes("T3") && completed.some(comp => compareCourseIds(comp, unlockAfter));
  }

  return false;
};

const strictTrackUnlocked = (track, userProgress) => {
  const completed = userProgress?.completedCourses || [];
  if (!track.unlockAfter) return true;
  return completed.some(comp => compareCourseIds(comp, track.unlockAfter));
};

const strictCourseUnlockedInStage = (courseId, stage, userProgress) => {
  if (!strictStageUnlocked(stage, userProgress)) return false;

  const courseIndex = stage.courses.findIndex((c) => compareCourseIds(c.id, courseId));
  if (courseIndex <= 0) return true;

  const previousCourse = stage.courses[courseIndex - 1];
  const completed = userProgress?.completedCourses || [];
  return completed.some(comp => compareCourseIds(comp, previousCourse.id));
};

const strictCourseUnlockedInTrack = (courseId, track, userProgress) => {
  if (!strictTrackUnlocked(track, userProgress)) return false;

  const courseIndex = track.courses.findIndex((c) => compareCourseIds(c.id, courseId));
  if (courseIndex <= 0) return true;

  const previousCourse = track.courses[courseIndex - 1];
  const completed = userProgress?.completedCourses || [];
  return completed.some(comp => compareCourseIds(comp, previousCourse.id));
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

  // Stage 1 courses can be accessed without passing T1 baseline
  const isStage1Course = STAGES.find(s => s.id === 1)?.courses.some((c) => compareCourseIds(c.id, courseId));
  if (!isStage1Course && !hasPassedBaseline(userProgress)) return false;

  for (const stage of STAGES) {
    if (stage.courses.some((c) => compareCourseIds(c.id, courseId))) {
      return strictCourseUnlockedInStage(courseId, stage, userProgress);
    }
  }

  for (const track of TRACKS) {
    if (track.courses.some((c) => compareCourseIds(c.id, courseId))) {
      return strictCourseUnlockedInTrack(courseId, track, userProgress);
    }
  }

  return true;
};

export const resolveStaticCourseTitle = (courseId) => {
  for (const stage of STAGES) {
    const match = stage.courses.find((c) => compareCourseIds(c.id, courseId));
    if (match) return match.title;
  }
  for (const track of TRACKS) {
    const match = track.courses.find((c) => compareCourseIds(c.id, courseId));
    if (match) return match.title;
  }
  return null;
};
