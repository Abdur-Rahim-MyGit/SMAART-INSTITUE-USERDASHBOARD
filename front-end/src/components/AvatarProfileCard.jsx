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
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAvatar from '@/hooks/useAvatar';
import { useUser } from '@/contexts/UserContext';

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
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl ${className}`}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0f172a] to-[#0f172a]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

      {/* Animation Section - Floating Card Style */}
      <div className="relative z-10 pt-6 px-6 pb-2">
        <div className="relative aspect-[4/5] w-full mx-auto rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl flex items-center justify-center bg-black/40 backdrop-blur-sm group">

          {/* Inner Glow Border */}
          <div className="absolute inset-0 rounded-2xl border border-white/5 z-20 pointer-events-none group-hover:border-white/10 transition-colors" />

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
            className="absolute bottom-3 inset-x-3 h-10 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between px-3 z-30"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">Level {avatarData?.level || 1}</span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full" style={{ width: `${levelProgress}%` }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Profile Info & Actions */}
      <div className="relative z-10 p-5 space-y-4">
        <div className="text-center space-y-0.5">
          <h3 className="text-xl font-bold text-white tracking-tight">{user.fullName || 'Student'}</h3>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{user.role || 'Student'}</p>
        </div>

        <div className="space-y-2.5">
          {/* Primary Action: View Profile */}
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="group relative w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
          >
            <span className="text-sm font-medium relative z-10">View Profile</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all relative z-10" />
          </button>

          {/* Feature Action: Skills Passport */}
          <button
            onClick={() => navigate('/dashboard/skills-passport')}
            className="group relative w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98] overflow-hidden"
          >
            <div className="relative flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wide">Skills Passport</span>
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Secondary Action: Logout */}
          <button
            onClick={async () => {
              // Use UserContext logout to properly clear backend session
              await logout();
              navigate('/', { replace: true });
            }}
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-xs font-medium group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AvatarProfileCard;
