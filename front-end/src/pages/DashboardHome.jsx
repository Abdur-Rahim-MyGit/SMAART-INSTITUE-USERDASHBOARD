import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/dashboard/HeroSection";
import LearningProgress from "@/components/dashboard/LearningProgress";
import useUser from "@/hooks/useUser";
import { useLearningPaths } from "@/hooks/useLearningPaths";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";
import CollegeBanners from "@/components/CollegeBanners";
import VisionGoalsWidget from "@/components/dashboard/VisionGoalsWidget";
import { AlertCircle } from "lucide-react";
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
      <div className="min-h-screen p-4 sm:p-8 space-y-8 bg-[#f8fafc] dark:bg-slate-950 animate-pulse">
        {/* Skeleton Hero */}
        <div className="w-full h-32 sm:h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        
        {/* Skeleton Banners */}
        <div className="w-full h-48 sm:h-64 lg:h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        
        {/* Skeleton Progress */}
        <div className="w-full h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-6 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connection Issues?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          We're having trouble loading your dashboard. This could be due to a slow connection or an expired session.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gradient-to-r from-[#1a3884] to-[#4c6ef5] text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Try Again
          </button>
          <button 
            onClick={() => {
              sessionStorage.clear();
              localStorage.clear();
              window.location.href = '/';
            }}
            className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-semibold hover:bg-slate-50 transition-all"
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
      {/* Vision Board Splash Overlay - Temporarily Hidden */}
      {/* 
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )} 
      */}
      
      {/* Student Onboarding */}
      {!showVisionSplash && user && (
        <StudentOnboarding user={user} />
      )}

      {/* Main Dashboard Layout with increased spacing */}
      <div className="space-y-8 pb-10">
        {/* Hero Section */}
        <HeroSection 
          userName={user?.firstName || user?.fullName?.split(' ')[0] || "User"} 
        />

        {/* Vision Goals Widget - Temporarily Hidden per request */}
        {/* <VisionGoalsWidget /> */}

        {/* College Banners */}
        <CollegeBanners />

        {/* Learning Progress Section */}
        <LearningProgress 
          paths={paths} 
          loading={pathsLoading} 
          error={pathsError} 
        />

      </div>
    </PageTransition>
    </ErrorBoundary>
  );
};

export default DashboardHome;


