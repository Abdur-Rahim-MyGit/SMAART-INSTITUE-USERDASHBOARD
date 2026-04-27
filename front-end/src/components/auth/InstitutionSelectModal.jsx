import { motion, AnimatePresence } from "framer-motion";
import { X, Building2 } from "lucide-react";
import InstitutionSelector from "@/components/InstitutionSelector";

const InstitutionSelectModal = ({ isOpen, onClose, onInstitutionSelected }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">

          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
            onClick={onClose}
          />

          {/* ── Card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl z-10 overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            style={{ 
              border: "1px solid rgba(0, 0, 0, 0.06)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.03)"
            }}
          >
            {/* Navy accent line at top */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#002147] to-transparent opacity-80 z-20" />

            {/* ── Header ── */}
            <div className="relative bg-[#f8fafc] px-8 pt-10 pb-8 flex flex-col items-center border-b border-gray-100 overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#1a3884 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:bg-[#1a3884] hover:text-white hover:border-[#1a3884] transition-all duration-300 group z-20"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              {/* Icon badge */}
              <div className="relative z-10 w-16 h-16 flex items-center justify-center mb-5 bg-white rounded-2xl shadow-md border border-gray-100"
                   style={{ boxShadow: "0 8px 20px rgba(26,56,132,0.08)" }}>
                <Building2 className="w-7 h-7 text-[#1a3884]" />
              </div>

              <h2
                className="relative z-10 text-xl sm:text-2xl font-extrabold tracking-tight text-[#112b6b] text-center"
                style={{ letterSpacing: "-0.02em" }}
              >
                Select Your Institution
              </h2>
              <p className="relative z-10 text-gray-500 text-[12px] sm:text-[13px] font-medium mt-1.5 text-center max-w-[280px] leading-relaxed">
                Find your college to access your personalized learning and career dashboard.
              </p>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-8 sm:px-10 sm:py-10 bg-white">
              <InstitutionSelector onSelect={onInstitutionSelected} />
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default InstitutionSelectModal;
