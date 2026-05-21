import { memo } from "react";
import { motion } from "framer-motion";
import { Code, Database, Cloud, BookOpen } from "lucide-react";
import { COLORS, COURSE_COLORS } from "@/constants/dashboard";
import { useNavigate } from "react-router-dom";

const PathCard = memo(({ path }) => {
  const navigate = useNavigate();
  const IconComponent = { Code, Database, Cloud, BookOpen }[path.icon] || BookOpen;
  
  const getIconColor = (color) => {
    switch (color) {
      case 'blue': return COLORS.PRIMARY;
      case 'indigo': return COLORS.INDIGO_600;
      case 'amber': return COLORS.AMBER_600;
      default: return COLORS.PRIMARY;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 group relative border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl dark:shadow-black/20"
         style={{
           boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
         }}>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#002A5C] flex items-center justify-center border border-gray-100 dark:border-white/10 shadow-sm group-hover:scale-110 group-hover:border-[#1a3884] dark:group-hover:border-blue-400 transition-all duration-300">
          <IconComponent className="w-6 h-6 text-[#1a3884] dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-extrabold text-[#112b6b] dark:text-white mb-1 tracking-tight" style={{ letterSpacing: "-0.01em" }}>{path.title}</h3>
          <p className="text-[12px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">{path.subtitle}</p>
        </div>
      </div>

      <button
        onClick={() => navigate(path.navigateTo || '/dashboard/courses')}
        className="w-full h-11 bg-[#f8fafc] dark:bg-[#002A5C] hover:bg-[#112b6b] dark:hover:bg-[#1a3884] text-[#112b6b] dark:text-blue-400 hover:text-white dark:hover:text-white border border-gray-100 dark:border-white/10 hover:border-[#112b6b] rounded-xl text-[13px] font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn"
      >
        {path.btnText}
        <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="opacity-0 group-hover/btn:opacity-100">→</motion.span>
      </button>
    </div>
  );
});

export default PathCard;
