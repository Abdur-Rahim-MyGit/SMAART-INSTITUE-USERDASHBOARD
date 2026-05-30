import React from "react";
import useUser from "@/hooks/useUser";
import {
  StudentAnalyticsView,
  CollegeAnalyticsView,
  AdminAnalyticsView
} from "@/components/AnalyticsCharts";

const Performance = () => {
  const { user, loading: userLoading } = useUser();

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#00152E]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#00152E] p-6 text-center">
        <div className="bg-white dark:bg-[#002A5C] p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 max-w-md">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please log in to view the Progression Analytics dashboard.</p>
        </div>
      </div>
    );
  }

  // Determine the correct analytics panel to display based on the user's role
  const renderAnalyticsView = () => {
    switch (user.role) {
      case "admin":
        return <AdminAnalyticsView />;
      case "college_admin":
      case "teacher":
        return <CollegeAnalyticsView />;
      case "student":
      default:
        return <StudentAnalyticsView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] font-sans transition-colors duration-300">
      <main className="p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Progression Analytics
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Visualizing course progression, student participation, and institutional performance insights.
              </p>
            </div>
          </div>

          {/* Render the role-specific view */}
          {renderAnalyticsView()}
        </div>
      </main>
    </div>
  );
};

export default Performance;
