import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { RiBookOpenLine } from "@remixicon/react";
import { useNavigate } from "react-router-dom";
import { ANIMATION_DELAYS, COLORS } from "@/constants/dashboard";
import { useTranslation } from "react-i18next";
import PathCard from "./PathCard";

const LearningProgress = memo(({ paths, loading, error }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const averageProgress = useMemo(() =>
    paths.length > 0
      ? Math.round(paths.reduce((acc, p) => acc + p.progress, 0) / paths.length)
      : 0,
    [paths]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ANIMATION_DELAYS.SECTIONS }}
      className="bg-white dark:bg-[#002147] border border-gray-100/80 dark:border-[#1a3884]/20 rounded-[32px] shadow-xl shadow-gray-200/30 dark:shadow-black/30 overflow-hidden relative transition-colors duration-300"
    >
      {/* Continue Learning Bar */}
      <div className="p-8 border-b border-gray-50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white dark:bg-[#002A5C] rounded-2xl flex items-center justify-center border border-gray-100/80 dark:border-[#1a3884]/20 shadow-sm">
            <RiBookOpenLine className="w-7 h-7 text-[#1a3884] dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a3884] dark:text-blue-400">{t("dashboard.continue_learning")}</h3>
            <h2 className="text-2xl font-extrabold text-[#112b6b] dark:text-white tracking-tight mt-0.5 leading-tight" style={{ letterSpacing: "-0.02em" }}>
              Continue Learning Courses
            </h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8 w-full md:w-auto">
          <div className="w-full sm:w-48 md:w-56 lg:w-72">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Overall Progress</span>
              <span className="text-[13px] font-extrabold text-[#1a3884] dark:text-blue-400">{averageProgress}%</span>
            </div>
            <div className="h-2 w-full bg-[#F8FAFC] dark:bg-[#002A5C] rounded-full overflow-hidden border border-gray-100/50 dark:border-slate-700/50">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                style={{ width: `${averageProgress}%`, background: "linear-gradient(90deg, #112b6b 0%, #1a3884 100%)" }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard/courses')}
            className="relative h-12 px-8 bg-[#112b6b] dark:bg-[#1a3884] hover:bg-[#1a3884] dark:hover:bg-[#1a3884] text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-[#112b6b]/20 dark:shadow-blue-900/30 hover:-translate-y-1 active:translate-y-0 whitespace-nowrap overflow-hidden group"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {t("dashboard.continue_learning")}
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
            </div>
          </button>
        </div>
      </div>

      {/* Path Cards Grid */}
      <div className="p-4 bg-slate-50/30 dark:bg-slate-800/10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#002147] border border-slate-200/80 dark:border-[#1a3884]/20 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#002A5C] animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-100 dark:bg-[#002A5C] rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-slate-100 dark:bg-[#002A5C] rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
                <div className="h-10 bg-slate-100 dark:bg-[#002A5C] rounded-xl animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("dashboard.unable_to_load_paths")}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm dark:text-blue-400 font-semibold hover:underline"
              style={{ color: COLORS.PRIMARY }}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        ) : paths.length === 0 ? (
          <div className="text-center py-8">
            <RiBookOpenLine className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Complete your career analysis to see your registered career directions here.
            </p>
            <button
              onClick={() => navigate('/dashboard/career-agent')}
              className="text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{ backgroundColor: COLORS.PRIMARY }}
              onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.PRIMARY_DARK}
              onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.PRIMARY}
            >
              View Career Directions
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default LearningProgress;
