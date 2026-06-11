import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, Lock, TrendingUp, Code, Database, Cloud, Megaphone, MonitorPlay, Sparkles } from "lucide-react";

// Map string identifiers to actual components
const ICON_MAP = {
  BookOpen: BookOpen,
  Code: Code,
  Database: Database,
  Cloud: Cloud,
  TrendingUp: TrendingUp,
  Megaphone: Megaphone,
  MonitorPlay: MonitorPlay
};

const CareerPathsWidget = memo(({ paths = [], loading = false }) => {
  const navigate = useNavigate();

  const isCareerPathway = paths.some(p => ['primary', 'secondary', 'tertiary'].includes(p.id));

  const displayPaths = paths.filter(p => ['primary', 'secondary', 'tertiary'].includes(p.id)).map((p, i) => ({ ...p, index: i }));

  return (
    <div className="w-full">
      {/* Section heading */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xs uppercase font-extrabold text-slate-800 dark:text-white tracking-tight">
          My Career Paths
        </h2>
      </div>

      {/* Grid or Banner */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-[#002147] animate-pulse border border-slate-200 dark:border-[#1a3884]/20" />
          ))}
        </div>
      ) : isCareerPathway ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPaths.map((path, idx) => {
            const IconComponent = ICON_MAP[path.icon] || BookOpen;

            return (
              <motion.div
                key={path.id || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4, ease: "easeOut" }}
                className="relative group bg-white dark:bg-[#002147] rounded-2xl border border-slate-200/80 dark:border-[#1a3884]/20 shadow-sm hover:shadow-lg hover:border-[#1a3884]/40 dark:hover:border-[#1a3884]/50 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Top accent line */}
                <div className="h-0.5 w-full bg-gradient-to-r from-[#1a3884] to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#002A5C] border border-slate-100 dark:border-[#1a3884]/30 flex items-center justify-center shrink-0 group-hover:border-[#1a3884]/50 group-hover:bg-blue-50 dark:group-hover:bg-[#1a3884]/20 transition-all duration-300">
                      {path.locked
                        ? <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        : <IconComponent className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      {['primary', 'secondary', 'tertiary'].includes(path.id) && (
                        <div className="mb-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-400">
                            {path.id === 'primary' ? 'Primary Path' : path.id === 'secondary' ? 'Secondary Path' : 'Tertiary Path'}
                          </span>
                        </div>
                      )}
                      <h3 className="text-[13px] font-extrabold text-[#112b6b] dark:text-white leading-snug tracking-tight line-clamp-2">
                        {path.title}
                      </h3>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate(path.locked ? "/dashboard/career-agent" : (path.navigateTo || "/dashboard/courses"))}
                    className={`mt-auto w-full h-9 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 group/btn ${path.locked
                      ? "bg-slate-50 dark:bg-[#002A5C] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#1a3884]/25 hover:bg-slate-100 dark:hover:bg-[#002A5C]"
                      : "bg-[#f0f4ff] dark:bg-[#1a3884]/20 text-[#1a3884] dark:text-blue-400 border border-[#1a3884]/20 dark:border-[#1a3884]/40 hover:bg-[#1a3884] hover:text-white dark:hover:bg-[#1a3884] dark:hover:text-white"
                      }`}
                  >
                    {path.locked ? (
                      <><Lock className="w-3 h-3" /> View Career Path</>
                    ) : (
                      <>{path.btnText || "Continue Path"} <ArrowRight className="w-3 h-3 translate-x-0 group-hover/btn:translate-x-0.5 transition-transform" /></>
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
          className="w-full bg-white dark:bg-[#002147] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm hover:shadow-md border border-slate-200 dark:border-[#1a3884]/30 transition-all"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#112b6b] dark:text-white mb-1.5 tracking-tight">Unlock Your Career Path</h3>
                <p className="text-slate-600 dark:text-slate-300 text-[13px] max-w-lg leading-relaxed">
                  Discover the right career direction tailored to your skills and aspirations. Take our AI-driven assessment and let us guide you to your ideal role.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/career-agent")}
              className="mt-2 md:mt-0 whitespace-nowrap px-5 py-2.5 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md group"
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
