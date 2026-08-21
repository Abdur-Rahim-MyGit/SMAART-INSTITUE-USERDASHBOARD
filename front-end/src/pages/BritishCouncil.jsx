import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Globe2 } from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";

const BRITISH_COUNCIL_URL = "https://identity.britishcouncil.org/bccustomeridentityprod.onmicrosoft.com/b2c_1a_signup_signin/oauth2/authorize?client_id=ec67f630-bece-46fc-ab39-3e0879e8314b&redirect_uri=https%3A%2F%2Fconnect.britishcouncil.org%2Fsignin-oidc-b2c&response_type=id_token&scope=openid&response_mode=form_post&nonce=639228515717949514.NDRkMGU3YzctZmM1ZC00Yjk4LTkyYjUtZjQyNjQ3YjlmMDQ1Y2IzOGE1ZGEtMWU2Mi00YWY5LTk2MmQtYzA3ZTMxZDQ2ODI3&host=identity.britishcouncil.org&callback_proxy_state=SUDP7HHyWHXjVoA4vHCXGrmh4kJaPcjvM8Gj4fe2WEs&prompt=login&state=uNOY9cFIRmKzgv2gw2CwzfcvYDxGX2hZJaidgZiCFi5lpZY6UCnSqH0V0CAGnssb&x-client-SKU=ID_NET10_0&x-client-ver=8.19.2.0";

const BritishCouncil = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    setIsDarkTheme(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const openInNewTab = () => window.open(BRITISH_COUNCIL_URL, "_blank", "noopener,noreferrer");

  return (
    <div className="w-full relative min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 overflow-x-hidden">
      {/* Dynamic Animated Constellation Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
      </div>

      {/* Subtle background crest watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute right-[-5%] top-[8%] w-[520px] h-[520px] opacity-[0.03]"
          style={{
            backgroundImage: "url('/smaart-crest.png')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            filter: "grayscale(1) brightness(1.2)",
          }}
        />
        {/* Soft radial glows */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 opacity-40 blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -20, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 dark:bg-indigo-900/10 opacity-50 blur-[100px] pointer-events-none"
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto w-full px-4">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-blue-900/40 rounded-3xl shadow-2xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          {/* Header Back Button */}
          <button
            type="button"
            onClick={() => navigate("/dashboard/courses")}
            className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-blue-900/45 bg-white dark:bg-[#001c3d] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-[#002a5c] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("british_council_page.back", "Back")}
          </button>

          {/* Badge logo */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-[#1a3884] rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-8 mt-6">
            <Globe2 className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-extrabold text-[#002147] dark:text-white mb-4 tracking-tight leading-tight">
            {t("sidebar.british_council", "British Council")}
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed font-medium">
            {t(
              "british_council_page.description_long",
              "You are accessing the official British Council English learning portal. To ensure secure authentication and interactive learning sessions, please launch the portal in a new browser tab."
            )}
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <button
              type="button"
              onClick={openInNewTab}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-bold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-transform hover:scale-[1.02] active:scale-[0.99] w-full sm:w-auto"
              style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
            >
              <ExternalLink className="w-5 h-5" />
              {t("british_council_page.open_new_tab", "Open in a new tab")}
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              * Identity authentication is powered securely by British Council Customer Identity Management.
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BritishCouncil;
