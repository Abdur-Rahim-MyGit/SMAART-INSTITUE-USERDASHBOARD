import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  IconPlayerPlayFilled as RiPlayFill,
  IconBook as RiBookOpenLine,
  IconChevronRight as RiArrowRightSLine,
  IconClock as RiTimeLine,
  IconCircleCheckFilled as RiCheckboxCircleLine,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CourseStructure from "@/components/CourseStructure";
import useUser from "@/hooks/useUser";
import useSmaartCourseProgress from "@/hooks/useSmaartCourseProgress";
import { coursesAPI } from "@/services/api";
import {
  enableCapacityDevUnlock,
  isCapacityDevUnlock,
  hasPassedBaseline,
  resolveStaticCourseTitle,
  compareCourseIds,
} from "@/utils/courseUnlock";
import { STAGE_1_COURSES, STAGE_2_COURSES, STAGE_3_COURSES, PIQ_TRACK, AIQ_TRACK, SQ_TRACK } from "@/data/courseStructureData";

/* ─── Single My Courses hero (assessment → in-progress → completed) ─── */
const MyCoursesHeroBanner = ({
  mode,
  course,
  onPrimaryAction,
  primaryLabel,
}) => {
  const { t } = useTranslation();

  const rawTitle =
    mode === "assessment"
      ? t("my_courses_page.complete_t1_title", "Complete your T1 Baseline Assessment")
      : course?.title || t("my_courses_page.your_current_course");

  const displayTitle = resolveStaticCourseTitle(rawTitle) || rawTitle;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {(mode === "in_progress" || mode === "assessment" || mode === "completed") && (
          <div className="flex flex-col text-left">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {mode === "assessment" ? "Next Step" : "Continue Learning"}
             </span>
             <span className="text-[13px] font-bold text-[#0d1f4e] dark:text-white truncate max-w-[200px] md:max-w-[250px]" title={displayTitle}>
                {displayTitle}
             </span>
          </div>
      )}
      <button
        type="button"
        onClick={onPrimaryAction}
        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a3884] hover:bg-[#112b6b] dark:bg-blue-500 text-white font-bold text-[13px] rounded-xl transition-all duration-300 flex-shrink-0 whitespace-nowrap shadow-sm active:scale-[0.98]"
      >
        {mode !== "assessment" && <RiPlayFill size={16} />}
        Continue
        <RiArrowRightSLine size={16} stroke={1.5} />
      </button>
    </div>
  );
};

