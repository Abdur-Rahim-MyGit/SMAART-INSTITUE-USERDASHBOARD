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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] pb-24 selection:bg-[#002147]/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-8 hover:text-[#1a3884] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
        </button>

        {/* ── Header Section ────────────────────────────────────────────── */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#002147] to-[#003580] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0"
            >
              <Megaphone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div className="min-w-0">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl sm:text-2xl md:text-3xl font-black text-[#002147] dark:text-white tracking-tight leading-tight"
              >
                {t("community_page.title")}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mt-0.5 sm:mt-1"
              >
                <p className="text-gray-500 dark:text-slate-300 font-medium text-sm">
                  {t("community_page.subtitle")}
                </p>
              </motion.div>
            </div>
          </div>
        </div>

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
