import { memo } from "react";
import { motion } from "framer-motion";
import { careerIcon } from "@/components/icons/career";
import { COLORS, COURSE_COLORS } from "@/constants/dashboard";
import { useNavigate } from "react-router-dom";

const PathCard = memo(({ path }) => {
  const navigate = useNavigate();
  const IconComponent = careerIcon(path.icon);
  
  const getIconColor = (color) => {
    switch (color) {
      case 'blue': return COLORS.PRIMARY;
      case 'indigo': return COLORS.INDIGO_600;
      case 'amber': return COLORS.AMBER_600;
      default: return COLORS.PRIMARY;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 group relative border border-[#d7ebf5] dark:border-white/10 shadow-sm hover:shadow-xl dark:shadow-black/20"
         style={{
           boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
         }}>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0d3a5f] flex items-center justify-center border border-[#d7ebf5] dark:border-white/10 shadow-sm group-hover:scale-110 group-hover:border-[#045C9A] dark:group-hover:border-[#045C9A] transition-all duration-300">
          <IconComponent className="w-6 h-6 text-[#0E2136] dark:text-[#A6D7E8]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-[#072036] dark:text-white mb-1 tracking-tight" style={{ letterSpacing: "-0.01em" }}>{path.title}</h3>
          <p className="text-[12px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">{path.subtitle}</p>
        </div>
      </div>

      <button
        onClick={() => navigate(path.navigateTo || '/dashboard/courses')}
        className="w-full h-11 bg-[#EAF7FD] dark:bg-[#0d3a5f] hover:bg-[#034a7d] dark:hover:bg-[#045C9A] text-[#034a7d] dark:text-[#A6D7E8] hover:text-white dark:hover:text-white border border-[#d7ebf5] dark:border-white/10 hover:border-[#034a7d] rounded-xl text-[13px] font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn"
      >
        {path.btnText}
        <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="opacity-0 group-hover/btn:opacity-100">→</motion.span>
      </button>
    </div>
  );
});

export default PathCard;
