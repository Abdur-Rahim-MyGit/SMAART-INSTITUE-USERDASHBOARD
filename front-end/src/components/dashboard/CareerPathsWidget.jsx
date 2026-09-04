import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "@/components/icons";
import { careerIcon } from "@/components/icons/career";
import { useTranslation } from "react-i18next";

const CareerPathsWidget = memo(({ paths = [], loading = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isCareerPathway = paths.some(p => ['primary', 'secondary', 'tertiary'].includes(p.id));

  const displayPaths = paths.filter(p => ['primary', 'secondary', 'tertiary'].includes(p.id)).map((p, i) => ({ ...p, index: i }));

  return (
    <div className="w-full">
      {/* Section heading */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-[3px] h-4 rounded-full bg-[#045C9A] dark:bg-[#045C9A] shrink-0" />
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-[#072036] dark:text-slate-300">
          {t("dashboard.my_career_paths", "My Career Paths")}
        </h2>
      </div>

      {/* Grid or Banner */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-[#072036] animate-pulse border border-[#d7ebf5] dark:border-[#045C9A]/20" />
          ))}
        </div>
      ) : isCareerPathway ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPaths.map((path, idx) => {
            const IconComponent = careerIcon(path.icon);

            return (
              <motion.div
                key={path.id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ delay: idx * 0.08, duration: 0.4, ease: "easeOut" }}
                className="relative group bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm hover:shadow-xl hover:shadow-[#045C9A]/10 hover:border-[#045C9A]/40 dark:hover:border-[#045C9A]/50 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Top accent line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-1 w-full bg-gradient-to-r from-[#045C9A] via-blue-500 to-cyan-400 origin-left"
                />

                <div className="p-5 flex flex-col flex-1">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 mb-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-[#045C9A]/30 flex items-center justify-center shrink-0 group-hover:border-[#045C9A]/50 group-hover:bg-[#EAF7FD] dark:group-hover:bg-[#045C9A]/20 transition-all duration-300"
                    >
                      {path.locked
                        ? <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        : <IconComponent className="w-4 h-4 text-[#0E2136] dark:text-[#A6D7E8]" />
                      }
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      {['primary', 'secondary', 'tertiary'].includes(path.id) && (
                        <div className="mb-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                            {path.id === 'primary'
                              ? t('dashboard.primary_path', 'Primary Path')
                              : path.id === 'secondary'
                                ? t('dashboard.secondary_path', 'Secondary Path')
                                : t('dashboard.tertiary_path', 'Tertiary Path')}
                          </span>
                        </div>
                      )}
                      <h3 className="text-[13px] font-bold text-[#072036] dark:text-white leading-snug tracking-tight line-clamp-2">
                        {path.title}
                      </h3>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate(path.locked ? "/dashboard/career-agent" : (path.navigateTo || "/dashboard/courses"))}
                    className={`mt-auto w-full h-9 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors group/btn ${path.locked
                      ? "bg-slate-50 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border border-[#d7ebf5] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.07]"
                      : "bg-[#EAF7FD] dark:bg-white/[0.06] text-[#045C9A] dark:text-[#A6D7E8] border border-[#045C9A]/25 dark:border-white/15 hover:bg-[#045C9A] hover:text-white hover:border-transparent dark:hover:bg-[#A6D7E8] dark:hover:text-[#072036] dark:hover:border-transparent"
                      }`}
                  >
                    {path.locked ? (
                      <><Lock className="w-3 h-3" /> {t('dashboard.view_career_path', 'View Career Path')}</>
                    ) : (
                      <>{path.btnText === 'View Career Path'
                        ? t('dashboard.view_career_path', 'View Career Path')
                        : (path.btnText === 'Continue Path'
                          ? t('dashboard.continue_path', 'Continue Path')
                          : path.btnText || t('dashboard.continue_path', 'Continue Path'))} <ArrowRight className="w-3 h-3 translate-x-0 group-hover/btn:translate-x-0.5 transition-transform" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white dark:bg-[#0d3a5f] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm hover:shadow-md border border-[#d7ebf5] dark:border-[#045C9A]/30 transition-all"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
              <div>
                <h3 className="text-[15px] font-bold text-[#072036] dark:text-white mb-1.5 tracking-tight">Unlock Your Career Path</h3>
                <p className="text-slate-600 dark:text-slate-300 text-[13px] max-w-lg leading-relaxed">
                  Discover the right career direction tailored to your skills and aspirations. Take our AI-driven assessment and let us guide you to your ideal role.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/career-agent")}
              className="mt-2 md:mt-0 whitespace-nowrap px-5 py-2.5 bg-[#072036] hover:bg-[#0d3a5f] text-white dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md dark:shadow-none group"
            >
              Start Career Agent <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
});

CareerPathsWidget.displayName = "CareerPathsWidget";
export default CareerPathsWidget;
