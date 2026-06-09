import React from "react";
import { IconArrowLeft as ArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useUser from "@/hooks/useUser";
import {
  StudentAnalyticsView,
  CollegeAnalyticsView,
  AdminAnalyticsView
} from "@/components/AnalyticsCharts";

const Performance = () => {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    <div className="p-8 bg-transparent font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button - Mobile Only */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
              <ArrowLeft stroke={1.5} className="h-4 w-4" />
            </div>
            {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
          </button>
        </div>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
              Progression <span className="text-[#1a3884] dark:text-blue-300">Analytics</span>
            </h1>
            <p className="mt-1 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
              Visualizing course progression, student participation, and institutional performance insights.
            </p>
          </div>
        </div>

        {/* Render the role-specific view */}
        {renderAnalyticsView()}
      </div>
    </div>
  );
};

export default Performance;
