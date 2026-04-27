import { motion, AnimatePresence } from "framer-motion";
import { X, Building2 } from "lucide-react";
import InstitutionSelector from "@/components/InstitutionSelector";

const InstitutionSelectModal = ({ isOpen, onClose, onInstitutionSelected }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
            onClick={onClose}
          />

          {/* ── Card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg z-10 overflow-hidden rounded-3xl bg-white shadow-2xl"
            style={{ border: "1px solid rgba(0, 0, 0, 0.05)" }}
          >
            {/* Navy accent line at top */}
            <div className="h-[3px] bg-gradient-to-r from-transparent via-[#002147] to-transparent opacity-80" />

            {/* ── Header ── */}
            <div className="relative bg-gray-50 px-8 pt-8 pb-7 flex flex-col items-center border-b border-gray-100">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#1a3884] hover:text-white transition-all duration-200 group"
                aria-label="Close"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              </button>

              {/* Icon badge */}
              <div className="w-14 h-14 flex items-center justify-center mb-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Building2 className="w-6 h-6 text-[#1a3884]" />
              </div>

              <h2
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#112b6b] text-center"
                style={{ letterSpacing: "-0.02em" }}
              >
                Select Your Institution
              </h2>
              <p className="text-[13px] text-gray-500 mt-2 text-center max-w-[260px] leading-relaxed">
                Find your college to access your personalised career dashboard.
              </p>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-7 sm:px-8 sm:py-8 bg-white">
              <InstitutionSelector onSelect={onInstitutionSelected} />
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default InstitutionSelectModal;
