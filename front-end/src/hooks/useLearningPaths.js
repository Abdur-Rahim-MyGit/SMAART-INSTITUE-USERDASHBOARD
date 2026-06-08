import { useState, useEffect } from 'react';
import { coursesAPI, courseEnrollmentAPI } from '@/services/api';
import { assessmentApi } from '@/services/assessmentApi';

export const useLearningPaths = (userId) => {
  const [paths, setPaths] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [inProgressCourses, setInProgressCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoading(true);
        setError(null);
        let resolvedPaths = [];

        // ── Priority 1: Career Directions from Career Agent Analysis ──────────
        // Try to fetch the user's registered career directions from their final pathway
        try {
          const token = sessionStorage.getItem('token');
          const res = await fetch('/api/career-agent/final-pathway', {
            credentials: 'include',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const payload = await res.json();
            // If we found a final pathway, retrieve it and set its locked state
            if (payload.found && payload.output_data) {
              const analysis = payload.output_data;
              const input_data = payload.input_data;
              const preferences = input_data?.preferences || {};
              const isLocked = !payload.is_locked; // locked = true if the final pathway hasn't been finalized yet

              // Build direction name from analysis or from input_data preferences
              const getDirectionName = (analysisPath, prefPref, localKey) => {
                return (
                  localStorage.getItem(localKey) ||
                  analysisPath?.direction?.directionName ||
                  prefPref?.careerDirectionName ||
                  prefPref?.role ||
                  analysisPath?.tab1?.role_name ||
                  null
                );
              };

              const getDirectionSubtitle = (analysisPath, prefPref) => {
                return (
                  analysisPath?.direction?.directionDescription ||
                  analysisPath?.direction?.directionOverview ||
                  prefPref?.careerDirectionName ||
                  'Registered career direction'
                );
              };

              const primaryName   = getDirectionName(analysis.primary,   preferences.primary,   'smaart_pref_primary');
              const secondaryName = getDirectionName(analysis.secondary, preferences.secondary, 'smaart_pref_secondary');
              const tertiaryName  = getDirectionName(analysis.tertiary,  preferences.tertiary,  'smaart_pref_tertiary');

              const primarySub   = getDirectionSubtitle(analysis.primary,   preferences.primary);
              const secondarySub = getDirectionSubtitle(analysis.secondary, preferences.secondary);
              const tertiarySub  = getDirectionSubtitle(analysis.tertiary,  preferences.tertiary);

              // Build path cards only for valid directions
              let assessmentPct = 0;
              if (userId) {
                try {
                  const statusRes = await assessmentApi.getStageStatus(userId);
                  if (statusRes?.success && statusRes.data) {
                    const stages = Object.values(statusRes.data);
                    const done = stages.filter((s) => s?.completed).length;
                    assessmentPct = stages.length > 0 ? Math.round((done / stages.length) * 100) : 0;
                  }
                } catch {
                  /* keep 0 */
                }
              }

              const buildDirRoles = (roleData) => {
                const dir = roleData?.direction || {};
                return (dir.roles || []).map(r => typeof r === 'string' ? r : (r.role || r.role_name)).filter(Boolean);
              };

              const careerPaths = [
                primaryName   && { id: 'primary',   title: primaryName,   subtitle: primarySub,   roles: buildDirRoles(analysis.primary),   progress: assessmentPct, btnText: isLocked ? 'Unlock Career Path' : 'View Career Path', icon: getIconForDirection(primaryName),   color: 'blue',   locked: isLocked, navigateTo: '/dashboard/career-agent' },
                secondaryName && { id: 'secondary', title: secondaryName, subtitle: secondarySub, roles: buildDirRoles(analysis.secondary), progress: assessmentPct, btnText: isLocked ? 'Unlock Career Path' : 'View Career Path', icon: getIconForDirection(secondaryName), color: 'indigo', locked: isLocked, navigateTo: '/dashboard/career-agent' },
                tertiaryName  && { id: 'tertiary',  title: tertiaryName,  subtitle: tertiarySub,  roles: buildDirRoles(analysis.tertiary),  progress: assessmentPct, btnText: isLocked ? 'Unlock Career Path' : 'View Career Path', icon: getIconForDirection(tertiaryName),  color: 'amber',  locked: isLocked, navigateTo: '/dashboard/career-agent' },
              ].filter(Boolean);

              if (careerPaths.length > 0) {
                resolvedPaths = careerPaths;
              }
            }
          }
        } catch (caErr) {
          console.log('[useLearningPaths] Career analysis fetch failed:', caErr.message);
        }

        // ── Priority 2: Enrolled Course Paths ────────────────────────────────
        if (userId) {
          try {
            // API returns { success, count, data: [...] } — unwrap the data array
            const enrollmentResponse = await courseEnrollmentAPI.getByStudent(userId);
            const enrollmentList = enrollmentResponse?.data || enrollmentResponse || [];

            if (enrollmentList && enrollmentList.length > 0) {
              const pathsData = await Promise.all(
                enrollmentList.map(async (enrollment) => {
                  try {
                    // enrollment.course is already populated by the backend (has title, courseCode, etc.)
                    // Use the populated object directly; fall back to a fresh fetch if needed.
                    let course = enrollment.course;
                    if (!course || typeof course !== 'object' || !course.title) {
                      const courseId = typeof course === 'string' ? course : course?._id;
                      const courseRes = await coursesAPI.getById(courseId);
                      // coursesAPI.getById returns { success, data: course } — unwrap
                      course = courseRes?.data || courseRes;
                    }
                    return {
                      id: course._id,
                      courseCode: course.courseCode,
                      title: course.title,
                      subtitle: course.description || 'No description',
                      progress: enrollment.progress || 0,
                      btnText: 'Continue Path',
                      icon: getIconForCourse(course.category),
                      color: getColorForCourse(course.category),
                      enrollmentId: enrollment._id,
                      navigateTo: '/dashboard/courses'
                    };
                  } catch (err) {
                    console.error('Error fetching course details:', err);
                    return null;
                  }
                })
              );

              const validPaths = pathsData
                .filter(path => path !== null)
                .sort((a, b) => b.progress - a.progress);

              if (validPaths.length > 0) {
                setEnrolledCourses(validPaths);
                // Also set to paths if there are no career paths
                if (resolvedPaths.length === 0) {
                  resolvedPaths = validPaths;
                }
              }

              // ── Build in-progress roadmap entries (max 5) ─────────────────
              // Show any actively enrolled course that isn't fully completed or dropped
              console.log('[useLearningPaths] Raw enrollmentList statuses:', enrollmentList.map(e => ({ status: e.status, progress: e.progress, title: e.course?.title })));
              const inProgressList = enrollmentList
                .filter(e => !['completed', 'dropped', 'suspended'].includes(e.status) && e.progress < 100)
                .slice(0, 5)
                .map(e => {
                  const course = e.course; // already populated
                  if (!course || typeof course !== 'object') return null;

                  // Build a stages/steps array from course.modules[*].days
                  const stages = [];
                  if (course.modules && course.modules.length > 0) {
                    course.modules.forEach((mod, mIdx) => {
                      if (!mod.days) return;
                      const mProg = (e.moduleProgress || []).find(
                        mp => mp.module?.toString() === mod._id?.toString()
                      );
                      mod.days.forEach(day => {
                        const dayId = day.dayNumber || (day._id ? stages.length + 1 : stages.length + 1);
                        // Check if this day is completed
                        const videosDone = (mProg?.videoProgress || []).some(
                          vp => vp.dayId === dayId && vp.isCompleted
                        );
                        const tasksDone = (mProg?.completedTasks || []).some(
                          ct => ct.dayId === dayId
                        );
                        const isCompleted = videosDone || tasksDone;
                        const isInProgress = !isCompleted && mProg &&
                          ((mProg.videoProgress || []).some(vp => vp.dayId === dayId && vp.maxWatchedTime > 0));

                        stages.push({
                          id: `${mod._id}-${dayId}`,
                          label: day.title || day.moduleDetails?.title || `Session ${dayId}`,
                          dayId,
                          moduleTitle: mod.title || `Module ${mIdx + 1}`,
                          status: isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'locked'
                        });
                      });
                    });
                  }

                  return {
                    enrollmentId: e._id,
                    courseId: course._id,
                    courseCode: course.courseCode,
                    title: course.title,
                    progress: e.progress || 0,
                    status: e.status,
                    stages, // array of { id, label, dayId, moduleTitle, status }
                    navigateTo: '/dashboard/courses'
                  };
                })
                .filter(Boolean);

              setInProgressCourses(inProgressList);
            }
          } catch (apiErr) {
            console.log('[useLearningPaths] Enrollment fetch failed:', apiErr.message);
          }
        }

        setPaths(resolvedPaths);
      } catch (err) {
        console.error('Error in fetchLearningPaths:', err);
        setPaths([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPaths();
  }, [userId]);

  return { paths, enrolledCourses, inProgressCourses, loading, error };
};

export default useLearningPaths;

// ── Icon helpers ─────────────────────────────────────────────────────────────

// Icon for career directions — based on keywords in the direction name
const getIconForDirection = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('software') || n.includes('web') || n.includes('developer') || n.includes('engineering')) return 'Code';
  if (n.includes('data') || n.includes('analytics') || n.includes('database') || n.includes('ai') || n.includes('machine') || n.includes('ml')) return 'Database';
  if (n.includes('cloud') || n.includes('devops') || n.includes('infrastructure') || n.includes('network')) return 'Cloud';
  return 'BookOpen';
};

// Icon for enrolled courses — based on category
const getIconForCourse = (category) => {
  const iconMap = {
    'software': 'Code',
    'data': 'Database',
    'cloud': 'Cloud',
    'default': 'BookOpen'
  };
  return iconMap[category?.toLowerCase()] || iconMap.default;
};

// Color for enrolled courses — based on category
const getColorForCourse = (category) => {
  const colorMap = {
    'software': 'blue',
    'data': 'indigo',
    'cloud': 'amber',
    'default': 'blue'
  };
  return colorMap[category?.toLowerCase()] || colorMap.default;
};
