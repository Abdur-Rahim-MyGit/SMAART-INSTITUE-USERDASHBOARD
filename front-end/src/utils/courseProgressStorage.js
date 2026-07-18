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
    const key = getCompletedKey();
    let raw = localStorage.getItem(key);
    
    // Migrate legacy data if the user-scoped key does not exist yet
    if (raw === null) {
      const legacyRaw = localStorage.getItem('smaart_completed_courses');
      if (legacyRaw) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw);
          if (Array.isArray(parsedLegacy)) {
            localStorage.setItem(key, legacyRaw);
            raw = legacyRaw;
          }
        } catch (e) {
          console.warn('Failed to parse legacy course completions:', e);
        }
      }
    }

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
