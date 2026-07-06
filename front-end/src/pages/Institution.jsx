import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LoginCard from "@/components/LoginCard";
import { Play, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { apiCall } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

const videoUrlFallback = "https://player.cloudinary.com/embed/?cloud_name=dlpmrdcqp&public_id=videoplayback_xt7in8";

const Institution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collegeData, setCollegeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        setLoading(true);

        let targetId = id;
        if (!targetId) {
          const stored = sessionStorage.getItem("selectedInstitution");
          if (stored) {
            const parsed = JSON.parse(stored);
            targetId = parsed.name;
          }
        }

        if (!targetId) {
          // No error needed, LoginCard will show the InstitutionSelector automatically
          setLoading(false);
          return;
        }

        const response = await apiCall(`/colleges/name/${encodeURIComponent(targetId)}`);

        if (response && response.success) {
          setCollegeData(response.data);
        } else {
          setError(t("login.error.not_found", "Institution details not found"));
        }
      } catch (err) {
        setError(t("login.error.load_failed", "Failed to load: {{message}}", { message: err.message }));
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeData();
  }, [id]);

  const baseVideoUrl = (collegeData && collegeData.chairmanVideo) ? collegeData.chairmanVideo : videoUrlFallback;
  const currentVideoUrl = isPlaying
    ? (baseVideoUrl.includes("?") ? `${baseVideoUrl}&autoplay=1` : `${baseVideoUrl}?autoplay=1`)
    : baseVideoUrl;

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#002147]"
    >
      <NeuralBackground theme={theme} />
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
        {/* Soft radial glows for light mode */}
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100/50 opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 opacity-50 blur-[100px]" />
      </div>

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-10 relative z-10">
        <div className="w-full max-w-6xl mx-auto">

          {/* NO INSTITUTION — Redirect prompt (replaces generic error for this case) */}
          {error === "no-institution" ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 bg-white dark:bg-[#002A5C] border border-blue-100 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1a3884]/8 dark:bg-blue-400/10 flex items-center justify-center shrink-0 border border-[#1a3884]/10 dark:border-blue-400/20">
                <AlertCircle className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{t("login.no_institution.title", "No institution selected")}</p>
                <p className="text-xs text-gray-500 dark:text-slate-300">{t("login.no_institution.desc", "Please go back and choose your college to access the login portal.")}</p>
              </div>
              <button
                onClick={() => navigate('/', { replace: true })}
                className="flex items-center gap-1.5 text-xs font-bold text-[#1a3884] dark:text-blue-400 bg-[#1a3884]/5 dark:bg-blue-400/10 hover:bg-[#1a3884]/10 dark:hover:bg-blue-400/20 px-4 py-2 rounded-xl transition-colors shrink-0 border border-[#1a3884]/15 dark:border-blue-400/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("login.no_institution.go_back", "Go Back")}
              </button>
            </motion.div>
          ) : error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Two-column grid */}
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-14 items-center">

            {/* LEFT: Video + Welcome Section */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-0"
            >
              {/* Outer Card — Theme Aware */}
              <div
                className="rounded-3xl overflow-hidden bg-white dark:bg-card text-slate-900 dark:text-card-foreground shadow-2xl"
                style={{
                  border: "1px solid var(--border)",
                }}
              >
                {/* Frame around the video */}
                <div
                  className="relative rounded-t-3xl bg-[#F8FAFC] dark:bg-muted/30"
                  style={{
                    padding: "16px",
                  }}
                >
                  {/* Founder's Message Badge */}
                  <div
                    className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border border-border bg-white/90 dark:bg-card/90 backdrop-blur-md"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-card-foreground tracking-widest uppercase">
                      {t("login.video.badge", "Leadership Message")}
                    </span>
                  </div>

                  {/* Video embed — inset inside the frame */}
                  <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] bg-gray-100 dark:bg-[#00152E]" style={{ paddingBottom: "56.25%" }}>
                    {loading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#00152E] rounded-2xl">
                        <Loader2 className="w-8 h-8 text-[#002147] dark:text-white animate-spin" />
                      </div>
                    ) : (
                      <iframe
                        key={currentVideoUrl}
                        src={currentVideoUrl}
                        className="absolute inset-0 w-full h-full border-0 rounded-2xl"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                        title={t("login.video.iframe_title", "Founder's Message")}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent pointer-events-none rounded-2xl" />
                  </div>
                </div>

                {/* Welcome text below */}
                <div
                  className="px-6 py-8 sm:px-8 sm:py-9 flex flex-col items-center justify-center text-center rounded-b-3xl relative overflow-hidden bg-white dark:bg-card"
                >
                  <div className="relative z-10 max-w-lg mx-auto">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#002147] dark:text-foreground mb-3 tracking-tight leading-snug">
                      {t("login.video.title_1", "A Message from")} {" "}
                      <span className="font-extrabold text-[#1a3884] dark:text-blue-400">
                        {t("login.video.title_2", "Your Institution")}
                      </span>
                    </h2>
                    <p className="text-slate-600 dark:text-muted-foreground text-sm leading-relaxed">
                      {t("login.video.description", "Hear from your institution’s leadership as they introduce this platform and share their best wishes for your learning journey and future success.")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Login Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            >
              <LoginCard />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Institution;
