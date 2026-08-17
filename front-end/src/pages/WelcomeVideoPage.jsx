import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { apiCall } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

// One constant welcome video shown to every student, once, on their first login.
// Placeholder asset — swap this single URL when the real video is ready.
const WELCOME_VIDEO_URL = "https://res.cloudinary.com/dlpmrdcqp/video/upload/videoplayback_xt7in8.mp4";

const WelcomeVideoPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const videoRef = useRef(null);
  const maxWatchedRef = useRef(0);
  const [hasFinished, setHasFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userData = sessionStorage.getItem("user");
    if (!token || !userData) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.currentTime > maxWatchedRef.current) {
      maxWatchedRef.current = el.currentTime;
    }
  };

  const handleSeeking = () => {
    const el = videoRef.current;
    if (!el) return;
    // Prevent skipping ahead past what's actually been watched.
    if (el.currentTime > maxWatchedRef.current + 0.5) {
      el.currentTime = maxWatchedRef.current;
    }
  };

  const handleEnded = () => {
    setHasFinished(true);
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await apiCall("/auth/mark-welcome-video-watched", { method: "POST" });
    } catch (error) {
      console.error("Failed to record welcome video completion:", error);
      toast.error(t("welcome_video.save_failed", "Couldn't save your progress, but you can continue."));
    } finally {
      const userData = JSON.parse(sessionStorage.getItem("user") || "null");
      if (userData) {
        userData.hasWatchedFirstLoginVideo = true;
        sessionStorage.setItem("user", JSON.stringify(userData));
      }
      navigate("/complete-registration", { replace: true });
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#002147]">
      <NeuralBackground theme={theme} />

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-3xl mx-auto"
        >
          <div
            className="rounded-3xl overflow-hidden bg-white dark:bg-card text-slate-900 dark:text-card-foreground shadow-2xl"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="relative bg-[#F8FAFC] dark:bg-muted/30 p-4">
              <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border border-border bg-white/90 dark:bg-card/90 backdrop-blur-md">
                <PlayCircle className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-card-foreground tracking-widest uppercase">
                  {t("welcome_video.badge", "Welcome")}
                </span>
              </div>

              <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
                <video
                  ref={videoRef}
                  src={WELCOME_VIDEO_URL}
                  className="absolute inset-0 w-full h-full"
                  controls
                  controlsList="nodownload noplaybackrate"
                  autoPlay
                  onTimeUpdate={handleTimeUpdate}
                  onSeeking={handleSeeking}
                  onEnded={handleEnded}
                />
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-9 flex flex-col items-center text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#002147] dark:text-foreground mb-2 tracking-tight">
                {t("welcome_video.title", "Welcome to SMAART Institute")}
              </h2>
              <p className="text-slate-600 dark:text-muted-foreground text-sm leading-relaxed max-w-lg mb-6">
                {t(
                  "welcome_video.description",
                  "Watch this short welcome video to get started. You'll only see this once."
                )}
              </p>

              <button
                type="button"
                disabled={!hasFinished || isSubmitting}
                onClick={handleContinue}
                className="relative w-full sm:w-auto sm:min-w-[220px] h-12 px-8 flex items-center justify-center gap-2 font-bold text-[15px] text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xl shadow-[#112b6b]/20"
                style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
              >
                {hasFinished ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : null}
                {isSubmitting
                  ? t("welcome_video.saving", "Please wait...")
                  : hasFinished
                    ? t("welcome_video.continue", "Continue")
                    : t("welcome_video.watch_to_continue", "Watch the video to continue")}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default WelcomeVideoPage;
