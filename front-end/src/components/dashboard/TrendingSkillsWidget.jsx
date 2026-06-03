import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Zap } from "lucide-react";

// ── Static trending skill data (in production, fetch from /api/trending-skills)
const TRENDING_SKILLS = [
  { tag: "Google Analytics 4", demand: "+18%", module: "Digital Analytics", hot: true },
  { tag: "SEO Optimization", demand: "+14%", module: "Search Engine Marketing" },
  { tag: "AI Content Creation", demand: "+22%", module: "AI in Marketing", hot: true },
  { tag: "Social Media Ads", demand: "+9%", module: "Social Media Marketing" },
  { tag: "Email Automation", demand: "+11%", module: "Email Marketing" },
  { tag: "LinkedIn B2B", demand: "+16%", module: "B2B Marketing" },
  { tag: "Video Marketing", demand: "+13%", module: "Video & Content" },
  { tag: "Influencer Strategy", demand: "+7%", module: "Influencer Marketing" },
  { tag: "CRM & HubSpot", demand: "+10%", module: "Sales Tech & CRM" },
  { tag: "Performance Marketing", demand: "+20%", module: "Paid Advertising", hot: true },
  { tag: "Brand Identity", demand: "+6%", module: "Brand Building" },
  { tag: "UX Copywriting", demand: "+8%", module: "Content Strategy" },
];

// ── Demand % to heat color ────────────────────────────────────────────────────
const getHeatStyle = (demand, hot) => {
  const pct = parseInt(demand);
  if (hot || pct >= 20) return { bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/25", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-400" };
  if (pct >= 15)        return { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/25", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400" };
  if (pct >= 10)        return { bg: "bg-blue-50 dark:bg-[#1a3884]/15", border: "border-blue-200 dark:border-[#1a3884]/30", text: "text-[#1a3884] dark:text-blue-400", dot: "bg-[#1a3884]" };
  return { bg: "bg-slate-50 dark:bg-[#002A5C]/40", border: "border-slate-200 dark:border-[#1a3884]/15", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400" };
};

const TrendingSkillsWidget = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-[#002147] rounded-2xl border border-slate-200/80 dark:border-[#1a3884]/20 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-[#1a3884]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#1a3884] dark:bg-blue-400 rounded-full" />
            <TrendingUp className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight">Trending Industry Skills</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-500/20">
            <Zap className="w-2.5 h-2.5" />
            Live Demand
          </div>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1.5">
          Click any skill to go to the matching module
        </p>
      </div>

      {/* Skill tags cloud */}
      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {TRENDING_SKILLS.map((skill, idx) => {
            const heat = getHeatStyle(skill.demand, skill.hot);
            return (
              <motion.button
                key={skill.tag}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard/courses")}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 hover:shadow-md cursor-pointer ${heat.bg} ${heat.border} ${heat.text}`}
                title={`Module: ${skill.module}`}
              >
                {/* Pulsing dot for hot */}
                <span className="relative flex items-center">
                  <span className={`w-1.5 h-1.5 rounded-full ${heat.dot} ${skill.hot ? "animate-pulse" : ""}`} />
                </span>
                {skill.tag}
                <span className={`text-[9px] font-extrabold opacity-75 ${heat.text}`}>
                  {skill.demand}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 dark:border-[#1a3884]/10 text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> High demand</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Rising</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1a3884]" /> Steady</div>
        </div>
      </div>
    </div>
  );
});

TrendingSkillsWidget.displayName = "TrendingSkillsWidget";
export default TrendingSkillsWidget;