/* ─── Main MyCourses Page ─── */
const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();

  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [publishedCourseCodes, setPublishedCourseCodes] = useState(null);
  const [quizTestCourse, setQuizTestCourse] = useState(null);
  const userId = user?._id || user?.id;
  const { userProgress, loading: progressLoading, refresh: refreshProgress } =
    useSmaartCourseProgress(userId);

  const lastWatchedId =
    currentCourse?.courseCode ||
    currentCourse?._id ||
    currentCourse?.id ||
    localStorage.getItem("smaart_last_watched_course");

  const isCourseComplete = useMemo(() => {
    if (!lastWatchedId) return false;
    return (
      currentProgress >= 100 ||
      userProgress.completedCourses?.includes(lastWatchedId)
    );
  }, [lastWatchedId, currentProgress, userProgress.completedCourses]);

  const heroMode = useMemo(() => {
    if (progressLoading) return null;
    const t1Done = hasPassedBaseline(userProgress);

    if (!t1Done) return "assessment";
    if (!currentCourse || !lastWatchedId) return null;
    if (isCourseComplete) return "completed";
    return "in_progress";
  }, [progressLoading, userProgress, lastWatchedId, currentCourse, isCourseComplete]);

  useEffect(() => {
    enableCapacityDevUnlock();
    refreshProgress();
  }, [refreshProgress]);

  useEffect(() => {
    const loadPublished = async () => {
      try {
        const response = await coursesAPI.getPublished();
        const list = response.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setPublishedCourseCodes(new Set(list.map((c) => c.courseCode)));

          if (isCapacityDevUnlock()) {
            const courseHasQuiz = (c) =>
              (c.modules || []).some(
                (m) =>
                  (m.microAssessments || []).some((ma) => (ma.questions || []).length > 0) ||
                  (m.days || []).some((d) =>
                    (d.steps || []).some(
                      (s) => s.type === "quiz" && (s.content?.questions || []).length > 0
                    )
                  )
              );

            let withQuiz = list.find(courseHasQuiz);
            if (!withQuiz) {
              for (const c of list.slice(0, 5)) {
                try {
                  const code = c.courseCode;
                  const detail = code
                    ? await coursesAPI.getByCode(code)
                    : c._id
                      ? await coursesAPI.getById(c._id)
                      : null;
                  if (detail?.data && courseHasQuiz(detail.data)) {
                    withQuiz = detail.data;
                    break;
                  }
                } catch {
                  /* try next */
                }
              }
            }
            if (withQuiz) setQuizTestCourse(withQuiz);
          }
        }
      } catch (e) {
        console.warn("Could not load published courses:", e);
      }
    };
    loadPublished();
  }, []);

  useEffect(() => {
    const loadCurrentCourse = async () => {
      try {
        let lastWatched = localStorage.getItem("smaart_last_watched_course");
        let lastWatchedLesson = localStorage.getItem("smaart_last_watched_lesson");
        let lastProgress = parseInt(localStorage.getItem("smaart_course_progress") || "0", 10);

        if (!lastWatched) {
          setCurrentCourse(null);
          setCurrentProgress(0);
          return;
        }

        const allCourses = [
          ...STAGE_1_COURSES,
          ...STAGE_2_COURSES,
          ...STAGE_3_COURSES,
          ...PIQ_TRACK,
          ...AIQ_TRACK,
          ...SQ_TRACK,
        ];

        // ── Step 1: Fetch course from DB first ─────────────────────────────
        let found = null;
        let allDbCourses = [];
        try {
          const response = await coursesAPI.getPublished();
          allDbCourses = response.data || [];
          if (Array.isArray(allDbCourses)) {
            found = allDbCourses.find(
              (c) => c.courseCode === lastWatched ||
                     (c._id || c.id) === lastWatched ||
                     compareCourseIds(c.courseCode, lastWatched) ||
                     compareCourseIds(c.courseNumber, lastWatched)
            );
          }
        } catch (e) {
          console.warn("API fetch failed, using localStorage only");
        }

        // ── Step 2: Check completion using ALL identifiers ─────────────────
        // This fixes format mismatches (e.g. localStorage has MongoDB _id,
        // but completedCourses only has course codes like "S07")
        const courseIdentifiers = [
          lastWatched,
          found?.courseCode,
          found?._id?.toString(),
          found?.courseNumber,
        ].filter(Boolean);

        const isCompleted = courseIdentifiers.some(id =>
          userProgress.completedCourses?.some(c => compareCourseIds(c, id))
        ) || (found && (userProgress.completedCourses || []).some(c =>
          compareCourseIds(c, found.courseCode) || compareCourseIds(c, found._id?.toString())
        ));

        // ── Step 3: Advance to next if completed ───────────────────────────
        if (isCompleted) {
          // Find position in static sequence using the found course's code
          const searchId = found?.courseCode || found?.courseNumber || lastWatched;
          const idx = allCourses.findIndex(c =>
            compareCourseIds(c.id, searchId) || compareCourseIds(c.id, lastWatched)
          );

          if (idx !== -1 && idx < allCourses.length - 1) {
            const nextCourseObj = allCourses[idx + 1];
            let nextId = nextCourseObj.id;

            // If original lastWatched was CRS-format, keep that format
            if (lastWatched.startsWith("CRS")) {
              const numPart = parseInt(nextId.replace(/\D/g, ''), 10);
              if (nextId.startsWith("S") && !isNaN(numPart)) {
                nextId = `CRS${String(numPart).padStart(5, '0')}`;
              } else if (nextId.startsWith("PIQ") && !isNaN(numPart)) {
                nextId = `CRS${String(25 + numPart).padStart(5, '0')}`;
              } else if (nextId.startsWith("AIQ") && !isNaN(numPart)) {
                nextId = `CRS${String(30 + numPart).padStart(5, '0')}`;
              } else if (nextId.startsWith("SQ") && !isNaN(numPart)) {
                nextId = `CRS${String(35 + numPart).padStart(5, '0')}`;
              }
            }

            // Try to resolve next course to its DB _id for direct navigation
            const nextDbCourse = allDbCourses.find(c =>
              compareCourseIds(c.courseCode, nextCourseObj.id) ||
              compareCourseIds(c.courseNumber, nextCourseObj.id) ||
              compareCourseIds(c.courseCode, nextId)
            );
            const resolvedNextId = nextDbCourse?._id?.toString() || nextDbCourse?.courseCode || nextId;

            // Advance localStorage to the next course
            localStorage.setItem("smaart_last_watched_course", resolvedNextId);
            localStorage.removeItem("smaart_last_watched_title");
            localStorage.setItem("smaart_course_progress", "0");
            lastWatched = resolvedNextId;
            lastProgress = 0;
            lastWatchedLesson = null;

            // Update found to the next course
            found = nextDbCourse || null;
          }
        }

        // ── Step 4: Show the resolved course ──────────────────────────────
        if (found) {
          const completedModules = (found.modules || []).filter(
            (m) => m.status === "completed"
          ).length;
          const totalModules = (found.modules || []).length;
          const pct = totalModules > 0
            ? Math.round((completedModules / totalModules) * 100)
            : lastProgress;

          setCurrentCourse({
            ...found,
            lastWatchedLesson: lastWatchedLesson || null,
            completedModules,
            totalModules,
          });
          setCurrentProgress(pct || lastProgress);
          return;
        }

        // ── Step 5: Fallback (no DB match) ─────────────────────────────────
        const staticTitle = resolveStaticCourseTitle(lastWatched);
        setCurrentCourse({
          _id: lastWatched,
          courseCode: lastWatched,
          title:
            staticTitle ||
            localStorage.getItem("smaart_last_watched_title") ||
            t("my_courses_page.your_course"),
          lastWatchedLesson: lastWatchedLesson || null,
          completedModules: 0,
          totalModules: 0,
        });
        setCurrentProgress(lastProgress);
      } catch (e) {
        console.warn("Could not load current course:", e);
      }
    };

    loadCurrentCourse();
  }, [t, refreshProgress, userProgress]);

  useEffect(() => {
    const lastWatched = localStorage.getItem("smaart_last_watched_course");
    if (!lastWatched || !currentCourse) return;

    const courseId = currentCourse?.courseCode || currentCourse?._id || currentCourse?.id;
    const storedProgress = parseInt(localStorage.getItem("smaart_course_progress") || "0", 10);
    // Only mark 100% if the *current displayed course* (not a past one) is completed
    if (courseId && userProgress.completedCourses?.some(c => compareCourseIds(c, courseId))) {
      setCurrentProgress(100);
    } else if (storedProgress > 0) {
      setCurrentProgress(storedProgress);
    }
  }, [userProgress.completedCourses, currentCourse]);

  const handleCourseClick = (courseId) => {
    navigate(`/dashboard/courses/${courseId}/player`);
  };

  const handleStartBaseline = () => {
    navigate("/dashboard/assessments/baseline");
  };

  const primaryLabel =
    heroMode === "assessment"
      ? t("my_courses_page.start_t1", "Start T1 Assessment")
      : heroMode === "completed"
        ? t("my_courses_page.explore_courses", "Explore courses")
        : t("my_courses_page.resume_course");

  const handlePrimaryClick = () => {
    if (heroMode === "assessment") {
      handleStartBaseline();
      return;
    }
    const id =
      currentCourse?.courseCode ||
      localStorage.getItem("smaart_last_watched_course") ||
      currentCourse?._id ||
      currentCourse?.id;
    if (id) navigate(`/dashboard/courses/${id}/player`);
  };

  const continueWatchingEl = heroMode && heroMode !== "assessment" ? (
    <MyCoursesHeroBanner
      mode={heroMode}
      course={currentCourse}
      progress={currentProgress}
      onPrimaryAction={handlePrimaryClick}
      primaryLabel={primaryLabel}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <div id="my-courses-programme">
        <CourseStructure
          onCourseClick={handleCourseClick}
          userProgress={userProgress}
          user={user}
          publishedCourseCodes={publishedCourseCodes}
          continueWatching={continueWatchingEl}
        />
      </div>
    </div>
  );
};

export default MyCourses;
