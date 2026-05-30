import { memo } from "react";
import { motion } from "framer-motion";
import { ANIMATION_DELAYS, ANIMATION_DURATIONS } from "@/constants/dashboard";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAvatar from "@/hooks/useAvatar";

const HeroSection = memo(({ userName }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { avatarData } = useAvatar();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.SLOW, ease: "easeOut" }}
      className="relative w-full py-6 px-6 sm:py-7 sm:px-8 rounded-[24px] overflow-hidden bg-white dark:bg-[#002147] shadow-xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-100/80 dark:border-[#1a3884]/20 transition-colors duration-300"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1a3884 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Glowing Blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 dark:bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-50 dark:bg-indigo-600/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex flex-wrap gap-2 mb-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#1a3884] dark:text-blue-400 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border border-blue-100/50 dark:border-blue-800/50 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a3884] dark:bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            {t("dashboard.active_session", "Active Session")}
          </motion.div>

          {avatarData?.milestone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm ${
                avatarData.milestone === 'Job-ready/Professional'
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : avatarData.milestone === 'Master'
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50'
                  : avatarData.milestone === 'Intermediate'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50'
                  : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                avatarData.milestone === 'Job-ready/Professional'
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : avatarData.milestone === 'Master'
                  ? 'bg-purple-500'
                  : avatarData.milestone === 'Intermediate'
                  ? 'bg-blue-500'
                  : 'bg-emerald-500'
              }`} />
              {avatarData.milestone}
            </motion.div>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.HERO, duration: ANIMATION_DURATIONS.NORMAL }}
          className="text-xl sm:text-2xl font-extrabold text-[#112b6b] dark:text-white tracking-tight leading-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          {t("dashboard.welcome")}, <span className="text-[#1a3884] dark:text-blue-400">{userName || "User"}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.SUBTITLE, duration: ANIMATION_DURATIONS.NORMAL }}
          className="text-gray-500 dark:text-slate-400 text-xs sm:text-[15px] font-medium mt-2 leading-relaxed max-w-2xl"
        >
          {t("dashboard.ready_message")}
        </motion.p>
      </div>
    </motion.div>
  );
});

export default HeroSection;
