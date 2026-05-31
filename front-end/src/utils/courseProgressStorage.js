const COMPLETED_KEY = "smaart_completed_courses";

export const getCompletedCourseIds = () => {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const markCourseCompleted = (courseId) => {
  if (!courseId) return;
  const ids = getCompletedCourseIds();
  if (!ids.includes(courseId)) {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...ids, courseId]));
  }
};

export const isCourseMarkedComplete = (courseId) => getCompletedCourseIds().includes(courseId);
