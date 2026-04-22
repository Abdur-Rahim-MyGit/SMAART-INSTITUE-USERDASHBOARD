import { useState, useEffect } from "react";
import PageTransition from "@/components/PageTransition";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/dashboard/HeroSection";
import LearningProgress from "@/components/dashboard/LearningProgress";
import EventsSection from "@/components/dashboard/EventsSection";
import ToolsStrip from "@/components/dashboard/ToolsStrip";
import useUser from "@/hooks/useUser";
import useLearningPaths from "@/hooks/useLearningPaths";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";
import CollegeBanners from "@/components/CollegeBanners";

const DashboardHome = () => {
  const { user, loading: userLoading } = useUser();
  const { paths, loading: pathsLoading, error: pathsError } = useLearningPaths(user?._id);
  const [showVisionSplash, setShowVisionSplash] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('visionSplashShown');
    if (!hasSeenSplash) setShowVisionSplash(true);
  }, []);

  useEffect(() => {
    if (user && !userLoading) setDashboardLoading(false);
  }, [user, userLoading]);

  const handleVisionSplashComplete = () => {
    setShowVisionSplash(false);
    sessionStorage.setItem('visionSplashShown', 'true');
  };

  if (userLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED] dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1a3884] rounded-none animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <PageTransition>
      {/* Vision Board Splash Overlay */}
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )}
      
      {/* Student Onboarding */}
      {!showVisionSplash && user && (
        <StudentOnboarding user={user} />
      )}

      <div className="space-y-6">
        {/* Hero Section */}
        <HeroSection 
          userName={user?.firstName || user?.fullName?.split(' ')[0] || "User"} 
        />

        {/* College Banners */}
        <CollegeBanners />

        {/* Learning Progress Section */}
        <LearningProgress 
          paths={paths} 
          loading={pathsLoading} 
          error={pathsError} 
        />

        {/* Events & Community Section */}
        <div className="flex flex-col gap-4">
          <EventsSection />
        </div>

        {/* Tools Strip */}
        <ToolsStrip />
      </div>
    </PageTransition>
    </ErrorBoundary>
  );
};

export default DashboardHome;


