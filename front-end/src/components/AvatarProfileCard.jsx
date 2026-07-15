/**
 * Avatar Profile Card Component
 * Displays a sequential animation based on user progress/lifecycle.
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Trophy,
  Star,
  ChevronRight,
  Eye,
  EyeOff,
  LogOut,
  User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAvatar from '@/hooks/useAvatar';
import useUser from "@/hooks/useUser";

// Import Video Assets
import ToddlerBoyIdle from '@/assets/Animations/ToddlerBoyIdle.mp4';
import ToddlerBoyGrowing from '@/assets/Animations/ToddlerBoyGrowing.mp4';
import PreteenBoyIdle from '@/assets/Animations/PreteenBoyIdle.mp4';
import PreteenBoyGrowing from '@/assets/Animations/PreteenBoyGrowing.mp4';
import TeenBoyIdle from '@/assets/Animations/TeenBoyIdle.mp4';
import TeenBoyGrowing from '@/assets/Animations/TeenBoyGrowing.mp4';
import ManIdle from '@/assets/Animations/ManIdle.mp4';

// Import Female Video Assets
import ToddlerGirlIdle from '@/assets/Animations/ToddlerGirlIdle.mp4';
import ToddlerGirlGrowing from '@/assets/Animations/ToddlerGirlGrowing.mp4';
import PreteenGirlIdle from '@/assets/Animations/PreeteenGirlIdle.mp4';
import PreteenGirlGrowing from '@/assets/Animations/PreteenGirlGrowing.mp4';
import TeenGirlIdle from '@/assets/Animations/TeenGirlIdle.mp4';
import TeenGirlGrowing from '@/assets/Animations/TeenGirlGrowing.mp4';
import WomanIdle from '@/assets/Animations/WomanIdle.mp4';

const MALE_SEQUENCE = [
  ToddlerBoyIdle,
  ToddlerBoyGrowing,
  PreteenBoyIdle,
  PreteenBoyGrowing,
  TeenBoyIdle,
  TeenBoyGrowing,
  ManIdle
];

const FEMALE_SEQUENCE = [
  ToddlerGirlIdle,
  ToddlerGirlGrowing,
  PreteenGirlIdle,
  PreteenGirlGrowing,
  TeenGirlIdle,
  TeenGirlGrowing,
  WomanIdle
];

const AvatarProfileCard = ({ user = {}, className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRefs = useRef([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(0);

  const {
    avatarData,
  } = useAvatar();

  // Get logout from UserContext to properly clear backend session
  const { logout } = useUser();

  // Determine which sequence to use based on gender
  // Check both the user prop (from login/session) and avatarData (from separate API fetch)
  const userGender = user?.gender || avatarData?.user?.gender;
  const normalizedGender = userGender?.toLowerCase()?.trim();
  const isFemale = ['female', 'girl', 'woman'].includes(normalizedGender);
  const ANIMATION_SEQUENCE = isFemale ? FEMALE_SEQUENCE : MALE_SEQUENCE;

  useEffect(() => {
    console.log('[AvatarProfileCard] Gender Debug:', {
      userPropGender: user?.gender,
      avatarDataGender: avatarData?.user?.gender,
      resolvedGender: userGender,
      isFemaleDetected: isFemale,
      sequenceUsed: isFemale ? 'FEMALE' : 'MALE'
    });
  }, [user?.gender, avatarData?.user?.gender, userGender, isFemale]);

  const levelProgress = avatarData?.levelProgress ||
    Math.min(100, Math.round(((avatarData?.xp || 0) / (avatarData?.xpToNextLevel || 100)) * 100));

  const handleVideoEnded = (index) => {
    if (index < ANIMATION_SEQUENCE.length - 1) {
      setCurrentVideoIndex(index + 1);
    }
    // If it's the last video (ManIdle), logic handles looping via the 'loop' attribute
  };

  // Reset indices when gender changes to restart the sequence
  useEffect(() => {
    setCurrentVideoIndex(0);
    setVisibleVideoIndex(0);
    // Explicitly pause any existing videos in the ref array to be clean
    videoRefs.current.forEach(v => v?.pause());
  }, [isFemale]);

  useEffect(() => {
    // Ensure all videos obey the current index state
    if (videoRefs.current[currentVideoIndex]) {
      const video = videoRefs.current[currentVideoIndex];
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented or interrupted:", error);
        });
      }
    }

    // Pause all other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentVideoIndex) {
        video.pause();
      }
    });
  }, [currentVideoIndex, isFemale]); // Add isFemale to trigger play when sequence swaps

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1a1f35] to-[#0f172a] shadow-2xl ${className}`}
      style={{
        boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 40px rgba(99, 102, 241, 0.15)'
      }}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
      </div>

      {/* Top Glow Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/80 to-transparent opacity-70" />
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent opacity-50" />

      {/* Animation Section - Floating Card Style */}
      <div className="relative z-10 pt-6 px-6 pb-2">
        <div className="relative aspect-[4/5] w-full mx-auto rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md group">

          {/* Animated Inner Glow Border */}
          <div className="absolute inset-0 rounded-2xl border border-white/5 z-20 pointer-events-none group-hover:border-purple-500/30 transition-all duration-500" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-purple-500/10 to-transparent z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Video Playback */}
          {ANIMATION_SEQUENCE.map((src, index) => (
            <video
              key={`${isFemale ? 'female' : 'male'}-${index}`}
              ref={el => videoRefs.current[index] = el}
              src={src}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${index <= visibleVideoIndex ? 'opacity-100' : 'opacity-0'
                } ${index === visibleVideoIndex ? 'z-10' : 'z-0'}`}
              muted
              playsInline
              preload={index === currentVideoIndex ? "auto" : "metadata"}
              loop={index === ANIMATION_SEQUENCE.length - 1} // Only loop the last video
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
            className="absolute bottom-3 inset-x-3 h-11 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-xl rounded-xl border border-white/10 flex items-center justify-between px-3 z-30 shadow-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">{t('common.level', 'Level')} {avatarData?.level || 1}</span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500 rounded-full shadow-lg shadow-orange-500/30"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Profile Info & Actions */}
      <div className="relative z-10 p-5 space-y-4">
        <div className="text-center space-y-1.5 flex flex-col items-center justify-center">
          <h3 className="text-2xl font-bold text-white tracking-tight">{user.fullName || 'Student'}</h3>
          <p className="text-purple-300 text-sm font-semibold uppercase tracking-wider">{t(`common.${(user.role || 'student').toLowerCase()}`)}</p>
        </div>

        <div className="space-y-3">
          {/* Feature Action: Skills Passport */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/skills-passport')}
            className="group relative w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-2">
              <Trophy className="w-4.5 h-4.5" />
              <span className="text-sm font-bold uppercase tracking-wide">{t('sidebar.skills_passport', 'Skills Passport')}</span>
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* Primary Action: View Profile */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/profile')}
              className="group px-6 py-2.5 rounded-xl flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">{t('sidebar.profile')}</span>
            </motion.button>
          </div>

          {/* Premium Logout Button */}
          <div className="pt-1 border-t border-white/5 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                await logout();
                navigate('/', { replace: true });
              }}
              className="group px-6 py-2.5 rounded-xl flex items-center gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight">{t('sidebar.logout')}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AvatarProfileCard;
