import { memo } from "react";
import { motion } from "framer-motion";
import { ANIMATION_DELAYS, ANIMATION_DURATIONS, COLORS } from "@/constants/dashboard";

const HeroSection = memo(({ userName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.SLOW, ease: "easeOut" }}
      className="w-full py-5 px-6 rounded-none shadow-2xl text-center"
      style={{ backgroundColor: COLORS.PRIMARY }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ANIMATION_DELAYS.HERO, duration: ANIMATION_DURATIONS.NORMAL }}
        className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3"
      >
        Welcome Back, {userName || "User"}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ANIMATION_DELAYS.SUBTITLE, duration: ANIMATION_DURATIONS.NORMAL }}
        className="text-blue-100 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed"
      >
        Ready to take the next step in your career journey? Let's keep moving forward.
      </motion.p>
    </motion.div>
  );
});

export default HeroSection;
