import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, BookOpen, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CourseStructure from "@/components/CourseStructure";
import useUser from "@/hooks/useUser";
import { coursesAPI } from "@/services/api";

/* ─── Continue Watching Card ─── */
const ContinueWatchingCard = ({ course, progress, onResume }) => {
  const { t } = useTranslation();
  if (!course) return null;
  const pct = progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative rounded-[24px] overflow-hidden border border-gray-100/80 dark:border-[#1a3884]/25 bg-white dark:bg-[#002147] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.30)] mb-8 transition-colors duration-300"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#1a3884 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-blue-50/50 dark:from-[#1a3884]/10 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8">
        {/* Left: icon + info */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          {/* Play icon box */}
          <div className="w-16 h-16 rounded-2xl bg-[#1a3884]/8 dark:bg-[#1a3884]/20 border border-[#1a3884]/15 dark:border-[#1a3884]/30 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <BookOpen className="w-8 h-8 text-[#1a3884] dark:text-blue-300" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Label */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#1a3884] dark:text-blue-400">
                {t("my_courses_page.continue_watching")}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#1a3884]/30 dark:bg-blue-400/50" />
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("my_courses_page.pct_complete", { pct })}
              </span>
            </div>

            {/* Course title */}
            <h2 className="text-xl md:text-2xl font-extrabold text-[#112b6b] dark:text-white leading-tight mb-1" style={{ letterSpacing: "-0.02em" }}>
              {course.title || t("my_courses_page.your_current_course")}
            </h2>

            {/* Subtitle / last lesson */}
            {course.lastWatchedLesson && (
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {t("my_courses_page.last_watched")} <span className="text-[#1a3884] dark:text-slate-300 font-semibold">{course.lastWatchedLesson}</span>
              </p>
            )}

            {/* Progress bar */}
            <div className="mt-3 w-full max-w-xs">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#112b6b] to-[#1a3884] dark:from-blue-400 dark:to-blue-300"
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {t("my_courses_page.modules_count", { completed: course.completedModules || 0, total: course.totalModules || (course.modules?.length || 0) })}
                </span>
                {pct === 100 && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t("my_courses_page.completed")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Resume button */}
        <button
          onClick={onResume}
          className="flex items-center gap-3 px-6 py-3.5 bg-[#112b6b] hover:bg-[#1a3884] dark:bg-white text-white dark:text-[#112b6b] dark:hover:bg-white/90 font-extrabold text-sm rounded-xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex-shrink-0 whitespace-nowrap"
        >
          <Play className="w-4 h-4 fill-current text-white dark:text-[#112b6b]" />
          {t("my_courses_page.resume_course")}
          <ChevronRight className="w-4 h-4" />
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
  const [userProgress, setUserProgress] = useState({
    completedCourses: [],
    completedStages: [],
    tracksCompleted: [],
    assessmentsPassed: [],
    currentCourse: null,
  });

  /* Fetch last watched course from localStorage or API */
  useEffect(() => {
    const loadCurrentCourse = async () => {
      try {
        // 1. Check localStorage for last watched
        const lastWatched = localStorage.getItem("smaart_last_watched_course");
        const lastWatchedLesson = localStorage.getItem("smaart_last_watched_lesson");
        const lastProgress = parseInt(localStorage.getItem("smaart_course_progress") || "0", 10);

        if (lastWatched) {
          // Try to get full course details from API
          try {
            const response = await coursesAPI.getAll();
            const courses = response.data || response;
            if (Array.isArray(courses)) {
              const found = courses.find(
                (c) => (c._id || c.id) === lastWatched
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
                setCurrentProgress(pct);
                setUserProgress((prev) => ({
                  ...prev,
                  currentCourse: found._id || found.id,
                }));
                return;
              }
            }
          } catch (e) {
            console.warn("API fetch failed, using localStorage only");
          }

          // Fallback: show minimal info from localStorage
          setCurrentCourse({
            _id: lastWatched,
            title: localStorage.getItem("smaart_last_watched_title") || t("my_courses_page.your_course"),
            lastWatchedLesson: lastWatchedLesson || null,
            completedModules: 0,
            totalModules: 0,
          });
          setCurrentProgress(lastProgress);
        } else {
          // No localStorage — try fetching first course from API
          const response = await coursesAPI.getAll();
          const courses = response.data || response;
          if (Array.isArray(courses) && courses.length > 0) {
            const first = courses[0];
            setCurrentCourse({
              ...first,
              lastWatchedLesson: null,
              completedModules: 0,
              totalModules: (first.modules || []).length,
            });
            setCurrentProgress(0);
          }
        }
      } catch (e) {
        console.warn("Could not load current course:", e);
      }
    };

    loadCurrentCourse();
  }, [t]);

  const handleCourseClick = (courseId) => {
    navigate(`/dashboard/courses/${courseId}/player`);
  };

  const handleResume = () => {
    const id = currentCourse?._id || currentCourse?.id;
    if (id) {
      navigate(`/dashboard/courses/${id}/player`);
    }
  };

  return (
    <div>
      {/* Existing Course Structure (three career direction cards + stages) */}
      <CourseStructure
        onCourseClick={handleCourseClick}
        userProgress={userProgress}
        user={user}
        continueWatching={
          currentCourse && (
            <ContinueWatchingCard
              course={currentCourse}
              progress={currentProgress}
              onResume={handleResume}
            />
          )
        }
      />
    </div>
  );
};

export default MyCourses;
