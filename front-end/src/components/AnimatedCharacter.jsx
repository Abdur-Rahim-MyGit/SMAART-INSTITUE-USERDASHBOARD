import { motion } from "framer-motion";

// Polished Cute Baby Face - Boss Baby Style
const AnimatedCharacter = ({ gender = "male", className = "" }) => {
  const isMale = gender?.toLowerCase() !== "female";
  
  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.3))' }}
      >
        <defs>
          {/* Gradients for polished look */}
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fce8d5" />
            <stop offset="50%" stopColor="#f5d6bc" />
            <stop offset="100%" stopColor="#e8c4a0" />
          </linearGradient>
          
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isMale ? "#5c4033" : "#3d2314"} />
            <stop offset="50%" stopColor={isMale ? "#4a3228" : "#2d1810"} />
            <stop offset="100%" stopColor={isMale ? "#3d2820" : "#1f110a"} />
          </linearGradient>
          
          <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9999" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#ff8080" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff8080" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="eyeWhite" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f0f0" />
          </radialGradient>
          
          <radialGradient id="eyeIris" cx="40%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#4a3c31" />
            <stop offset="100%" stopColor="#2a1f17" />
          </radialGradient>
          
          <linearGradient id="earGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f5c4a0" />
            <stop offset="100%" stopColor="#e8b090" />
          </linearGradient>
          
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* HEAD - Main animated group */}
        <motion.g
          animate={{ 
            y: [0, -3, 0],
            rotate: [0, 1, 0, -1, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          style={{ transformOrigin: '100px 100px' }}
        >
          {/* Ears */}
          <ellipse cx="28" cy="105" rx="14" ry="20" fill="url(#earGradient)" />
          <ellipse cx="28" cy="105" rx="8" ry="12" fill="#e8a880" opacity="0.5" />
          <ellipse cx="172" cy="105" rx="14" ry="20" fill="url(#earGradient)" />
          <ellipse cx="172" cy="105" rx="8" ry="12" fill="#e8a880" opacity="0.5" />

          {/* Face shape - baby proportions */}
          <ellipse 
            cx="100" cy="105" rx="62" ry="68" 
            fill="url(#skinGradient)"
          />
          
          {/* Hair */}
          <g>
            {/* Main hair volume */}
            <path 
              d="M38 75 
                 Q35 45 60 30 
                 Q80 20 100 18 
                 Q120 20 140 30 
                 Q165 45 162 75
                 Q155 55 140 45
                 Q120 35 100 33
                 Q80 35 60 45
                 Q45 55 38 75 Z" 
              fill="url(#hairGradient)"
            />
            
            {/* Hair texture/waves */}
            <path 
              d="M50 60 Q55 45 70 38 Q60 50 55 62" 
              fill={isMale ? "#6b4d3a" : "#4a3020"}
              opacity="0.6"
            />
            <path 
              d="M70 50 Q80 35 95 32 Q85 42 75 55" 
              fill={isMale ? "#6b4d3a" : "#4a3020"}
              opacity="0.5"
            />
            <path 
              d="M100 48 Q115 32 130 35 Q118 42 108 52" 
              fill={isMale ? "#6b4d3a" : "#4a3020"}
              opacity="0.5"
            />
            <path 
              d="M130 50 Q145 40 155 55 Q145 50 135 55" 
              fill={isMale ? "#6b4d3a" : "#4a3020"}
              opacity="0.6"
            />
            
            {/* Hair highlight */}
            <path 
              d="M65 45 Q80 32 100 30 Q85 38 72 48 Z" 
              fill="#8a6b55"
              opacity="0.4"
            />
            
            {/* Side hair wisps */}
            <path 
              d="M42 70 Q38 80 40 90" 
              stroke="url(#hairGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <path 
              d="M158 70 Q162 80 160 90" 
              stroke="url(#hairGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          
          {/* Girl bow if female */}
          {!isMale && (
            <motion.g
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: '155px 45px' }}
            >
              <ellipse cx="145" cy="45" rx="12" ry="8" fill="#ec4899" />
              <ellipse cx="165" cy="45" rx="12" ry="8" fill="#ec4899" />
              <circle cx="155" cy="45" r="6" fill="#be185d" />
              <path d="M155 51 L153 65 L155 63 L157 65 L155 51" fill="#ec4899" />
            </motion.g>
          )}
          
          {/* Eyebrows */}
          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <path 
              d="M52 78 Q65 70 80 76" 
              stroke="#5c4033"
              strokeWidth="4" 
              fill="none" 
              strokeLinecap="round"
            />
            <path 
              d="M120 76 Q135 70 148 78" 
              stroke="#5c4033"
              strokeWidth="4" 
              fill="none" 
              strokeLinecap="round"
            />
          </motion.g>
          
          {/* Eyes */}
          <motion.g
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 4 }}
          >
            {/* Left Eye */}
            <ellipse cx="68" cy="100" rx="20" ry="22" fill="url(#eyeWhite)" />
            <motion.g
              animate={{ x: [0, 3, 0, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              {/* Iris */}
              <ellipse cx="70" cy="102" rx="13" ry="15" fill="url(#eyeIris)" />
              {/* Pupil */}
              <ellipse cx="71" cy="103" rx="7" ry="8" fill="#1a1410" />
              {/* Eye highlights */}
              <circle cx="75" cy="96" r="5" fill="white" opacity="0.95" />
              <circle cx="66" cy="106" r="2.5" fill="white" opacity="0.6" />
            </motion.g>
            
            {/* Right Eye */}
            <ellipse cx="132" cy="100" rx="20" ry="22" fill="url(#eyeWhite)" />
            <motion.g
              animate={{ x: [0, 3, 0, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              {/* Iris */}
              <ellipse cx="130" cy="102" rx="13" ry="15" fill="url(#eyeIris)" />
              {/* Pupil */}
              <ellipse cx="129" cy="103" rx="7" ry="8" fill="#1a1410" />
              {/* Eye highlights */}
              <circle cx="135" cy="96" r="5" fill="white" opacity="0.95" />
              <circle cx="126" cy="106" r="2.5" fill="white" opacity="0.6" />
            </motion.g>
          </motion.g>
          
          {/* Rosy Cheeks */}
          <motion.g
            animate={{ opacity: [0.7, 0.9, 0.7], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <ellipse cx="45" cy="125" rx="18" ry="12" fill="url(#cheekGlow)" />
            <ellipse cx="155" cy="125" rx="18" ry="12" fill="url(#cheekGlow)" />
          </motion.g>
          
          {/* Nose */}
          <ellipse cx="100" cy="125" rx="8" ry="6" fill="#e8b89c" />
          <path 
            d="M94 128 Q100 134 106 128" 
            stroke="#d4a080"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Mouth - Cute smile */}
          <motion.g
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Smile line */}
            <path 
              d="M75 148 Q100 165 125 148" 
              stroke="#c47070"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            {/* Upper lip hint */}
            <path 
              d="M85 147 Q100 142 115 147" 
              stroke="#d49090"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </motion.g>
          
          {/* Chin dimple hint */}
          <ellipse cx="100" cy="165" rx="4" ry="2" fill="#e0b8a0" opacity="0.5" />
        </motion.g>
      </svg>
    </motion.div>
  );
};

export default AnimatedCharacter;
