import { motion, AnimatePresence } from "framer-motion";
import { X, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import InstitutionSelector from "@/components/InstitutionSelector";
import { useState } from "react";

const InstitutionSelectModal = ({ isOpen, onClose, onInstitutionSelected }) => {
  const { t } = useTranslation();
  const [previewInstitution, setPreviewInstitution] = useState(null);

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
            className="relative w-full max-w-2xl z-10 overflow-hidden rounded-[2rem] bg-white dark:bg-[#002147] shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/10"
            style={{ 
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.03)"
            }}
          >
            {/* Navy accent line at top */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#002147] to-transparent opacity-80 z-20" />

            {/* ── Header ── */}
            <div className="relative bg-[#f8fafc] dark:bg-dark-bg/50 px-8 pt-10 pb-8 flex flex-col items-center border-b border-gray-100 dark:border-white/5 overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#1a3884 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-dark-elevated shadow-sm border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-300 hover:bg-[#1a3884] dark:hover:bg-[#1a3884] hover:text-white hover:border-[#1a3884] dark:hover:border-blue-600 transition-all duration-300 group z-20"
                aria-label={t("institution_select.close", "Close modal")}
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              {/* Icon badge */}
              <div className="relative z-10 w-20 h-20 flex items-center justify-center mb-5 bg-white dark:bg-dark-elevated rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 overflow-hidden group-hover:scale-105 transition-transform duration-500"
                   style={{ boxShadow: "0 12px 30px rgba(26,56,132,0.12)" }}>
                <AnimatePresence mode="wait">
                  {previewInstitution?.logo ? (
                    <motion.img
                      key={previewInstitution.logo}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      src={previewInstitution.logo}
                      alt="Institution Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <motion.div
                      key="default-icon"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Building2 className="w-8 h-8 text-[#1a3884]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <h2
                className="relative z-10 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#112b6b] dark:text-white text-center"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t("institution_select.title", "Select Your Institution")}
              </h2>
              <p className="relative z-10 text-gray-500 dark:text-slate-300 text-[12px] sm:text-[13px] font-medium mt-1.5 text-center max-w-[280px] leading-relaxed">
                {t("institution_select.subtitle", "Find your college to access your personalized learning and career dashboard.")}
              </p>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-8 sm:px-10 sm:py-10 bg-white dark:bg-[#002147]">
              <InstitutionSelector 
                onSelect={onInstitutionSelected} 
                onPreviewChange={setPreviewInstitution}
              />
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default InstitutionSelectModal;
