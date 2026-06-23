const getUserId = () => {
  try {
    const u = JSON.parse(sessionStorage.getItem('user') || 'null');
    return u?._id || u?.id || 'anon';
  } catch {
    return 'anon';
  }
};

const getCompletedKey = () => `${getUserId()}_smaart_completed_courses`;

export const getCompletedCourseIds = () => {
  try {
    const raw = localStorage.getItem(getCompletedKey());
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
    localStorage.setItem(getCompletedKey(), JSON.stringify([...ids, courseId]));
  }
};

export const isCourseMarkedComplete = (courseId) => getCompletedCourseIds().includes(courseId);
