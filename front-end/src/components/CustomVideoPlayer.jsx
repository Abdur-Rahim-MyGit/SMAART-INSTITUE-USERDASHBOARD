import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Material Symbols barrel -- the icon set the dashboard, courses list, profile
// and course player all use. This file imported from lucide-react, so its icons
// rendered at a different weight and optical size to the rest of the product.
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture as Tv,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from "@/components/icons";
import Confetti from 'react-confetti';

const CustomVideoPlayer = forwardRef(({ videoUrl, title, duration, poster, initialMaxTime = 0, initialCompleted = false, autoPlay = false, onProgressUpdate, onTimeUpdate, onNext, nextLabel = "Next Lesson" }, ref) => {

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [maxTimeReached, setMaxTimeReached] = useState(initialMaxTime);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const controlsTimeoutRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const lastUrlRef = useRef(videoUrl);

  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (videoRef.current) {
        // Allow seeking to any point if completed, otherwise restrict to maxTimeReached
        const targetTime = isCompleted ? time : Math.min(time, maxTimeReached);
        
        // If user tries to seek past max time, showing a toast or indication might be good UI, 
        // but for now we just clamp it silently or maybe log.
        if (!isCompleted && time > maxTimeReached) {
            console.warn("Cannot seek past max watched time.");
        }

        videoRef.current.currentTime = targetTime;
        setCurrentTime(targetTime);
        if (!isPlaying) {
             videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      }
    },
    getCurrentTime: () => videoRef.current ? videoRef.current.currentTime : 0
  }));

  const syncProgress = (force = false) => {
    if (!onProgressUpdate || !videoRef.current) return;

    const duration = videoRef.current.duration || 0;

    // Sync if maxTime reached has moved by at least 1 second or force is true
    const delta = maxTimeReached - lastSyncTimeRef.current;
    if (force || delta >= 1 || isCompleted) {
      onProgressUpdate(maxTimeReached, isCompleted, duration);
      lastSyncTimeRef.current = maxTimeReached;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration || 0);
      }
      if (video.currentTime > maxTimeReached) {
        setMaxTimeReached(video.currentTime);
      }

      // Mark as completed if reached 99% of total duration or close to the end
      if (!isCompleted && video.duration > 0 && (video.currentTime / video.duration) > 0.99) {
        setIsCompleted(true);
        if (onProgressUpdate) {
          // Use full duration for maxTime when completed
          const finalTime = video.duration;
          setMaxTimeReached(finalTime);
          onProgressUpdate(finalTime, true, video.duration);
        }
      }
    };

    const handleSeeking = () => {
      // Prevent forward seeking past maxTimeReached
      if (video.currentTime > maxTimeReached && !isCompleted) {
        video.currentTime = maxTimeReached;
        setCurrentTime(maxTimeReached);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (!isCompleted) {
        setIsCompleted(true);
        if (onProgressUpdate) {
          setMaxTimeReached(video.duration);
          onProgressUpdate(video.duration, true, video.duration);
        }
      }
      // Show success animation whenever video ends
      setShowSuccess(true);
    };

    const handleDurationChange = () => setVideoDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [maxTimeReached, isCompleted, onTimeUpdate]);

  // Handle lesson switching
  useEffect(() => {
    if (videoUrl !== lastUrlRef.current) {
      setMaxTimeReached(initialMaxTime);
      setIsCompleted(initialCompleted);
      lastSyncTimeRef.current = initialMaxTime;
      lastUrlRef.current = videoUrl;
    }
  }, [videoUrl, initialMaxTime, initialCompleted]);

  // Sync progress periodically or on state change
  useEffect(() => {
    // Only auto-sync every 5 seconds of watching
    const delta = maxTimeReached - lastSyncTimeRef.current;
    if (delta >= 5 || isCompleted) {
      syncProgress();
    }
  }, [maxTimeReached, isCompleted]);

  // Handle page leave / pause
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncProgress(true);
      }
    };

    window.addEventListener('beforeunload', () => syncProgress(true));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', () => syncProgress(true));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [maxTimeReached, isCompleted]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Listen for security-blur event (from SecurityGuard) to auto-pause video
  useEffect(() => {
    const handleSecurityBlur = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
        syncProgress(true); // Sync immediately on pause
        console.log("🔒 Video auto-paused due to security privacy screen.");
      }
    };

    window.addEventListener("security-blur", handleSecurityBlur);
    return () => window.removeEventListener("security-blur", handleSecurityBlur);
  }, [maxTimeReached, isCompleted]);

  // Handle autoPlay on mount
  useEffect(() => {
    if (autoPlay && videoRef.current && !isPlaying) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay was prevented by the browser. Requires manual interaction.", error);
        });
      }
    }
  }, [autoPlay]);

  // Seek to initial time once video metadata or canplay is triggered
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (initialMaxTime > 0) {
        console.log(`Resuming video from initialMaxTime: ${initialMaxTime}s`);
        video.currentTime = initialMaxTime;
        setCurrentTime(initialMaxTime);
        setMaxTimeReached(initialMaxTime);
        lastSyncTimeRef.current = initialMaxTime;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    // In case the metadata is already loaded before the listener is attached:
    if (video.readyState >= 1 && initialMaxTime > 0) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoUrl, initialMaxTime]);

  // Check PiP support
  useEffect(() => {
    if (document.pictureInPictureEnabled && videoRef.current) {
      setIsPiPSupported(true);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, maxTimeReached);
          break;
        case 'arrowleft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [maxTimeReached]);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
      syncProgress(true); // Sync immediately on pause
    }
  };

  const toggleMute = () => {
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    videoRef.current.volume = value;
    setIsMuted(value === 0);
    videoRef.current.muted = value === 0;
  };

  const handleSeek = (e) => {
    let time = parseFloat(e.target.value);

    // Restriction: Cannot seek past maxTimeReached
    if (time > maxTimeReached) {
      time = maxTimeReached;
    }

    setCurrentTime(time);
    videoRef.current.currentTime = time;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Playback speed control
  const handleSpeedChange = (speed) => {
    if (!isCompleted) return; // Only allow if video is completed
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Picture-in-Picture
  const togglePiP = async () => {
    if (!isCompleted) return; // Only allow if video is completed
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  // Double-click for fullscreen
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    toggleFullscreen();
  };

  // Ripple effect on click
  const createRipple = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      x,
      y,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (e) => {
    createRipple(e);
    togglePlay();
  };



  if (!videoUrl || hasError) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center rounded-xl overflow-hidden border-2 border-gray-300">
        <div className="p-6 rounded-full bg-white shadow-md mb-4 group-hover:scale-110 transition-transform duration-500">
          <VolumeX className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#072036' }}>Video Unavailable</h3>
        <p className="text-sm max-w-xs text-center" style={{ color: '#045C9A' }}>
          {hasError ? "We encountered an error loading this video source." : "No valid video URL was provided for this lesson."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#d7ebf5] dark:border-[#045C9A]/30 cursor-pointer select-none transform-gpu bg-slate-950"
      style={{ transform: 'translateZ(0)' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Native Caption / Cue Styling */}
      <style dangerouslySetInnerHTML={{__html: `
        video::cue {
          background: rgba(15, 23, 42, 0.85) !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9) !important;
        }
      `}} />
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        playsInline
        webkit-playsinline="true"
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-30"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-[#045C9A]/20 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-[#045C9A] dark:text-[#A6D7E8] absolute animate-pulse" />
              </div>
              <span className="text-xs font-extrabold text-[#A6D7E8] tracking-widest uppercase">Loading Media...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple Effect */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute rounded-full pointer-events-none z-25"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '100px',
            height: '100px',
            marginLeft: '-50px',
            marginTop: '-50px',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, transparent 70%)',
          }}
        />
      ))}

      {/* Center Premium Glass Play/Pause Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <AnimatePresence>
          {!isPlaying && !isLoading && (
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              {/* Simple & Premium Play Button Container */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-[#045C9A] dark:bg-[#072036] dark:text-[#A6D7E8] shadow-2xl border border-[#d7ebf5] dark:border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[#045C9A]/20">
                <Play fill={1} className="w-7 h-7 sm:w-8 sm:h-8 ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-4 right-4 py-2.5 px-4 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border border-[#d7ebf5] dark:border-white/10 rounded-2xl z-40 transition-opacity duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
          >
            {/* Scrubber Container */}
            <div className="relative group/scrubber mb-3">
              {/* Background Track */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-[#d7ebf5] dark:bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                {/* Progress Bar with Simple Solid Color */}
                <div
                  className="h-full bg-[#045C9A] dark:bg-[#A6D7E8]"
                  style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                />
              </div>

              {/* Hidden range input for seeking */}
              <input
                type="range"
                min="0"
                max={videoDuration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="absolute top-1/2 -translate-y-1/2 left-0 right-0 w-full h-4 opacity-0 cursor-pointer z-10"
              />

              {/* Custom Thumb (Indicator) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full pointer-events-none transition-transform scale-0 group-hover/scrubber:scale-125 bg-[#045C9A] dark:bg-[#A6D7E8] ring-2 ring-white"
                style={{ left: `calc(${(currentTime / videoDuration) * 100}% - 7px)` }}
              />
            </div>

            {/* Bottom Row Controls */}
            <div className="flex items-center justify-between gap-1 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-3">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="text-slate-600 dark:text-slate-200 hover:text-[#045C9A] dark:hover:text-[#A6D7E8] hover:bg-[#EAF7FD] dark:hover:bg-white/10 p-2 rounded-xl transition-all duration-200 cursor-pointer"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? <Pause fill={1} className="w-5 h-5 sm:w-6 sm:h-6 text-[#045C9A] dark:text-[#A6D7E8]" /> : <Play fill={1} className="w-5 h-5 sm:w-6 sm:h-6 text-[#045C9A] dark:text-[#A6D7E8]" />}
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-1 group/volume">
                  <button
                    onClick={toggleMute}
                    className="text-slate-600 dark:text-slate-200 hover:text-[#045C9A] dark:hover:text-[#A6D7E8] hover:bg-[#EAF7FD] dark:hover:bg-white/10 p-2 rounded-xl transition-all duration-200 cursor-pointer"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-200" />}
                  </button>
                  <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300 flex items-center h-8">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full accent-[#045C9A] dark:accent-cyan-400 h-1 cursor-pointer bg-[#d7ebf5] dark:bg-white/20 rounded-lg"
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="text-[11px] sm:text-xs font-bold tabular-nums border-l border-[#d7ebf5] dark:border-white/15 pl-3 h-5 flex items-center text-slate-500 dark:text-slate-300">
                  <span className="text-[#045C9A] dark:text-[#A6D7E8]">{formatTime(currentTime)}</span>
                  <span className="mx-1 opacity-40">/</span>
                  <span className="opacity-70">{formatTime(videoDuration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Title / Info - Only shown when wide enough */}
                {title && (
                  <div className="hidden lg:flex items-center gap-2 bg-[#F1F5F9] dark:bg-white/5 border border-[#d7ebf5] dark:border-white/10 rounded-full px-3 py-1 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-[#045C9A] dark:bg-[#A6D7E8] animate-pulse shadow-[0_0_8px_rgba(26,56,132,0.5)] dark:shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8]">NOW PLAYING</span>
                    <span className="text-xs font-bold truncate max-w-[180px] text-[#072036] dark:text-white">{title}</span>
                  </div>
                )}

                {/* Playback Speed Control */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCompleted) {
                        setShowSpeedMenu(!showSpeedMenu);
                      }
                    }}
                    className={`transition-all duration-200 p-1.5 sm:px-2.5 sm:py-1 rounded-xl flex items-center gap-1 border border-[#d7ebf5] dark:border-white/10 ${
                      isCompleted 
                        ? 'hover:text-[#045C9A] dark:hover:text-[#A6D7E8] hover:border-[#045C9A]/40 dark:hover:border-[#A6D7E8]/40 hover:bg-[#EAF7FD] dark:hover:bg-white/10 cursor-pointer text-slate-600 dark:text-slate-200' 
                        : 'opacity-40 cursor-not-allowed text-slate-400 dark:text-white/50'
                    }`}
                    title={isCompleted ? 'Playback Speed' : '🔒 Complete video to unlock'}
                  >
                    <Settings className="w-4 h-4 sm:w-4 sm:h-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                    <span className="text-xs font-extrabold">{playbackSpeed}x</span>
                  </button>

                  {/* Speed Menu Dropdown */}
                  <AnimatePresence>
                    {showSpeedMenu && isCompleted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full mb-2 right-0 bg-white/95 dark:bg-[#0d3a5f]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#d7ebf5] dark:border-[#045C9A]/30 overflow-hidden min-w-[130px] p-1 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`w-full px-3 py-1.5 text-xs text-left rounded-xl transition-all flex items-center justify-between font-bold ${
                              playbackSpeed === speed 
                                ? 'bg-[#045C9A]/10 dark:bg-[#045C9A]/20 text-[#045C9A] dark:text-[#A6D7E8] border border-[#045C9A]/25 dark:border-[#045C9A]/30' 
                                : 'text-slate-600 dark:text-slate-300 hover:bg-[#EAF7FD] dark:hover:bg-white/10 hover:text-[#072036] dark:hover:text-white'
                            }`}
                          >
                            <span>{speed}x</span>
                            {speed === 1 && <span className="text-[10px] opacity-60 font-normal">(Normal)</span>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Picture-in-Picture */}
                {isPiPSupported && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCompleted) {
                        togglePiP();
                      }
                    }}
                    className={`transition-all duration-200 p-2 rounded-xl ${
                      isCompleted 
                        ? 'text-slate-600 dark:text-slate-200 hover:text-[#045C9A] dark:hover:text-[#A6D7E8] hover:bg-[#EAF7FD] dark:hover:bg-white/10 cursor-pointer' 
                        : 'opacity-40 cursor-not-allowed text-slate-400 dark:text-white/50'
                    }`}
                    title={isCompleted ? 'Picture-in-Picture' : '🔒 Complete video to unlock'}
                  >
                    <Tv className="w-5 h-5" />
                  </button>
                )}

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="text-slate-600 dark:text-slate-200 hover:text-[#045C9A] dark:hover:text-[#A6D7E8] hover:bg-[#EAF7FD] dark:hover:bg-white/10 p-2 rounded-xl transition-all duration-200 cursor-pointer"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* Success / Completion Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti — lighter count so it doesn't obscure the card */}
            <div className="absolute inset-0 pointer-events-none">
              <Confetti
                width={containerDimensions.width}
                height={containerDimensions.height}
                recycle={false}
                numberOfPieces={180}
                gravity={0.18}
                colors={['#045C9A', '#072036', '#FFD700', '#FFFFFF', '#34d399']}
              />
            </div>

            {/* Compact card */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
              className="relative bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-2xl rounded-2xl px-6 py-5 sm:px-8 sm:py-6 w-[90%] max-w-[280px] shadow-2xl border border-white/10 text-center"
            >
              {/* Subtle glow behind card */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#045C9A]/15 to-emerald-500/10 -z-10 blur-xl" />

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, delay: 0.3 }}
                className="w-11 h-11 sm:w-13 sm:h-13 mx-auto mb-2 sm:mb-3 relative"
              >
                <div className="w-11 h-11 sm:w-13 sm:h-13 mx-auto bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-current"
                    fill="none"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.45 }}
                    />
                  </motion.svg>
                </div>

                {/* Two tiny sparkles */}
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.7 + i * 0.5 }}
                    className="absolute"
                    style={{
                      left: `${50 + 48 * Math.cos(i * 2.5)}%`,
                      top: `${50 + 48 * Math.sin(i * 2.5)}%`,
                    }}
                  >
                    <Sparkles fill={1} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight tracking-tight">
                  Awesome Job! 🎉
                </h3>
                <p className="text-white/60 text-[10px] sm:text-[11px] font-semibold mt-1 mb-4">
                  Lesson completed successfully
                </p>
              </motion.div>

              {/* Action buttons — compact row */}
              <motion.div
                className="flex gap-2 justify-center items-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15
                             text-white/90 text-[10px] sm:text-[11px] font-bold hover:bg-white/5 hover:border-white/25
                             transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Replay
                </button>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    if (onNext) onNext();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl
                             bg-gradient-to-r from-[#045C9A] via-[#045C9A] to-[#045C9A]
                             text-white text-[10px] sm:text-[11px] font-bold
                             shadow-md shadow-[#072036]/30 hover:shadow-lg hover:shadow-[#045C9A]/20
                             transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  {onNext ? nextLabel : 'Continue'}
                  <Play fill={1} className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CustomVideoPlayer;

