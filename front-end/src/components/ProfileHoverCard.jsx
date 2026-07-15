import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IconChevronRight as ChevronRight,
  IconStar as Star,
  IconLogout as LogOut,
  IconTrophy as Trophy,
  IconUser as User,
} from "@tabler/icons-react";

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

  const levelProgress =
    avatarData?.levelProgress ||
    Math.min(
      100,
      Math.round(
        ((avatarData?.xp || 0) / (avatarData?.xpToNextLevel || 100)) * 100
      )
    );

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
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1a3884]/20 bg-white dark:bg-[#00152E] shadow-2xl"
      style={{
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-[#F8FAFC] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-blue-900/40 dark:via-[#0f172a] dark:to-[#0f172a]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30 dark:opacity-50" />

      {/* Animation Section */}
      <div className="relative z-10 pt-4 px-4 pb-2">
        <div className="relative aspect-[4/5] w-full mx-auto rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-white/10 shadow-2xl flex items-center justify-center bg-slate-100 dark:bg-black/40 backdrop-blur-sm group max-h-[200px]">
          {/* Inner Glow Border */}
          <div className="absolute inset-0 rounded-xl border border-slate-200/50 dark:border-[#1a3884]/10 z-20 pointer-events-none group-hover:border-[#1a3884]/10 dark:group-hover:border-white/10 transition-colors" />

          {/* Video Playback */}
          {ANIMATION_SEQUENCE.map((src, index) => (
            <video
              key={`${isFemale ? "female" : "male"}-${index}`}
              ref={(el) => (videoRefs.current[index] = el)}
              src={src}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
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
            className="absolute bottom-2 inset-x-2 h-8 bg-white/90 dark:bg-black/40 backdrop-blur-md rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between px-2 z-30"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-slate-800 dark:text-white font-bold text-xs tracking-wide">
                {t('common.level_short', 'Lvl')} {avatarData?.level || 1}
              </span>
            </div>
            <div className="w-12 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full"
                style={{ width: `${levelProgress}%` }}
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

        <div className="space-y-2">
          {/* Skills Passport Button */}
          <button
            onClick={() => {
              onClose?.();
              navigate("/dashboard/skills-passport");
            }}
            className="group relative w-full h-11 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98] overflow-hidden flex items-center justify-center gap-2"
          >
            <Trophy className="w-4.5 h-4.5" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {t('sidebar.skills_passport', 'Skills Passport')}
            </span>
            <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex justify-center">
            <button
              onClick={() => {
                onClose?.();
                navigate("/dashboard/profile");
              }}
              className="group w-full h-11 px-6 py-2.5 rounded-xl flex justify-center items-center text-[#112b6b] bg-slate-100 dark:bg-white/5 hover:bg-[#112b6b] dark:hover:bg-[#1a3884] border border-slate-200 dark:border-white/5 transition-all duration-300 active:scale-95"
            >
              <div className="w-8 h-8 flex items-center justify-center transition-colors">
                <User className="w-4 h-4 text-[#112b6b] font-bold dark:text-white group-hover:text-white" />
              </div>
              <span className="text-sm font-bold text-[#112b6b] dark:text-white group-hover:text-white tracking-tight">
                {t("sidebar.profile")}
              </span>
            </button>
          </div>

          {/* Premium Logout Button */}
          <div className="pt-1 border-t border-slate-100 dark:border-[#1a3884]/15 flex justify-center">
            <button
              onClick={() => {
                onClose?.();
                onLogout();
              }}
              className="group w-full h-11 px-6 py-2.5 rounded-xl flex justify-center items-center text-rose-500 hover:bg-rose-500/10 transition-all duration-300 active:scale-95"
            >
              <div className="w-8 h-8 flex items-center justify-center transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                {t("sidebar.logout")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHoverCard;
