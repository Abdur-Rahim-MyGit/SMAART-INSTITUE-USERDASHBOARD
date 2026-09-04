import { useEffect, useState, useMemo } from "react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
// Same Material Symbols barrel as the dashboard and profile -- not Tabler.
import { ArrowRight, BookOpen, Play } from "@/components/icons";
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
    <div className="flex w-full flex-col justify-between gap-3 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] px-4 py-3 sm:flex-row sm:items-center dark:border-white/10 dark:bg-[#072036]/60">
      {(mode === "in_progress" || mode?.startsWith("assessment") || mode === "completed") && (
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 text-left">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#072036] dark:text-[#A6D7E8]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#045C9A] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#045C9A] dark:bg-[#A6D7E8]" />
            </span>
            {mode?.startsWith("assessment")
              ? t("my_courses_page.next_step", "Next Step")
              : t("my_courses_page.continue_learning", "Continue Learning")}
          </span>
          <h3 className="truncate text-[13px] font-bold leading-snug tracking-tight text-[#072036] dark:text-white">
            {displayTitle}
          </h3>
        </div>
      )}
      <button
        type="button"
        onClick={onPrimaryAction}
        className="group flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#072036] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white"
      >
        {mode?.startsWith("assessment")
          ? <BookOpen className="w-3.5 h-3.5 shrink-0" />
          : <Play className="w-3.5 h-3.5 shrink-0" />}
        {primaryLabel || t("course_player.continue", "Continue")}
        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
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
    <PageTransition>
      {/* Same shell as DashboardHome: constellation texture, two ambient
          #045C9A glows, content on z-10. */}
      <div className="relative min-h-screen overflow-hidden bg-transparent transition-colors duration-300">
        {/* Constellation background — faded right down so it reads as a quiet
            texture instead of competing with the cards. */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
          <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
        </div>

        {/* Ambient mesh glows */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
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
    </PageTransition>
  );
};

export default MyCourses;
