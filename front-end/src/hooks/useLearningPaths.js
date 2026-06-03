import { useState, useEffect } from 'react';
import { coursesAPI, courseEnrollmentAPI } from '@/services/api';
import { assessmentApi } from '@/services/assessmentApi';

export const useLearningPaths = (userId) => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoading(true);
        setError(null);

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
            // Only reflect paths in dashboard if the user has explicitly locked them
            if (payload.found && payload.is_locked && payload.output_data) {
              const analysis = payload.output_data;
              const input_data = payload.input_data;
              const preferences = input_data?.preferences || {};

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

              const careerPaths = [
                primaryName   && { id: 'primary',   title: primaryName,   subtitle: primarySub,   progress: assessmentPct, btnText: 'View Career Path', icon: getIconForDirection(primaryName),   color: 'blue',   navigateTo: '/dashboard/career-agent' },
                secondaryName && { id: 'secondary', title: secondaryName, subtitle: secondarySub, progress: assessmentPct, btnText: 'View Career Path', icon: getIconForDirection(secondaryName), color: 'indigo', navigateTo: '/dashboard/career-agent' },
                tertiaryName  && { id: 'tertiary',  title: tertiaryName,  subtitle: tertiarySub,  progress: assessmentPct, btnText: 'View Career Path', icon: getIconForDirection(tertiaryName),  color: 'amber',  navigateTo: '/dashboard/career-agent' },
              ].filter(Boolean);

              if (careerPaths.length > 0) {
                setPaths(careerPaths);
                setLoading(false);
                return;
              }
            }
          }
        } catch (caErr) {
          console.log('[useLearningPaths] Career analysis fetch failed, trying enrolled courses:', caErr.message);
        }

        // ── Priority 2: Enrolled Course Paths ────────────────────────────────
        if (userId) {
          try {
            const enrollments = await courseEnrollmentAPI.getByStudent(userId);

            if (enrollments && enrollments.length > 0) {
              const pathsData = await Promise.all(
                enrollments.map(async (enrollment) => {
                  try {
                    const course = await coursesAPI.getById(enrollment.course);
                    return {
                      id: course._id,
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
                setPaths(validPaths);
                setLoading(false);
                return;
              }
            }
          } catch (apiErr) {
            console.log('[useLearningPaths] Enrollment fetch failed:', apiErr.message);
          }
        }

        // ── Priority 3: Empty state — no courses or career analysis yet ──────
        setPaths([]);
      } catch (err) {
        console.error('Error in fetchLearningPaths:', err);
        setPaths([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPaths();
  }, [userId]);

  return { paths, loading, error };
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
