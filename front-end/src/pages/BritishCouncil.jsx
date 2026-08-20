import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Globe2 } from "lucide-react";

const BRITISH_COUNCIL_URL = "https://www.britishcouncil.org";

// Browsers give JS no way to detect an X-Frame-Options/CSP frame-ancestors
// block from the parent page — the iframe's load event still fires either
// way. We fall back to a short timeout: if the frame hasn't reported load
// by then, assume it was blocked and offer the new-tab escape hatch. The
// header link is kept visible regardless, since some browsers fire load
// even on a blocked (blank) frame.
const BLOCK_DETECTION_TIMEOUT_MS = 3000;

const BritishCouncil = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState("loading");
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => (prev === "loaded" ? prev : "blocked"));
    }, BLOCK_DETECTION_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleIframeLoad = () => {
    clearTimeout(timeoutRef.current);
    setStatus("loaded");
  };

  const openInNewTab = () => window.open(BRITISH_COUNCIL_URL, "_blank", "noopener,noreferrer");

  return (
    <div className="w-full relative min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/courses")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label={t("british_council_page.back", "Back to Courses")}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9f1239] to-[#e11d48] flex items-center justify-center shadow-lg shadow-rose-500/20 flex-shrink-0">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t("sidebar.british_council", "British Council")}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t("british_council_page.subtitle", "Official English learning resources from britishcouncil.org")}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openInNewTab}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#1a3884]/20 transition-transform hover:scale-[1.02] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
          >
            <ExternalLink className="w-4 h-4" />
            {t("british_council_page.open_new_tab", "Open in a new tab")}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#00152E] border border-slate-200 dark:border-white/10 shadow-xl"
        >
          <div className="relative w-full h-[calc(100vh-260px)] min-h-[480px] bg-slate-50 dark:bg-[#00101f]">
            <iframe
              key={BRITISH_COUNCIL_URL}
              src={BRITISH_COUNCIL_URL}
              title={t("sidebar.british_council", "British Council")}
              className="absolute inset-0 w-full h-full border-0"
              onLoad={handleIframeLoad}
              referrerPolicy="no-referrer-when-downgrade"
            />

            {status === "blocked" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-[#00152E]/95 backdrop-blur-sm px-6"
              >
                <div className="max-w-sm text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <Globe2 className="w-7 h-7 text-rose-500" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t("british_council_page.blocked_title", "This site can't be shown here")}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t(
                      "british_council_page.blocked_message",
                      "British Council doesn't allow their site to be embedded. Continue on their website instead."
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={openInNewTab}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#1a3884]/20 mx-auto"
                    style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("british_council_page.open_new_tab", "Open in a new tab")}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BritishCouncil;
