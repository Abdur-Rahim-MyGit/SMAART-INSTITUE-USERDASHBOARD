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
import { useLearningPaths } from "@/hooks/useLearningPaths";
import { coursesAPI } from "@/services/api";
import {
  enableCapacityDevUnlock,
  isCapacityDevUnlock,
  hasPassedBaseline,
  resolveStaticCourseTitle,
} from "@/utils/courseUnlock";

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

  const displayTitle =
    resolveStaticCourseTitle(rawTitle) ||
    resolveStaticCourseTitle(course?.id) ||
    resolveStaticCourseTitle(course?.courseCode) ||
    rawTitle;

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
        {primaryLabel || "Continue"}
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

  const [publishedCourseCodes, setPublishedCourseCodes] = useState(null);
  const [quizTestCourse, setQuizTestCourse] = useState(null);
  const userId = user?._id || user?.id;
  const { userProgress, loading: progressLoading, refresh: refreshProgress } =
    useSmaartCourseProgress(userId);
  const {
    enrolledCourses,
    inProgressCourses,
    nextCourse,
    loading: pathsLoading,
  } = useLearningPaths(userId);

  // Same course-selection logic as DashboardHome → HeroSection
  const activePath = useMemo(() => {
    const incomplete = (list) => (list || []).filter((c) => (c.progress || 0) < 100);
    let paths = [];
    if (incomplete(inProgressCourses).length > 0) paths = incomplete(inProgressCourses);
    else if (nextCourse) paths = [nextCourse];
    else if (incomplete(enrolledCourses).length > 0) paths = incomplete(enrolledCourses);
    else if (enrolledCourses?.length > 0) paths = enrolledCourses;

    return paths.length > 0
      ? (paths.find((p) => (p.progress || 0) < 100) ?? paths[0])
      : null;
  }, [inProgressCourses, nextCourse, enrolledCourses]);

  const heroMode = useMemo(() => {
    if (progressLoading || pathsLoading) return null;
    const t1Done = hasPassedBaseline(userProgress);

    if (!t1Done) return "assessment";
    if (!activePath) return null;
    if ((activePath.progress || 0) >= 100) return "completed";
    return "in_progress";
  }, [progressLoading, pathsLoading, userProgress, activePath]);

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
    if (activePath?.navigateTo) {
      navigate(activePath.navigateTo);
      return;
    }
    const id = activePath?.courseCode || activePath?.id;
    if (id) navigate(`/dashboard/courses/${id}/player`);
  };

  const continueWatchingEl = heroMode && heroMode !== "assessment" ? (
    <MyCoursesHeroBanner
      mode={heroMode}
      course={activePath}
      onPrimaryAction={handlePrimaryClick}
      primaryLabel={primaryLabel}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-transparent pb-8 transition-colors duration-300">
      <main id="my-courses-programme">
        <CourseStructure
          onCourseClick={handleCourseClick}
          userProgress={userProgress}
          user={user}
          publishedCourseCodes={publishedCourseCodes}
          continueWatching={continueWatchingEl}
        />
      </main>
    </div>
  );
};

export default MyCourses;
