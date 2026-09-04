import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LogOut, Star, User } from "@/components/icons";

// Import Video Assets for Avatar Card
import ToddlerBoyIdle from "@/assets/Animations/ToddlerBoyIdle.mp4";
import ToddlerBoyGrowing from "@/assets/Animations/ToddlerBoyGrowing.mp4";
import PreteenBoyIdle from "@/assets/Animations/PreteenBoyIdle.mp4";
import PreteenBoyGrowing from "@/assets/Animations/PreteenBoyGrowing.mp4";
import TeenBoyIdle from "@/assets/Animations/TeenBoyIdle.mp4";
import TeenBoyGrowing from "@/assets/Animations/TeenBoyGrowing.mp4";
import ManIdle from "@/assets/Animations/ManIdle.mp4";
import ToddlerGirlIdle from "@/assets/Animations/ToddlerGirlIdle.mp4";
import ToddlerGirlGrowing from "@/assets/Animations/ToddlerGirlGrowing.mp4";
import PreteenGirlIdle from "@/assets/Animations/PreeteenGirlIdle.mp4";
import PreteenGirlGrowing from "@/assets/Animations/PreteenGirlGrowing.mp4";
import TeenGirlIdle from "@/assets/Animations/TeenGirlIdle.mp4";
import TeenGirlGrowing from "@/assets/Animations/TeenGirlGrowing.mp4";
import WomanIdle from "@/assets/Animations/WomanIdle.mp4";

const MALE_SEQUENCE = [
  ToddlerBoyIdle,
  ToddlerBoyGrowing,
  PreteenBoyIdle,
  PreteenBoyGrowing,
  TeenBoyIdle,
  TeenBoyGrowing,
  ManIdle,
];

const FEMALE_SEQUENCE = [
  ToddlerGirlIdle,
  ToddlerGirlGrowing,
  PreteenGirlIdle,
  PreteenGirlGrowing,
  TeenGirlIdle,
  TeenGirlGrowing,
  WomanIdle,
];

const ProfileHoverCard = ({ user, avatarData, onLogout, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRefs = useRef([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(0);

  const userGender = user?.gender || avatarData?.user?.gender;
  const normalizedGender = userGender?.toLowerCase()?.trim();
  const isFemale = ["female", "girl", "woman"].includes(normalizedGender);
  const ANIMATION_SEQUENCE = isFemale ? FEMALE_SEQUENCE : MALE_SEQUENCE;

  // `??` rather than `||`: a genuine 0% must not fall through to the XP maths.
  const levelProgress =
    avatarData?.levelProgress ??
    Math.round(((avatarData?.xp || 0) / (avatarData?.xpToNextLevel || 100)) * 100);

  // The bar and the read-out both render from this, so clamp once here.
  const clampedLevelProgress = Math.min(100, Math.max(0, Number(levelProgress) || 0));

  const handleVideoEnded = (index) => {
    if (index < ANIMATION_SEQUENCE.length - 1) {
      setCurrentVideoIndex(index + 1);
    }
  };

  useEffect(() => {
    const video = videoRefs.current[currentVideoIndex];
    if (video) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Autoplay prevented:", error);
        });
      }
    }
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentVideoIndex) {
        video.pause();
      }
    });
  }, [currentVideoIndex, isFemale]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#045C9A]/20 bg-white dark:bg-[#0d3a5f] shadow-2xl"
      style={{
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-[#EAF7FD] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-blue-900/40 dark:via-[#072036] dark:to-[#072036]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30 dark:opacity-50" />

      {/* Animation Section */}
      <div className="relative z-10 pt-4 px-4 pb-2">
        <div className="relative aspect-[4/5] w-full mx-auto rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 shadow-2xl flex items-center justify-center bg-slate-100 dark:bg-black/40 backdrop-blur-sm group">
          {/* Inner Glow Border */}
          <div className="absolute inset-0 rounded-xl border border-slate-200/50 dark:border-[#045C9A]/10 z-20 pointer-events-none group-hover:border-[#045C9A]/10 dark:group-hover:border-white/10 transition-colors" />

          {/* Video Playback — the level-linked growth animation. */}
          {ANIMATION_SEQUENCE.map((src, index) => (
            <video
              key={`${isFemale ? "female" : "male"}-${index}`}
              ref={(el) => (videoRefs.current[index] = el)}
              src={src}
              className={`absolute inset-0 w-full h-full object-cover object-[center_top] transition-opacity duration-700 ease-in-out ${
                index <= visibleVideoIndex ? "opacity-100" : "opacity-0"
              } ${index === visibleVideoIndex ? "z-10" : "z-0"}`}
              muted
              playsInline
              preload="auto"
              loop={index === ANIMATION_SEQUENCE.length - 1}
              onEnded={() => handleVideoEnded(index)}
              onPlaying={() => {
                if (index === currentVideoIndex) {
                  setVisibleVideoIndex(index);
                }
              }}
            />
          ))}

          {/* Floating Level Badge */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-2 inset-x-2 bg-white/95 dark:bg-[#0d3a5f]/90 backdrop-blur-md rounded-lg border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col gap-1.5 px-2.5 py-2 z-30"
          >
            {/* Label row: level on the left, progress read-out on the right. */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 shrink-0 rounded-md bg-[#0E2136] dark:bg-[#A6D7E8] flex items-center justify-center">
                  <Star fill={1} className="w-3 h-3 text-white dark:text-[#072036]" />
                </span>
                <span className="truncate text-[11px] font-bold tracking-tight text-[#0E2136] dark:text-white">
                  {t('common.level', 'Level')} {avatarData?.level || 1}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {Math.round(clampedLevelProgress)}%
              </span>
            </div>

            {/* Full-width track so an early-level bar still reads as a bar. */}
            <div
              className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(clampedLevelProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('common.level', 'Level')}
            >
              <motion.div
                className="h-full rounded-full bg-[#045C9A] dark:bg-[#A6D7E8]"
                initial={{ width: 0 }}
                animate={{ width: `${clampedLevelProgress}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Profile Info & Actions */}
      <div className="relative z-10 p-4 space-y-3">
        <div className="text-center space-y-0.5 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {user?.fullName || "Student"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            {t(`common.${(user?.role || "student").toLowerCase()}`)}
          </p>
        </div>

        {/* Two actions only. Skills Passport lived here as well, but the
            sidebar already links to it -- a third button made this the
            tallest part of the card for a duplicate route. */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose?.();
              navigate("/dashboard/profile");
            }}
            className="group w-full h-11 px-4 rounded-xl flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-[#072036] dark:hover:bg-[#045C9A] border border-slate-200 dark:border-white/5 transition-colors active:scale-[0.98]"
          >
            <User className="w-4 h-4 text-[#072036] dark:text-white group-hover:text-white" />
            <span className="text-sm font-bold tracking-tight text-[#072036] dark:text-white group-hover:text-white">
              {t("sidebar.profile")}
            </span>
          </button>

          <button
            onClick={() => {
              onClose?.();
              onLogout();
            }}
            className="group w-full h-11 px-4 rounded-xl flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-500/10 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-bold tracking-tight">
              {t("sidebar.logout")}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHoverCard;
