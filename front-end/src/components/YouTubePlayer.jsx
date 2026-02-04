import { useState } from 'react';
import YouTube from 'react-youtube';
import { motion } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';

/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
const extractVideoId = (url) => {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

const YouTubePlayer = ({ videoUrl, title, duration }) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoId = extractVideoId(videoUrl);

  // YouTube player options
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  const onReady = (event) => {
    setIsReady(true);
  };

  const onError = (event) => {
    console.error('YouTube Player Error:', event);
    setHasError(true);
  };

  // If no valid video ID, show placeholder
  if (!videoId || hasError) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center shadow-lg mb-4 mx-auto"
          >
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </motion.div>
          <p className="text-gray-600 font-medium">
            {hasError ? 'Video unavailable' : 'No video available'}
          </p>
        </div>
        {duration && (
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {duration}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black">
      {/* Loading indicator */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Loading video...</p>
          </div>
        </div>
      )}
      
      {/* YouTube Player */}
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onError={onError}
        className="absolute inset-0 w-full h-full"
        iframeClassName="w-full h-full"
      />
      
      {/* Duration badge */}
      {duration && isReady && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm z-20">
          {duration}
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
