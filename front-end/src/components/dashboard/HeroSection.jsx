import { memo } from "react";
import { motion } from "framer-motion";
import { ANIMATION_DELAYS, ANIMATION_DURATIONS } from "@/constants/dashboard";
import { Sparkles } from "lucide-react";

const HeroSection = memo(({ userName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.SLOW, ease: "easeOut" }}
      className="relative w-full py-8 px-6 sm:py-12 sm:px-10 rounded-3xl shadow-[0_8px_30px_rgba(26,56,132,0.12)] text-center overflow-hidden bg-gradient-to-r from-[#002147] via-[#0a235c] to-[#1a3884]"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: ANIMATION_DELAYS.HERO, type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/20"
      >
        <Sparkles className="w-6 h-6 text-blue-200" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ANIMATION_DELAYS.HERO + 0.1, duration: ANIMATION_DURATIONS.NORMAL }}
        className="relative z-10 text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4"
        style={{ letterSpacing: "-0.02em" }}
      >
        Welcome Back, <span className="text-blue-200">{userName || "User"}</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ANIMATION_DELAYS.SUBTITLE, duration: ANIMATION_DURATIONS.NORMAL }}
        className="relative z-10 text-blue-100/90 text-[15px] md:text-lg font-medium max-w-2xl mx-auto leading-relaxed"
      >
        Ready to take the next step in your career journey? Let's keep moving forward.
      </motion.p>
    </motion.div>
  );
});

export default HeroSection;
