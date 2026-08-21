import { useState, useEffect, useMemo } from "react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/dashboard/HeroSection";
import LearningProgress from "@/components/dashboard/LearningProgress";
import CareerPathsWidget from "@/components/dashboard/CareerPathsWidget";
import ActiveSkillsWidget from "@/components/dashboard/ActiveSkillsWidget";

import useUser from "@/hooks/useUser";
import { useLearningPaths } from "@/hooks/useLearningPaths";
import useSmaartCourseProgress from "@/hooks/useSmaartCourseProgress";
import { isCapacityDevUnlock, compareCourseIds } from "@/utils/courseUnlock";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";
import CollegeBanners from "@/components/CollegeBanners";
import { RiAlertLine } from "@remixicon/react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { clearCareerAgentStorage } from "@/contexts/UserContextFixed";

const DashboardHome = () => {
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
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (location.state?.assessmentAutoSubmitted) {
      toast({
        title: t("dashboard.assessment_submitted_title", "Assessment Auto-Submitted"),
        description: t("dashboard.assessment_submitted_desc", "Your assessment was automatically submitted due to repeated tab switching."),
        variant: "destructive",
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, toast, navigate, t, location.pathname]);

  const { paths, enrolledCourses, inProgressCourses, nextCourse, loading: pathsLoading } = useLearningPaths(user?._id);
  const { userProgress, loading: progressLoading, refresh: refreshProgress } = useSmaartCourseProgress(user?._id || user?.id);

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
  const [showVisionSplash, setShowVisionSplash] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('visionSplashShown');
    if (!hasSeenSplash) setShowVisionSplash(true);
  }, []);

  useEffect(() => {
    // If loading is finished and user is still null, redirect to login
    if (!userLoading && !user) {
      if (import.meta.env.DEV) console.warn('[DashboardHome] No authenticated user found, redirecting to login');
      navigate('/');
      return;
    }

    if (user && !userLoading) {
      if (import.meta.env.DEV) console.log('[DashboardHome] User loaded, setting dashboard loading to false');
      setDashboardLoading(false);
    }
  }, [user, userLoading, navigate]);

  // Timeout fallback for unresponsive API or stuck loading state
  useEffect(() => {
    let timeout;
    // Only set timeout if we are actually waiting for data and have an active session intent
    const hasToken = sessionStorage.getItem('token');
    if ((userLoading || dashboardLoading) && hasToken) {
      if (import.meta.env.DEV) console.log(`[DashboardHome] Setting timeout for userLoading:${userLoading}, dashboardLoading:${dashboardLoading}`);
      timeout = setTimeout(() => {
        if (import.meta.env.DEV) console.warn('[DashboardHome] Loading timeout reached - showing connection error screen');
        setLoadingError(true);
      }, 30000); // 30 seconds max wait
    }
    return () => clearTimeout(timeout);
  }, [userLoading, dashboardLoading]);

  const handleVisionSplashComplete = () => {
    setShowVisionSplash(false);
    sessionStorage.setItem('visionSplashShown', 'true');
  };

  if ((userLoading || dashboardLoading) && !loadingError) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-[#F8FAFC] dark:bg-[#00152E] animate-pulse">
        {/* Skeleton Hero */}
        <div className="w-full h-32 sm:h-40 bg-slate-200 dark:bg-[#002147] rounded-3xl" />

        {/* Skeleton Banners */}
        <div className="w-full h-48 sm:h-64 lg:h-80 bg-slate-200 dark:bg-[#002147] rounded-3xl" />

        {/* Skeleton Progress */}
        <div className="w-full h-40 bg-slate-200 dark:bg-[#002147] rounded-3xl" />

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full h-24 bg-slate-200 dark:bg-[#002147] rounded-3xl" />
          <div className="w-full h-24 bg-slate-200 dark:bg-[#002147] rounded-3xl" />
          <div className="w-full h-24 bg-slate-200 dark:bg-[#002147] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#00152E] p-6 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <RiAlertLine className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connection Issues?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          We're having trouble loading your dashboard. This could be due to a slow connection or an expired session.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              let userId = 'anon';
              try {
                const u = JSON.parse(sessionStorage.getItem('user') || 'null');
                if (u) userId = u._id || u.id || 'anon';
              } catch { }

              sessionStorage.clear();
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              clearCareerAgentStorage(userId);
              window.location.href = '/';
            }}
            className="px-6 py-2.5 bg-white dark:bg-[#002147] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-all"
          >
            Logout & Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <PageTransition>
        {/* Student Onboarding */}
        {!showVisionSplash && user && (
          <StudentOnboarding user={user} />
        )}

        {/* Dashboard Layout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, staggerChildren: 0.15 }}
          className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 lg:p-6 pb-10 min-h-screen bg-transparent transition-colors duration-300 relative overflow-hidden"
        >
          {/* Animated Constellation Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
          </div>

          {/* Ambient mesh glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-[#1a3884]/5 via-blue-500/5 to-transparent rounded-full blur-[120px] dark:from-blue-900/10" />
            <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent rounded-full blur-[120px] dark:from-indigo-900/10" />
          </div>

          <div className="relative z-10 flex flex-col gap-4 sm:gap-6 w-full">
            {/* ── FULL WIDTH TOP: Hero & Banners ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full space-y-4 sm:space-y-6"
            >
              {/* Hero */}
              <HeroSection
                userName={user?.firstName || user?.fullName || "User"}
                pendingAssessment={pendingAssessment}
                paths={(() => {
                  const incomplete = (list) => (list || []).filter(c => (c.progress || 0) < 100);
                  // 1. In-progress enrolled courses (progress > 0 and < 100) — highest priority
                  if (incomplete(inProgressCourses).length > 0) return incomplete(inProgressCourses);
                  // 2. Next unseen course from the full sequence (course not yet completed)
                  if (nextCourse) return [nextCourse];
                  // 3. Enrolled incomplete courses
                  if (incomplete(enrolledCourses).length > 0) return incomplete(enrolledCourses);
                  // 4. All done — show last completed
                  return enrolledCourses?.length > 0 ? enrolledCourses : paths;
                })()}
                pathsLoading={pathsLoading || progressLoading}
              />

              {/* College Banners */}
              <CollegeBanners />
            </motion.div>

            {/* ── BOTTOM TWO COLUMNS: Pathways & Calendar ── */}
            <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
              {/* ── LEFT: Career Pathways ── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-6"
              >
                <CareerPathsWidget paths={paths} loading={pathsLoading} />
                <ActiveSkillsWidget userEmail={user?.email} paths={paths} />
              </motion.div>

              {/* ── RIGHT: Calendar + Tasks ── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="w-full xl:w-[300px] 2xl:w-[340px] shrink-0 self-start"
              >
                {/* Section heading — same style as MY CAREER PATHS */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-[3px] h-4 rounded-full bg-[#1a3884] dark:bg-blue-500 shrink-0" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    My Activities
                  </h2>
                </div>
                <LearningProgress />
              </motion.div>
            </div>
          </div>

        </motion.div>
      </PageTransition>
    </ErrorBoundary>
  );
};

export default DashboardHome;


