import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LoginCard from "@/components/LoginCard";
import { apiCall } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

// Default shown when the SMAART admin hasn't added any slideshow media for
// the selected college (admin panel → Community Hub → Banners → Leadership
// Media). Managed media comes from college.loginMedia.
const FALLBACK_EMBED =
  "https://player.cloudinary.com/embed/?cloud_name=dlpmrdcqp&public_id=videoplayback_xt7in8&autoplay=true&muted=true";

const getAutoplayUrl = (url) => {
  if (!url) return "";
  if (url.includes("autoplay=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}autoplay=true&muted=true`;
};

const Institution = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [media, setMedia] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // One global slideshow for everyone, managed by the SMAART admin
  // (admin panel → Community Hub → Banners → Leadership Media).
  useEffect(() => {
    const loadLoginMedia = async () => {
      try {
        const response = await apiCall("/login-media");
        const items = response?.data;
        if (response?.success && Array.isArray(items) && items.length > 0) {
          setMedia(items.filter((m) => m?.url));
          setIndex(0);
        }
      } catch {
        // Keep the default video on any error
      }
    };
    loadLoginMedia();
  }, []);

  const items = media.length > 0
    ? [...media].sort((a, b) => {
        const typeA = a.resourceType === "video" || a.resourceType === "embed" ? 0 : 1;
        const typeB = b.resourceType === "video" || b.resourceType === "embed" ? 0 : 1;
        return typeA - typeB;
      })
    : [{ url: FALLBACK_EMBED, resourceType: "embed" }];
  const current = items[Math.min(index, items.length - 1)];

  // Images advance automatically; videos advance when they finish (onEnded).
  useEffect(() => {
    if (items.length <= 1 || current?.resourceType !== "image") return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearTimeout(timer);
  }, [index, items.length, current?.resourceType]);

  const next = () => setIndex((i) => (i + 1) % items.length);
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#002147]">
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
        {/* Soft radial glows that float dynamically */}
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

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-10 relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-14 items-center">

            {/* LEFT: Leadership media slideshow */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-0"
            >
              <div
                className="rounded-3xl overflow-hidden bg-white dark:bg-card text-slate-900 dark:text-card-foreground shadow-2xl"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="relative rounded-t-3xl bg-[#F8FAFC] dark:bg-muted/30" style={{ padding: "16px" }}>
                  {/* Leadership Message badge */}
                  <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border border-border bg-white/90 dark:bg-card/90 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-card-foreground tracking-widest uppercase">
                      {t("login.video.badge", "Leadership Message")}
                    </span>
                  </div>

                  {/* Media inset inside the frame */}
                  <div
                    className="relative w-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] bg-gray-100 dark:bg-[#00152E] group"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    {current.resourceType === "image" ? (
                      <img
                        key={current.url}
                        src={current.url}
                        alt={t("login.video.badge", "Leadership Message")}
                        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                      />
                    ) : current.resourceType === "video" ? (
                      <video
                        key={current.url}
                        src={current.url}
                        className="absolute inset-0 w-full h-full object-contain bg-black rounded-2xl"
                        autoPlay
                        muted
                        playsInline
                        controls
                        onEnded={items.length > 1 ? next : undefined}
                        loop={items.length === 1}
                      />
                    ) : (
                      <iframe
                        key={current.url}
                        src={getAutoplayUrl(current.url)}
                        className="absolute inset-0 w-full h-full border-0 rounded-2xl"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                        title={t("login.video.iframe_title", "Founder's Message")}
                      />
                    )}

                    {items.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prev}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={next}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {items.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setIndex(idx)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === index ? "bg-white w-5" : "bg-white/50 hover:bg-white/80 w-1.5"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Welcome text below */}
                <div className="px-6 py-8 sm:px-8 sm:py-9 flex flex-col items-center justify-center text-center rounded-b-3xl relative overflow-hidden bg-white dark:bg-card">
                  <div className="relative z-10 max-w-lg mx-auto">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#002147] dark:text-foreground mb-3 tracking-tight leading-snug">
                      {t("login.video.title_1", "A Message from")}{" "}
                      <span className="font-extrabold text-[#1a3884] dark:text-blue-400">
                        {t("login.video.title_2", "SMAART Institute")}
                      </span>
                    </h2>
                    <p className="text-slate-600 dark:text-muted-foreground text-sm leading-relaxed">
                      {t(
                        "login.video.description",
                        "A warm welcome from the SMAART Institute team as they introduce the platform and wish you success in your learning and career journey."
                      )}
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
