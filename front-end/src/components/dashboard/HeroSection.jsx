import { memo } from "react";
import { motion } from "framer-motion";
import { ANIMATION_DELAYS, ANIMATION_DURATIONS } from "@/constants/dashboard";
import { useNavigate } from "react-router-dom";

const HeroSection = memo(({ userName }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.SLOW, ease: "easeOut" }}
      className="relative w-full py-5 px-6 sm:py-6 sm:px-8 rounded-2xl shadow-sm overflow-hidden bg-gradient-to-r from-[#002147] via-[#0a235c] to-[#1a3884]"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.HERO, duration: ANIMATION_DURATIONS.NORMAL }}
          className="text-xl sm:text-2xl font-bold text-white tracking-tight"
        >
          {t("dashboard.welcome")}, <span className="text-blue-200">{userName || "User"}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAYS.SUBTITLE, duration: ANIMATION_DURATIONS.NORMAL }}
          className="text-blue-100/90 text-[13px] sm:text-sm font-medium mt-1 leading-relaxed max-w-2xl"
        >
          {t("dashboard.ready_message")}
        </motion.p>
      </div>
    </motion.div>
  );
});

export default HeroSection;
