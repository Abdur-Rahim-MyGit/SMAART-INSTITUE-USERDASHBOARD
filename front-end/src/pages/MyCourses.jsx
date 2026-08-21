import { useEffect, useState, useMemo } from "react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import {
  IconPlayerPlayFilled as RiPlayFill,
  IconChevronRight as RiArrowRightSLine,
} from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import CourseStructure from "@/components/CourseStructure";
import useUser from "@/hooks/useUser";
import useSmaartCourseProgress from "@/hooks/useSmaartCourseProgress";
import { useLearningPaths } from "@/hooks/useLearningPaths";
import { coursesAPI } from "@/services/api";
import {
  enableCapacityDevUnlock,
  isCapacityDevUnlock,
  resolveStaticCourseTitle,
  compareCourseIds,
} from "@/utils/courseUnlock";

/* ─── Single My Courses hero (assessment → in-progress → completed) ─── */
const MyCoursesHeroBanner = ({
  mode,
  course,
  onPrimaryAction,
  primaryLabel,
  pendingAssessment,
}) => {
  const { t } = useTranslation();

  let rawTitle = course?.title || t("my_courses_page.your_current_course");
  
  if (mode?.startsWith("assessment")) {
    if (pendingAssessment === "T1") rawTitle = t("my_courses_page.complete_t1_title", "Complete your T1 Baseline Assessment");
    else if (pendingAssessment === "T2") rawTitle = t("my_courses_page.complete_t2_title", "Complete your T2 Intermediate Assessment");
    else if (pendingAssessment === "T3") rawTitle = t("my_courses_page.complete_t3_title", "Complete your T3 Advanced Assessment");
    else if (pendingAssessment === "T4") rawTitle = t("my_courses_page.complete_t4_title", "Complete your T4 Final Assessment");
  }

  const displayTitle = mode?.startsWith("assessment") ? rawTitle :
    resolveStaticCourseTitle(rawTitle) ||
    resolveStaticCourseTitle(course?.id) ||
    resolveStaticCourseTitle(course?.courseCode) ||
    rawTitle;

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1f4e] dark:bg-[#071330] p-4 sm:px-5 sm:py-4 rounded-2xl border border-blue-900/40 dark:border-white/10 shadow-xl text-white">
      {(mode === "in_progress" || mode?.startsWith("assessment") || mode === "completed") && (
          <div className="flex-1 min-w-0 flex flex-col justify-center text-left pr-2 space-y-1">
             <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-widest">
                   {mode?.startsWith("assessment") ? t("my_courses_page.next_step", "Next Step") : t("my_courses_page.continue_learning", "Continue Learning")}
                </span>
             </div>
             <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug tracking-tight truncate max-w-full sm:max-w-md">
                {displayTitle}
             </h3>
          </div>
      )}
      <button
        type="button"
        onClick={onPrimaryAction}
        className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-white hover:bg-slate-100 text-[#0d1f4e] font-black text-xs sm:text-[13px] rounded-xl transition-all duration-300 flex-shrink-0 whitespace-nowrap shadow-md hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 border border-white"
      >
        {!mode?.startsWith("assessment") && <RiPlayFill size={18} className="text-[#0d1f4e] animate-pulse" />}
        <span className="text-[#0d1f4e]">{primaryLabel || t("course_player.continue", "Continue")}</span>
        <RiArrowRightSLine size={18} stroke={2.5} className="text-[#0d1f4e] group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

/* ─── Main MyCourses Page ─── */
const MyCourses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const { t } = useTranslation();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    setIsDarkTheme(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (location.state?.courseClosedByProctor) {
      toast({
        title: t("my_courses_page.course_closed_title", "Course Closed"),
        description: t("my_courses_page.course_closed_desc", "Your course session was automatically closed due to repeated tab switching."),
        variant: "destructive",
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, toast, navigate, t, location.pathname]);

  const [publishedCourseCodes, setPublishedCourseCodes] = useState(null);
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

  const pendingAssessment = useMemo(() => {
    if (!userProgress || progressLoading) return null;
    const completed = userProgress.completedCourses || [];
    const passed = userProgress.assessmentsPassed || [];
    
    // Check baseline T1
    if (!passed.includes("T1") && !isCapacityDevUnlock()) return "T1";
    // Check Stage 1 -> T2
    if (completed.some(c => compareCourseIds(c, "S10")) && !passed.includes("T2")) return "T2";
    // Check Stage 2 -> T3
    if (completed.some(c => compareCourseIds(c, "S19")) && !passed.includes("T3")) return "T3";
    // Check Stage 3 -> T4
    if (completed.some(c => compareCourseIds(c, "S25")) && !passed.includes("T4")) return "T4";
    
    return null;
  }, [userProgress, progressLoading]);

  const heroMode = useMemo(() => {
    if (progressLoading || pathsLoading) return null;

    if (pendingAssessment) return `assessment_${pendingAssessment}`;
    
    if (!activePath) return null;
    if ((activePath.progress || 0) >= 100) return "completed";
    return "in_progress";
  }, [progressLoading, pathsLoading, pendingAssessment, activePath]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  useEffect(() => {
    const loadPublished = async () => {
      try {
        const response = await coursesAPI.getPublished();
        const list = response.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setPublishedCourseCodes(new Set(list.map((c) => c.courseCode)));
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

  const primaryLabel =
    heroMode?.startsWith("assessment")
      ? t("my_courses_page.start_assessment_for", "Start {{stage}} Assessment", { stage: pendingAssessment })
      : heroMode === "completed"
        ? t("my_courses_page.explore_courses", "Explore courses")
        : t("my_courses_page.resume_course");

  const handlePrimaryClick = () => {
    if (heroMode?.startsWith("assessment")) {
      if (pendingAssessment === "T1") {
        navigate("/dashboard/assessments/baseline");
      } else {
        navigate(`/assessment/${pendingAssessment}`);
      }
      return;
    }
    if (activePath?.navigateTo) {
      navigate(activePath.navigateTo);
      return;
    }
    const id = activePath?.courseCode || activePath?.id;
    if (id) navigate(`/dashboard/courses/${id}/player`);
  };

  const continueWatchingEl = heroMode ? (
    <MyCoursesHeroBanner
      mode={heroMode}
      course={activePath}
      onPrimaryAction={handlePrimaryClick}
      primaryLabel={primaryLabel}
      pendingAssessment={pendingAssessment}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-transparent pb-8 transition-colors duration-300 relative">
      {/* Animated Constellation Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
      </div>

      {/* Subtle radial glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-[#1a3884]/5 via-blue-500/5 to-transparent rounded-full blur-[120px] dark:from-blue-900/10" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent rounded-full blur-[120px] dark:from-indigo-900/10" />
      </div>

      <main id="my-courses-programme" className="relative z-10">
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
