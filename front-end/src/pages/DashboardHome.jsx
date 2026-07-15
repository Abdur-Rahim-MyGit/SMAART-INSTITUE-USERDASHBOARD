import { useState, useEffect, useMemo } from "react";
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

const DashboardHome = () => {
  const { t } = useTranslation();
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
              } catch {}

              sessionStorage.clear();
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              // Clear career agent and assessment keys (matching logout logic)
              const careerKeys = [
                'smaart_student_name', 'smaart_student_email', 'smaart_analysis',
                'smaart_analysis_id', 'smaart_pref_primary', 'smaart_pref_secondary',
                'smaart_pref_tertiary', 'smaart_onboarding_draft', 'smaart_user_degree',
                'smaart_user_specialisation', 'smaart_user_skills', 'smaart_user',
                'smaart_completed_courses', 'smaart_last_watched_course',
                'smaart_last_watched_title', 'smaart_last_watched_lesson',
                'smaart_course_progress', 'smaart_last_active', 'smaart_demo_progress',
                'smaart_capacity_dev_unlocked'
              ];
              careerKeys.forEach(k => {
                localStorage.removeItem(k);
                if (userId !== 'anon') {
                  localStorage.removeItem(`${userId}_${k}`);
                }
                Object.keys(localStorage).forEach((key) => {
                  if (key.endsWith(`_${k}`)) {
                    localStorage.removeItem(key);
                  }
                });
              });
              Object.keys(localStorage).forEach(k => {
                if (k.startsWith('course-notes-') || 
                    k.startsWith('passport_demo_') || 
                    k.startsWith('note_color_') ||
                    k.endsWith('_communityLastSeenCount')) {
                  localStorage.removeItem(k);
                }
              });
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
          className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 pb-10 min-h-screen bg-transparent transition-colors duration-300"
        >

          {/* ── FULL WIDTH TOP: Hero & Banners ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full space-y-4 sm:space-y-6"
          >
            {user && (!user.academic || !user.academic.overallCgpa || user.academic.overallCgpa === 0) && (
              <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 dark:from-[#001630] dark:to-[#001024] dark:border-blue-900/30">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                       <RiAlertLine size={20} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-[#0d1f4e] dark:text-white">Complete Your Academic Profile</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Please update your semester-wise CGPA. This will be automatically reflected in your ATS Resume.</p>
                    </div>
                 </div>
                 <button onClick={() => navigate('/dashboard/cgpa-calculator')} className="shrink-0 px-4 py-2 bg-[#1a3884] text-white text-xs font-bold rounded-xl hover:bg-[#112b6b] transition-colors shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                    Update CGPA Now
                 </button>
              </motion.div>
            )}

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
              className="w-full xl:w-[320px] 2xl:w-[360px] shrink-0"
            >
              <div className="xl:sticky xl:top-24">
                <LearningProgress />
              </div>
            </motion.div>
          </div>

        </motion.div>
      </PageTransition>
    </ErrorBoundary>
  );
};

export default DashboardHome;


