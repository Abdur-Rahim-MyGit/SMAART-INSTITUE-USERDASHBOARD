import { memo } from "react";
import { motion } from "framer-motion";
import { Award, Shield, Sparkles, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ANIMATION_DELAYS, COLORS } from "@/constants/dashboard";

const ToolsStrip = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/8">
      <motion.button 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: ANIMATION_DELAYS.TOOLS_WALLET }}
        onClick={() => navigate('/skills-vault')}
        className="flex items-center gap-3 bg-white dark:bg-[#002147] border dark:border-white/8 rounded-none px-6 py-3 shadow-sm hover:shadow-md transition"
        style={{ borderColor: COLORS.SILVER }}
      >
        <span className="font-bold text-sm dark:text-white" style={{ color: COLORS.PRIMARY }}>Skills Vault</span>
        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-white/10 pl-3">
          <Award className="w-4 h-4" style={{ color: COLORS.SILVER }} />
          <Shield className="w-4 h-4" style={{ color: COLORS.SILVER }} />
          <Sparkles className="w-4 h-4" style={{ color: COLORS.SILVER }} />
        </div>
      </motion.button>

      <div className="flex items-center gap-4">
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: ANIMATION_DELAYS.TOOLS_TOOLKIT }}
          onClick={() => navigate('/smaart-toolkit')}
          className="bg-white dark:bg-[#002147] border dark:border-white/8 rounded-none px-6 py-3 font-bold text-sm dark:text-white shadow-sm hover:shadow-md transition"
          style={{ borderColor: COLORS.SILVER, color: COLORS.PRIMARY }}
        >
          Quick Access Toolkit
        </motion.button>
        
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: ANIMATION_DELAYS.TOOLS_SCROLL }}
          className="w-12 h-12 text-white rounded-none flex items-center justify-center shadow-lg transition"
          style={{ backgroundColor: COLORS.PRIMARY }}
          onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.PRIMARY_DARK}
          onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.PRIMARY}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
});

export default ToolsStrip;
