import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

const HeroSection = ({ onSignupClick, onLoginClick }) => {
  const { theme } = useTheme();

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-32 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:bg-none dark:bg-dark-card text-gray-900 dark:text-white transition-colors duration-500">
      {/* Dynamic Background */}
      <NeuralBackground theme={theme} />

      {/* Radiant Gradient Glows - Adjusted for Theme Visibility */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#1a3884] rounded-full blur-[120px] opacity-10 dark:opacity-25 animate-pulse-slow"></div>
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] bg-[#C0C0C0] rounded-full blur-[130px] opacity-5 dark:opacity-15"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] bg-gray-200 dark:bg-[#1a3884] rounded-full blur-[100px] opacity-50 dark:opacity-80"></div>
      </div>

      <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

          {/* Text Content - Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left max-w-xl"
          >

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a3884]/10 dark:bg-[#1a3884]/20 border border-[#1a3884]/30 dark:border-[#1a3884]/40 mb-12 backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1a3884] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1a3884]"></span>
              </span>
              <span className="text-sm font-semibold text-[#1a3884] dark:text-[#67e8f5] tracking-wide">Skills Passport Integration Live</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-8 font-heading leading-tight text-[#1a3884] dark:text-white"
            >
              An Integrated <br className="hidden sm:block" />
              <span className="text-3xl sm:text-4xl md:text-5xl block mt-2 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#1a3884] via-[#2a4d9e] to-[#C0C0C0] dark:from-blue-300 dark:via-blue-100 dark:to-yellow-300 drop-shadow-sm">
                Employability & Impact Ecosystem
              </span>
              <span className="text-xl sm:text-3xl text-gray-600 dark:text-gray-300 font-bold block mt-2">
                for the changing world of work.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
            >
              Responding to intelligent automation, job restructuring, and capability shift.
              <br />
              <span className="font-medium text-gray-800 dark:text-gray-100 mt-2 block sm:inline-block">
                One ecosystem | Multiple careers | Every sector
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10"
            >
              <button
                onClick={() => {
                  const element = document.getElementById('services');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#1a3884] to-[#132c6b] hover:from-[#132c6b] hover:to-[#0d1f4d] text-white rounded-xl font-bold text-base transition-all duration-300 shadow-[0_0_20px_rgba(26,56,132,0.3)] hover:shadow-[0_0_30px_rgba(26,56,132,0.5)] hover:-translate-y-1 w-full sm:w-auto overflow-hidden border border-[#C0C0C0]/50"
              >
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </div>
                <span className="relative flex items-center justify-center gap-2">
                  Explore Our Programmes
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                onClick={onLoginClick}
                className="group px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 backdrop-blur-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                Institution Demo
              </button>
            </motion.div>

            {/* Feature checkmarks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-sm text-gray-600 dark:text-gray-400 font-medium"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C0C0C0]" />
                <span>Holistic Skill Profiling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C0C0C0]" />
                <span>AI-Driven Career Pathways</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Illustration - Right Side (Glassmorphism Container) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex-1 w-full max-w-[650px] relative z-20"
          >
            {/* Abstract Glow behind image */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#1a3884] to-[#C0C0C0] opacity-30 dark:opacity-20 blur-xl rounded-2xl -z-10 animate-pulse-slow" />

            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#002147]/5 backdrop-blur-sm dark:bg-dark-card/40">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none z-10" />
              <img
                src={heroImage}
                alt="AI-Powered Student Career Development Platform"
                className="w-full h-auto transform scale-[1.01] object-cover"
              />
            </div>

            {/* Floating Info Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-8 bg-[#ffff]/90 dark:bg-dark-bg/80 backdrop-blur-md border border-gray-100 dark:border-white/10 p-4 rounded-xl shadow-xl hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a3884]/20 flex items-center justify-center text-[#1a3884] dark:text-[#67e8f5]">
                  <span className="font-bold">EQ</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Emotional Quotient</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">+14% Growth</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -top-6 -right-6 bg-[#ffff]/90 dark:bg-dark-bg/80 backdrop-blur-md border border-gray-100 dark:border-white/10 p-4 rounded-xl shadow-xl hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C0C0C0]/20 flex items-center justify-center text-[#C0C0C0]">
                  <span className="font-bold">AI</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Career Match</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">98% Accuracy</p>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section >
  );
};

export default HeroSection;


