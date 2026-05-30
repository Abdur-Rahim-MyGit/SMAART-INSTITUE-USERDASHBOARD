import { memo } from "react";
import { motion } from "framer-motion";
import { RiGroupLine, RiBookOpenLine, RiHeartPulseLine } from "@remixicon/react";
import { useNavigate } from "react-router-dom";
import { ANIMATION_DELAYS, COLORS } from "@/constants/dashboard";

const EventsSection = memo(() => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: ANIMATION_DELAYS.SECTIONS }}
      className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-sm"
    >
      <h3 className="font-semibold text-sm mb-3 text-slate-900 dark:text-white">Events & Community</h3>
      <div className="flex flex-col gap-2">
        <button 
          onClick={() => navigate('/community')} 
          className="w-full flex items-center gap-3 p-3 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition rounded-lg border border-slate-100 dark:border-white/10 group"
        >
          <div className="w-9 h-9 rounded-lg dark:bg-blue-900/30 flex items-center justify-center group-hover:dark:bg-blue-900/50 transition" style={{ backgroundColor: `${COLORS.PRIMARY}10` }}>
            <RiGroupLine className="w-4 h-4 dark:text-blue-400" style={{ color: COLORS.PRIMARY }} />
          </div>
          <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Community Feed</span>
        </button>

        <button 
          onClick={() => navigate('/my-courses')} 
          className="w-full flex items-center gap-3 p-3 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition rounded-lg border border-slate-100 dark:border-white/10 group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#002A5C] flex items-center justify-center transition">
            <RiBookOpenLine className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Concept Checks</span>
        </button>

        <button 
          onClick={() => navigate('/mind-care')} 
          className="w-full flex items-center gap-3 p-3 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition rounded-lg border border-slate-100 dark:border-white/10 group"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition">
            <RiHeartPulseLine className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Mind Care</span>
        </button>
      </div>
    </motion.div>
  );
});

export default EventsSection;
