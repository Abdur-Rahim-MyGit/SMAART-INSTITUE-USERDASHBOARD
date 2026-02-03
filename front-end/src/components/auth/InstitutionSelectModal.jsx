import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import InstitutionSelector from "@/components/InstitutionSelector";

const InstitutionSelectModal = ({ isOpen, onClose, onInstitutionSelected }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 bg-white dark:bg-[#00152e] border border-gray-200 dark:border-white/10 mx-2 sm:mx-0"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#30919D]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#daa520]/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="relative p-6 sm:p-8 text-center border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-[#30919D] hover:text-white dark:hover:bg-[#30919D] transition-all duration-300 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#30919D]/10 dark:bg-[#30919D]/20 text-[#30919D] mb-4 shadow-inner ring-1 ring-[#30919D]/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                Select Your Institution
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Find your college to access your personalized career dashboard.
              </p>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 bg-white dark:bg-[#00152e] relative z-20">
              <InstitutionSelector onSelect={onInstitutionSelected} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InstitutionSelectModal;
