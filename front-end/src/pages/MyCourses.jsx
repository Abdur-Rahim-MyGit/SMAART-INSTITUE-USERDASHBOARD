import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  RiPlayFill,
  RiBookOpenLine,
  RiArrowRightSLine,
  RiTimeLine,
  RiCheckboxCircleLine,
} from "@remixicon/react";
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
} from "@/utils/courseUnlock";

const BANNER_STYLE = {
  background: "linear-gradient(135deg, #001835 0%, #002147 50%, #112b6b 100%)",
};

/* ─── Single My Courses hero (assessment → in-progress → completed) ─── */
const MyCoursesHeroBanner = ({
  mode,
  course,
  progress,
  onPrimaryAction,
  primaryLabel,
}) => {
  const { t } = useTranslation();
  const pct = progress || 0;

  const label =
    mode === "assessment"
      ? t("my_courses_page.assessment_recommended_short", "Recommended next step")
      : mode === "completed"
        ? t("my_courses_page.course_completed_short", "Course completed")
        : t("my_courses_page.continue_watching");

  const title =
    mode === "assessment"
      ? t("my_courses_page.complete_t1_title", "Complete your T1 Baseline Assessment")
      : course?.title || t("my_courses_page.your_current_course");

  const description =
    mode === "assessment"
      ? t(
          "my_courses_page.complete_t1_desc_open",
          "Finish the foundation assessment to personalize your path. All courses below remain available to browse and start anytime."
        )
      : mode === "completed"
        ? t(
            "my_courses_page.course_completed_desc",
            "You have completed this course and your baseline assessment. Explore the next lesson in your programme below."
          )
        : course?.lastWatchedLesson
          ? null
          : t("my_courses_page.resume_hint", "Pick up where you left off.");

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[24px] overflow-hidden border border-[#1a3884]/30 shadow-xl mb-8"
      style={BANNER_STYLE}
    >
      <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-[#1a3884]/25 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            {mode === "completed" ? (
              <RiCheckboxCircleLine className="w-8 h-8 text-emerald-400" />
            ) : (
              <RiBookOpenLine className="w-8 h-8 text-blue-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-300">
                {label}
              </span>
              {(mode === "in_progress" || mode === "completed") && (
                <>
                  <span className="w-1 h-1 rounded-full bg-blue-400/50" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("my_courses_page.pct_complete", { pct: mode === "completed" ? 100 : pct })}
                  </span>
                </>
              )}
            </div>

            <h2
              className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-1"
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h2>

            {description && (
              <p className="text-[13px] text-slate-300 font-medium max-w-xl leading-relaxed">
                {description}
              </p>
            )}

            {mode === "in_progress" && course?.lastWatchedLesson && (
              <p className="text-[13px] text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                <RiTimeLine className="w-3.5 h-3.5" />
                {t("my_courses_page.last_watched")}{" "}
                <span className="text-slate-300">{course.lastWatchedLesson}</span>
              </p>
            )}

            {(mode === "in_progress" || mode === "completed") && (
              <div className="mt-3 w-full max-w-xs">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mode === "completed" ? 100 : pct}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-300"
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {(course?.totalModules || course?.modules?.length) > 0
                      ? t("my_courses_page.modules_count", {
                          completed: course.completedModules || 0,
                          total: course.totalModules || course.modules.length,
                        })
                      : t("my_courses_page.pct_complete", {
                          pct: mode === "completed" ? 100 : pct,
                        })}
                  </span>
                  {mode === "completed" && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <RiCheckboxCircleLine className="w-3 h-3" />{" "}
                      {t("my_courses_page.completed")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onPrimaryAction}
          className="flex items-center gap-3 px-6 py-3.5 bg-white text-[#112b6b] font-extrabold text-sm rounded-xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex-shrink-0 whitespace-nowrap"
        >
          {mode === "in_progress" && <RiPlayFill className="w-4 h-4 fill-[#112b6b]" />}
          {primaryLabel}
          <RiArrowRightSLine className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
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
        const lastWatched = localStorage.getItem("smaart_last_watched_course");
        const lastWatchedLesson = localStorage.getItem("smaart_last_watched_lesson");
        const lastProgress = parseInt(localStorage.getItem("smaart_course_progress") || "0", 10);

        if (!lastWatched) {
          setCurrentCourse(null);
          setCurrentProgress(0);
          return;
        }

        try {
          const response = await coursesAPI.getPublished();
          const courses = response.data || [];
          if (Array.isArray(courses)) {
            const found = courses.find(
              (c) => c.courseCode === lastWatched || (c._id || c.id) === lastWatched
            );
            if (found) {
              const completedModules = (found.modules || []).filter(
                (m) => m.status === "completed"
              ).length;
              const totalModules = (found.modules || []).length;
              const pct =
                totalModules > 0
                  ? Math.round((completedModules / totalModules) * 100)
                  : lastProgress;

              setCurrentCourse({
                ...found,
                lastWatchedLesson: lastWatchedLesson || null,
                completedModules,
                totalModules,
              });
              setCurrentProgress(pct || lastProgress);
              refreshProgress();
              return;
            }
          }
        } catch (e) {
          console.warn("API fetch failed, using localStorage only");
        }

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
  }, [t, refreshProgress]);

  useEffect(() => {
    const lastWatched = localStorage.getItem("smaart_last_watched_course");
    if (!lastWatched || !currentCourse) return;

    const storedProgress = parseInt(localStorage.getItem("smaart_course_progress") || "0", 10);
    if (userProgress.completedCourses?.includes(lastWatched)) {
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
    if (heroMode === "completed") {
      document.getElementById("my-courses-programme")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const id =
      currentCourse?.courseCode ||
      localStorage.getItem("smaart_last_watched_course") ||
      currentCourse?._id ||
      currentCourse?.id;
    if (id) navigate(`/dashboard/courses/${id}/player`);
  };

  return (
    <div>
      {quizTestCourse && isCapacityDevUnlock() && (
        <div className="px-4 sm:px-6 md:px-12 pt-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Quiz testing (this browser only)
              </p>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mt-1">
                {quizTestCourse.title} — admin micro-assessment loaded
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/dashboard/courses/${quizTestCourse.courseCode || quizTestCourse._id}/player`)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              Open quiz course
              <RiArrowRightSLine className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {heroMode && heroMode !== "assessment" && (
        <div className="px-4 sm:px-6 md:px-12 pt-6">
          <MyCoursesHeroBanner
            mode={heroMode}
            course={currentCourse}
            progress={currentProgress}
            onPrimaryAction={handlePrimaryClick}
            primaryLabel={primaryLabel}
          />
        </div>
      )}

      <div id="my-courses-programme">
        <CourseStructure
          onCourseClick={handleCourseClick}
          userProgress={userProgress}
          user={user}
          publishedCourseCodes={publishedCourseCodes}
        />
      </div>
    </div>
  );
};

export default MyCourses;
