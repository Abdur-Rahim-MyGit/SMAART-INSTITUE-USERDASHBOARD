import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import { ArrowLeft, RefreshCw } from "@/components/icons";
import NoticesFeed from "@/components/community/NoticesFeed";

const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-xs font-bold text-slate-600 transition-colors hover:border-[#045C9A]/30 hover:bg-[#EAF7FD] hover:text-[#045C9A] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const EASE = [0.25, 0.1, 0.25, 1];

const Community = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      const userStr = sessionStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch {
      // no session yet -- the feed still renders, reactions just won't be attributed
    }
  }, []);

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
        {/* Same ambient layer as the dashboard, courses and assessments pages */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
          <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
        </div>

        <main className="relative z-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
            {/* Back button -- mobile only */}
            <div className="flex items-center sm:hidden">
              <button type="button" onClick={() => navigate("/dashboard")} className="group flex w-fit items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:group-hover:border-[#045C9A]/40">
                  <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
                  {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                </span>
              </button>
            </div>

            {/* Page hero -- same structure and type scale as Courses / Assessments */}
            <motion.section
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={`relative w-full overflow-hidden rounded-2xl ${SURFACE}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
              <div className="relative z-10 flex flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <h1
                    className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {t("community_page.title", "Community Announcements")}
                  </h1>
                  <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                    {t("community_page.subtitle", "Official notices and updates from your institution")}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setRefreshTrigger((prev) => prev + 1)}
                    disabled={loading}
                    className={`${BTN_GHOST} h-9 w-full px-4 sm:w-auto`}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {t("common.refresh", "Refresh")}
                  </button>
                </div>
              </div>
            </motion.section>

            <NoticesFeed currentUser={currentUser} refreshTrigger={refreshTrigger} onLoadingChange={setLoading} />
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default Community;
