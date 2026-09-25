import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "@/components/icons";
import { clearSecureSession, isSebBrowser } from "@/utils/secureBrowser";

/**
 * Safe Exam Browser's quit URL. Navigating here makes SEB close itself, so
 * this page is only ever seen for a moment (or when opened in a normal
 * browser by mistake).
 */
const SecureExit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  clearSecureSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAF7FD] p-4 text-[#072036] dark:bg-[#072036] dark:text-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md rounded-2xl border border-[#d7ebf5]/80 bg-white p-6 text-center shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f] sm:p-8"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#A6D7E8]/10 dark:text-[#A6D7E8]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-lg font-extrabold text-[#072036] dark:text-white">
          {t("secure_assessment.exit_title", "Assessment submitted")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {isSebBrowser()
            ? t("secure_assessment.exit_text_seb", "Safe Exam Browser will close now. Open your normal browser to see your result in the Assessment Centre.")
            : t("secure_assessment.exit_text", "You can close this window. Your result is in the Assessment Centre.")}
        </p>
        {!isSebBrowser() && (
          <button
            type="button"
            onClick={() => navigate("/dashboard/assessment-centre")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#072036] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
          >
            {t("assessments_dashboard.back", "Assessment Centre")}
          </button>
        )}
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#d7ebf5] pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />
          {t("secure_assessment.eyebrow", "Secure assessment")}
        </div>
      </motion.div>
    </div>
  );
};

export default SecureExit;
