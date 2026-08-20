import { useState, useEffect } from 'react';
import apiCall, { coursesAPI, courseEnrollmentAPI } from '@/services/api';
import { assessmentApi } from '@/services/assessmentApi';
import { STAGE_1_COURSES, STAGE_2_COURSES, STAGE_3_COURSES, PIQ_TRACK, AIQ_TRACK, SQ_TRACK } from '@/data/courseStructureData';
import { compareCourseIds } from '@/utils/courseUnlock';
import { getCompletedCourseIds } from '@/utils/courseProgressStorage';

export const useLearningPaths = (userId) => {
  const [paths, setPaths] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [inProgressCourses, setInProgressCourses] = useState([]);
  const [nextCourse, setNextCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoading(true);
        setError(null);
        let resolvedPaths = [];

        // ── Fire independent API calls concurrently ────────────────────────────
        const [
          finalPathwayRes,
          statusRes,
          enrollmentResponse,
          allPublishedRes
        ] = await Promise.allSettled([
          // 1. Final Pathway
          apiCall('/career-agent/final-pathway'),

          // 2. Assessment Status
          userId ? assessmentApi.getStageStatus(userId) : Promise.resolve(null),

          // 3. Enrollments
          userId ? courseEnrollmentAPI.getByStudent(userId) : Promise.resolve(null),

          // 4. Published Courses (often needed for nextCourse)
          userId ? coursesAPI.getPublished() : Promise.resolve(null),
        ]);

        // ── Priority 1: Career Directions from Career Agent Analysis ──────────
        if (finalPathwayRes.status === 'fulfilled' && finalPathwayRes.value?.found && finalPathwayRes.value?.output_data) {
          const payload = finalPathwayRes.value;
          const analysis = payload.output_data;
          const input_data = payload.input_data;
          const preferences = input_data?.preferences || {};

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

          const primaryName = getDirectionName(analysis.primary, preferences.primary, 'smaart_pref_primary');
          const secondaryName = getDirectionName(analysis.secondary, preferences.secondary, 'smaart_pref_secondary');
          const tertiaryName = getDirectionName(analysis.tertiary, preferences.tertiary, 'smaart_pref_tertiary');

          const primarySub = getDirectionSubtitle(analysis.primary, preferences.primary);
          const secondarySub = getDirectionSubtitle(analysis.secondary, preferences.secondary);
          const tertiarySub = getDirectionSubtitle(analysis.tertiary, preferences.tertiary);

          let assessmentPct = 0;
          if (statusRes.status === 'fulfilled' && statusRes.value?.success && statusRes.value?.data) {
            const stages = Object.values(statusRes.value.data);
            const done = stages.filter((s) => s?.completed).length;
            assessmentPct = stages.length > 0 ? Math.round((done / stages.length) * 100) : 0;
          }

          const buildDirRoles = (roleData, fallbackTitle) => {
            const dir = roleData?.direction || {};
            const roles = (dir.roles || []).map(r => typeof r === 'string' ? r : (r.role || r.role_name)).filter(Boolean);
            if (roles.length === 0 && fallbackTitle) {
              roles.push(fallbackTitle);
            }
            return roles;
          };

          const careerPaths = [
            primaryName   && { id: 'primary',   title: primaryName,   subtitle: primarySub,   roles: buildDirRoles(analysis.primary, primaryName),   progress: assessmentPct, btnText: 'View Career Path', icon: getIconForDirection(primaryName),   color: 'blue',   locked: false, navigateTo: '/dashboard/career-agent?tab=primary' },
            secondaryName && { id: 'secondary', title: secondaryName, subtitle: secondarySub, roles: buildDirRoles(analysis.secondary, secondaryName), progress: assessmentPct, btnText: 'View Career Path', icon: getIconForDirection(secondaryName), color: 'indigo', locked: false, navigateTo: '/dashboard/career-agent?tab=secondary' },
            tertiaryName  && { id: 'tertiary',  title: tertiaryName,  subtitle: tertiarySub,  roles: buildDirRoles(analysis.tertiary, tertiaryName),  progress: assessmentPct, btnText: 'View Career Path', icon: getIconForDirection(tertiaryName),  color: 'amber',  locked: false, navigateTo: '/dashboard/career-agent?tab=tertiary' },
          ].filter(Boolean);

          if (careerPaths.length > 0) {
            resolvedPaths = careerPaths;
          }
        }

        // ── Priority 2: Enrolled Course Paths ────────────────────────────────
        let enrollmentList = [];
        if (enrollmentResponse.status === 'fulfilled' && enrollmentResponse.value) {
          enrollmentList = enrollmentResponse.value?.data || enrollmentResponse.value || [];

          if (enrollmentList && enrollmentList.length > 0) {
            const pathsData = await Promise.all(
              enrollmentList.map(async (enrollment) => {
                try {
                  let course = enrollment.course;
                  if (!course || typeof course !== 'object' || !course.title) {
                    const courseId = typeof course === 'string' ? course : course?._id;
                    const courseRes = await coursesAPI.getById(courseId);
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
                    navigateTo: `/dashboard/courses/${course.courseCode || course.courseNumber || course._id}/player`
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
              if (resolvedPaths.length === 0) {
                resolvedPaths = validPaths;
              }
            }

            // ── Build in-progress roadmap entries (max 5) ─────────────────
            const inProgressList = enrollmentList
              .filter(e => !['completed', 'dropped', 'suspended'].includes(e.status) && e.progress < 100)
              .slice(0, 5)
              .map(e => {
                const course = e.course; 
                if (!course || typeof course !== 'object') return null;

                const stages = [];
                if (course.modules && course.modules.length > 0) {
                  course.modules.forEach((mod, mIdx) => {
                    if (!mod.days) return;
                    const mProg = (e.moduleProgress || []).find(
                      mp => mp.module?.toString() === mod._id?.toString()
                    );
                    mod.days.forEach(day => {
                      const dayId = day.dayNumber || (day._id ? stages.length + 1 : stages.length + 1);
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
                  stages,
                  navigateTo: `/dashboard/courses/${course.courseCode || course.courseNumber || course._id}/player`
                };
              })
              .filter(Boolean)
              .sort((a, b) => (a.progress || 0) - (b.progress || 0));

            setInProgressCourses(inProgressList);
          }
        }

        // ── Derive Next Unseen Course from full sequence ───────────────
        const completedIds = new Set();
        enrollmentList.forEach(e => {
          const isComplete = e.status === 'completed' || (e.progress || 0) >= 100;
          if (isComplete) {
            const c = e.course;
            if (typeof c === 'object') {
              if (c.courseCode) completedIds.add(c.courseCode.toUpperCase());
              if (c._id) completedIds.add(c._id.toString());
              if (c.courseNumber) completedIds.add(c.courseNumber.toUpperCase());
            } else if (typeof c === 'string') {
              completedIds.add(c.toUpperCase());
            }
          }
        });
        // Use the user-scoped storage helper (not the raw legacy key) so a
        // completion marker from a different student on a shared/lab
        // computer can't leak into this user's "next course" computation.
        getCompletedCourseIds().forEach(id => completedIds.add(String(id).toUpperCase()));

        const FULL_SEQUENCE = [
          ...STAGE_1_COURSES,
          ...STAGE_2_COURSES,
          ...STAGE_3_COURSES,
          ...PIQ_TRACK,
          ...AIQ_TRACK,
          ...SQ_TRACK,
        ];

        const nextStatic = FULL_SEQUENCE.find(c => !completedIds.has(c.id.toUpperCase()));

        if (nextStatic) {
          try {
            const dbList = allPublishedRes.status === 'fulfilled' ? (allPublishedRes.value?.data || []) : [];
            const dbMatch = dbList.find(dc =>
              compareCourseIds(dc.courseCode, nextStatic.id) ||
              compareCourseIds(dc.courseNumber, nextStatic.id)
            );
            setNextCourse({
              id: dbMatch?._id || nextStatic.id,
              courseCode: dbMatch?.courseCode || nextStatic.id,
              title: dbMatch?.title || nextStatic.title,
              subtitle: dbMatch?.description || nextStatic.subtitle,
              progress: 0,
              navigateTo: dbMatch ? `/dashboard/courses/${dbMatch.courseCode || dbMatch.courseNumber || dbMatch._id}/player` : '/dashboard/courses',
            });
          } catch {
            setNextCourse({
              id: nextStatic.id,
              courseCode: nextStatic.id,
              title: nextStatic.title,
              subtitle: nextStatic.subtitle,
              progress: 0,
              navigateTo: '/dashboard/courses',
            });
          }
        } else {
          setNextCourse(null);
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

  return { paths, enrolledCourses, inProgressCourses, nextCourse, loading, error };
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
