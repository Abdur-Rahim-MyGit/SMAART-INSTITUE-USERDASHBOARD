import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/dashboard/HeroSection";
import LearningProgress from "@/components/dashboard/LearningProgress";
import CareerPathsWidget from "@/components/dashboard/CareerPathsWidget";

import useUser from "@/hooks/useUser";
import { useLearningPaths } from "@/hooks/useLearningPaths";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";
import CollegeBanners from "@/components/CollegeBanners";
import { RiAlertLine } from "@remixicon/react";
import { useTranslation } from "react-i18next";

const DashboardHome = () => {
  const { t } = useTranslation();
  const { user, loading: userLoading } = useUser();
  const { paths, loading: pathsLoading, error: pathsError } = useLearningPaths(user?._id);
  const [showVisionSplash, setShowVisionSplash] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('visionSplashShown');
    if (!hasSeenSplash) setShowVisionSplash(true);
  }, []);

  useEffect(() => {
    // If loading is finished and user is still null, redirect to login
    if (!userLoading && !user) {
      console.warn('[DashboardHome] No authenticated user found, redirecting to login');
      navigate('/');
      return;
    }

    if (user && !userLoading) {
      console.log('[DashboardHome] User loaded, setting dashboard loading to false');
      setDashboardLoading(false);
    }
  }, [user, userLoading, navigate]);

  // Timeout fallback for unresponsive API or stuck loading state
  useEffect(() => {
    let timeout;
    // Only set timeout if we are actually waiting for data and have an active session intent
    const hasToken = sessionStorage.getItem('token');
    if ((userLoading || dashboardLoading) && hasToken) {
      console.log(`[DashboardHome] Setting timeout for userLoading:${userLoading}, dashboardLoading:${dashboardLoading}`);
      timeout = setTimeout(() => {
        console.warn('[DashboardHome] Loading timeout reached - showing connection error screen');
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
      <div className="min-h-screen p-4 sm:p-8 space-y-8 bg-[#F8FAFC] dark:bg-[#00152E] animate-pulse">
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
              sessionStorage.clear();
              localStorage.clear();
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
        <div className="flex flex-col gap-6 pb-10">

          {/* ── FULL WIDTH TOP: Hero & Banners ── */}
          <div className="w-full space-y-6">
            {/* Hero */}
            <HeroSection
              userName={user?.firstName || user?.fullName || "User"}
              paths={paths}
              pathsLoading={pathsLoading}
            />

            {/* College Banners */}
            <CollegeBanners />
          </div>

          {/* ── BOTTOM TWO COLUMNS: Pathways & Calendar ── */}
          <div className="flex flex-col xl:flex-row gap-6">
            {/* ── LEFT: Career Pathways ── */}
            <div className="flex-1 min-w-0">
              <CareerPathsWidget paths={paths} loading={pathsLoading} />
            </div>

            {/* ── RIGHT: Calendar + Tasks ── */}
            <div className="w-full xl:w-[320px] 2xl:w-[360px] shrink-0">
              <div className="sticky top-24">
                <LearningProgress />
              </div>
            </div>
          </div>

        </div>
      </PageTransition>
    </ErrorBoundary>
  );
};

export default DashboardHome;


