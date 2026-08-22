import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { apiCall } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

// Fallback welcome video when the student's college has no Leadership Message
// set by the SMAART admin (Community Hub → Banners → Leadership Message).
const WELCOME_VIDEO_URL = "https://res.cloudinary.com/dlpmrdcqp/video/upload/videoplayback_xt7in8.mp4";

const WelcomeVideoPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const videoRef = useRef(null);
  const maxWatchedRef = useRef(0);
  const [hasFinished, setHasFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userData = sessionStorage.getItem("user");
    if (!token || !userData) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // The admin-managed Leadership Message of the student's college plays here;
  // the constant above is only the fallback.
  useEffect(() => {
    const loadCollegeMedia = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "null");
        const collegeId = user?.college?._id || user?.college || user?.collegeId;
        if (collegeId) {
          const response = await apiCall(`/colleges/${collegeId}`);
          if (response?.success && response.data?.chairmanVideo) {
            setMediaUrl(response.data.chairmanVideo);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load college welcome media:", error);
      }
      setMediaUrl(WELCOME_VIDEO_URL);
    };
    loadCollegeMedia();
  }, []);

  const isImageMessage = !!mediaUrl && /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(mediaUrl);
  // Old embed-style URLs (Cloudinary player pages) can't be tracked by a
  // <video> element — show them in an iframe and unlock Continue right away.
  const isEmbedMessage = !!mediaUrl && !isImageMessage && /player\.cloudinary\.com|\/embed/i.test(mediaUrl);

  useEffect(() => {
    if (isImageMessage || isEmbedMessage) setHasFinished(true);
  }, [isImageMessage, isEmbedMessage]);

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.currentTime > maxWatchedRef.current) {
      maxWatchedRef.current = el.currentTime;
    }
    setProgress({ current: el.currentTime, duration: el.duration || 0 });
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play(); else el.pause();
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  const fmt = (s) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
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
                {!mediaUrl ? null : isImageMessage ? (
                  <img
                    src={mediaUrl}
                    alt={t("welcome_video.badge", "Welcome")}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : isEmbedMessage ? (
                  <iframe
                    src={mediaUrl}
                    title={t("welcome_video.badge", "Welcome")}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      className="absolute inset-0 w-full h-full cursor-pointer"
                      autoPlay
                      playsInline
                      onClick={togglePlay}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onSeeking={handleSeeking}
                      onEnded={handleEnded}
                      onLoadedMetadata={handleTimeUpdate}
                    />
                    {/* Custom controls — deliberately NO seek bar interaction:
                        students must watch the full video without skipping. */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
                      <div className="h-1 w-full rounded-full bg-white/25 overflow-hidden mb-2.5">
                        <div
                          className="h-full rounded-full bg-white transition-[width] duration-200"
                          style={{ width: `${progress.duration ? (progress.current / progress.duration) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={togglePlay}
                          aria-label={isPlaying ? "Pause" : "Play"}
                          className="text-white transition-colors hover:text-white/75"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <span className="text-[12px] font-semibold tabular-nums text-white/90">
                          {fmt(progress.current)} / {fmt(progress.duration)}
                        </span>
                        <span className="flex-1" />
                        <button
                          type="button"
                          onClick={toggleMute}
                          aria-label={isMuted ? "Unmute" : "Mute"}
                          className="text-white transition-colors hover:text-white/75"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
