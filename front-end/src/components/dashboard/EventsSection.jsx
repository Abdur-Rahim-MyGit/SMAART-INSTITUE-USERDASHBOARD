import { memo } from "react";
import { motion } from "framer-motion";
import {
  RiBookOpenLine,
  RiGroupLine,
  RiHeartPulseLine,
} from "@/components/icons";
import { useNavigate } from "react-router-dom";
import { ANIMATION_DELAYS, COLORS } from "@/constants/dashboard";

const EventsSection = memo(() => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: ANIMATION_DELAYS.SECTIONS }}
      className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl p-5 shadow-sm"
    >
      <h3 className="text-[15px] font-bold mb-3 text-[#072036] dark:text-white tracking-tight">Events & Community</h3>
      <div className="flex flex-col gap-2">
        <button 
          onClick={() => navigate('/community')} 
          className="w-full flex items-center gap-3 p-3 hover:bg-[#EAF7FD] dark:hover:bg-[#0d3a5f] transition rounded-lg border border-[#d7ebf5] dark:border-white/10 group"
        >
          <div className="w-9 h-9 rounded-lg dark:bg-blue-900/30 flex items-center justify-center group-hover:dark:bg-blue-900/50 transition" style={{ backgroundColor: `${COLORS.PRIMARY}10` }}>
            <RiGroupLine className="w-4 h-4 dark:text-[#A6D7E8]" style={{ color: COLORS.PRIMARY }} />
          </div>
          <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Community Feed</span>
        </button>

        <button 
          onClick={() => navigate('/my-courses')} 
          className="w-full flex items-center gap-3 p-3 hover:bg-[#EAF7FD] dark:hover:bg-[#0d3a5f] transition rounded-lg border border-[#d7ebf5] dark:border-white/10 group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#0d3a5f] flex items-center justify-center transition">
            <RiBookOpenLine className="w-4 h-4 text-[#0E2136] dark:text-[#A6D7E8]" />
          </div>
          <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Concept Checks</span>
        </button>

        <button 
          onClick={() => navigate('/mind-care')} 
          className="w-full flex items-center gap-3 p-3 hover:bg-[#EAF7FD] dark:hover:bg-[#0d3a5f] transition rounded-lg border border-[#d7ebf5] dark:border-white/10 group"
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
