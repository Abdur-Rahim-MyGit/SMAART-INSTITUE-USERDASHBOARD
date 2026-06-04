import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Megaphone, Bell, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NoticesFeed from "@/components/community/NoticesFeed";

const Community = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize current user from session storage
  useEffect(() => {
    try {
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);
      }
    } catch (err) {
      console.warn("Community - No user data found in sessionStorage");
    }
  }, []);

  return (
    <div className="min-h-screen bg-transparent pb-24 selection:bg-[#002147]/20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Back Button - Mobile Only */}
        <div className="mb-4 md:hidden">
            <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#1a3884] transition-all"
            >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
            </div>
            {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
            </button>
        </div>

        {/* ── Standardized Header ── */}
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a3884]/10 dark:bg-blue-900/30">
                        <Megaphone className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
                    </div>
                    <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                        {t("community_page.title").split(' ')[0]} <span className="text-[#1a3884] dark:text-blue-300">{t("community_page.title").split(' ').slice(1).join(' ')}</span>
                    </h1>
                </div>
                <p className="mt-1 max-w-xl text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                    {t("community_page.subtitle")}
                </p>
            </div>
        </motion.div>

        {/* ── Main Noticeboard ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/40 dark:bg-[#002147] backdrop-blur-3xl rounded-[2rem] p-2 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 dark:border-white/10 relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10">
            <NoticesFeed currentUser={currentUser} />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Community;
