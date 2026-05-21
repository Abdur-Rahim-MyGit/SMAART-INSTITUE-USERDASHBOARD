import { motion } from "framer-motion";

/**
 * PageHero — Universal page banner component
 * Matches the DashboardHome HeroSection style exactly.
 * Use this on every dashboard page for consistent headers.
 *
 * Props:
 *  badge       - string  - small label above heading (e.g. "Learning Journey")
 *  title       - string  - main heading
 *  subtitle    - string  - description paragraph
 *  titleAccent - string  - optional portion of title to render in #1a3884 color
 *  accentFirst - bool    - if true, accent appears before main title text
 *  children    - node    - optional right-side content (stats, buttons, etc.)
 */
const PageHero = ({ badge, title, titleAccent, accentFirst = false, subtitle, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full py-6 px-6 sm:py-7 sm:px-8 rounded-[24px] overflow-hidden
        bg-white dark:bg-[#002147]
        shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.30)]
        border border-gray-100/80 dark:border-[#1a3884]/25
        transition-colors duration-300"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#1a3884 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      {/* Glow blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-50 dark:bg-[#1a3884]/10 rounded-full blur-[90px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-50 dark:bg-[#1a3884]/5 rounded-full blur-[70px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-[#1a3884]/8 dark:bg-[#1a3884]/20
                border border-[#1a3884]/15 dark:border-[#1a3884]/30
                text-[#1a3884] dark:text-blue-400
                text-[10px] font-black uppercase tracking-[0.18em]
                mb-4 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a3884] dark:bg-blue-400 animate-pulse" />
              {badge}
            </motion.div>
          )}

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-white tracking-tight leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            {accentFirst && titleAccent && (
              <span className="text-[#1a3884] dark:text-blue-300">{titleAccent} </span>
            )}
            {title}
            {!accentFirst && titleAccent && (
              <span className="text-[#1a3884] dark:text-blue-300"> {titleAccent}</span>
            )}
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.45 }}
              className="mt-2 text-sm sm:text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Right slot — stats card, buttons, etc. */}
        {children && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className="flex-shrink-0"
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PageHero;
