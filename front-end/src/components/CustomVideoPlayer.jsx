import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical,
  Loader2,
  Settings,
  PictureInPicture2,
  Gauge
} from 'lucide-react';

const CustomVideoPlayer = ({ videoUrl, title, duration, poster, initialMaxTime = 0, initialCompleted = false, onProgressUpdate }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [maxTimeReached, setMaxTimeReached] = useState(initialMaxTime);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [ripples, setRipples] = useState([]);
  const controlsTimeoutRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const lastUrlRef = useRef(videoUrl);

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
  }, [maxTimeReached, isCompleted]);

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
          <VolumeX className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#002147' }}>Video Unavailable</h3>
        <p className="text-sm max-w-xs text-center" style={{ color: '#30919D' }}>
          {hasError ? "We encountered an error loading this video source." : "No valid video URL was provided for this lesson."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200 cursor-pointer select-none"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="w-full h-full object-contain bg-black"
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
            className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-30"
          >
            <Loader2 className="w-12 h-12 text-[#002147] animate-spin" />
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
            background: 'radial-gradient(circle, rgba(0, 33, 71, 0.4) 0%, transparent 70%)',
          }}
        />
      ))}

      {/* Center Play/Pause Large Icon on Click (Visual Feedback) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <AnimatePresence>
          {!isPlaying && !isLoading && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-[#002147]"
            >
              <Play className="w-10 h-10 fill-[#002147] ml-1" style={{ color: '#002147' }} />
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
            className="absolute bottom-0 left-0 right-0 pt-16 pb-3 sm:pb-4 px-3 sm:px-6 bg-gradient-to-t from-white via-white/95 to-transparent z-40 transition-opacity duration-300 border-t border-gray-200"
          >
            {/* Scrubber Container */}
            <div className="relative group/scrubber mb-4">
              {/* Background Track */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                {/* Progress Bar */}
                <div
                  className="h-full bg-gradient-to-r from-[#002147] to-[#30919D]"
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
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg pointer-events-none transition-transform scale-0 group-hover/scrubber:scale-100"
                style={{ left: `calc(${(currentTime / videoDuration) * 100}% - 8px)`, backgroundColor: '#002147' }}
              />
            </div>

            {/* Bottom Row Controls */}
            <div className="flex items-center justify-between gap-1 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-4">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="hover:text-[#30919D] transition-colors p-1" style={{ color: '#002147' }}>
                  {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />}
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-1 sm:gap-2 group/volume">
                  <button onClick={toggleMute} className="hover:text-[#30919D] transition-colors p-1" style={{ color: '#002147' }}>
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                  <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300 flex items-center h-8">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full accent-[#002147] h-1"
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="text-[10px] sm:text-xs font-medium tabular-nums border-l border-gray-300 pl-2 sm:pl-4 h-4 flex items-center" style={{ color: '#002147' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1 opacity-50">/</span>
                  <span className="opacity-70">{formatTime(videoDuration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* Title / Info - Only shown when wide enough */}
                <div className="hidden lg:block">
                  <span className="text-[10px] font-bold uppercase tracking-widest mr-2" style={{ color: '#30919D', opacity: 0.6 }}>Now Playing</span>
                  <span className="text-sm font-semibold truncate max-w-[200px] inline-block align-middle" style={{ color: '#002147' }}>{title}</span>
                </div>

                {/* Playback Speed Control */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCompleted) {
                        setShowSpeedMenu(!showSpeedMenu);
                      }
                    }}
                    className={`transition-colors p-1 flex items-center gap-1 ${isCompleted ? 'hover:text-[#30919D] cursor-pointer' : 'opacity-40 cursor-not-allowed'
                      }`}
                    style={{ color: '#002147' }}
                    title={isCompleted ? 'Playback Speed' : '🔒 Complete video to unlock'}
                  >
                    <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-xs font-semibold">{playbackSpeed}x</span>
                  </button>

                  {/* Speed Menu Dropdown */}
                  <AnimatePresence>
                    {showSpeedMenu && isCompleted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`w-full px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${playbackSpeed === speed ? 'bg-slate-100 font-bold' : ''
                              }`}
                            style={{ color: playbackSpeed === speed ? '#002147' : '#002147' }}
                          >
                            {speed}x {speed === 1 ? '(Normal)' : ''}
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
                    className={`transition-colors p-1 ${isCompleted ? 'hover:text-[#30919D] cursor-pointer' : 'opacity-40 cursor-not-allowed'
                      }`}
                    style={{ color: '#002147' }}
                    title={isCompleted ? 'Picture-in-Picture' : '🔒 Complete video to unlock'}
                  >
                    <PictureInPicture2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="hover:text-[#30919D] transition-colors p-1.5 sm:p-1" style={{ color: '#002147' }}>
                  {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Gradient Overlay for Info (Persistent on hover) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/95 to-transparent pointer-events-none p-6 border-b border-gray-200"
          >
            <h4 className="font-bold text-lg drop-shadow-sm" style={{ color: '#002147' }}>{title}</h4>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomVideoPlayer;
