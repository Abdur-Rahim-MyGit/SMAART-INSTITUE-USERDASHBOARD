import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Continue Learning Bar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            <BookOpen className="w-5 h-5 dark:text-blue-400" style={{ color: COLORS.PRIMARY }} />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("dashboard.continue_learning")}</h3>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight mt-0.5">{t("dashboard.capability_program")}</h2>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="flex-1 md:w-48 lg:w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            <div 
              className="h-full dark:bg-blue-500 rounded-lg transition-all duration-500"
              style={{ width: `${averageProgress}%`, backgroundColor: COLORS.PRIMARY }}
            ></div>
          </div>
          <span className="text-xs font-semibold dark:text-blue-400 whitespace-nowrap" style={{ color: COLORS.PRIMARY }}>
            {averageProgress}% {t("dashboard.complete")}
          </span>
          <button 
            onClick={() => window.open('http://localhost:5173/', '_blank')}
            className="dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap"
            style={{ backgroundColor: COLORS.PRIMARY }}
            onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.PRIMARY_DARK}
            onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.PRIMARY}
          >
            {t("dashboard.continue_learning")}
          </button>
        </div>
      </div>

      {/* Path Cards Grid */}
      <div className="p-4 bg-slate-50/30 dark:bg-slate-800/10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
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
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t("dashboard.no_paths")}</p>
            <button 
              onClick={() => navigate('/dashboard/courses')}
              className="text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
              style={{ backgroundColor: COLORS.PRIMARY }}
              onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.PRIMARY_DARK}
              onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.PRIMARY}
            >
              {t("dashboard.browse_courses")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
