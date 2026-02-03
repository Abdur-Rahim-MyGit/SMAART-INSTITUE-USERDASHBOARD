import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const RetroScreen = ({ children, flashColor = null, isBooting = false }) => {
  const [scanlinePosition, setScanlinePosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanlinePosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center p-8">
      {/* CRT Monitor Frame */}
      <div className="relative">
        {/* Monitor Bezel */}
        <div className="relative bg-gradient-to-b from-gray-800 via-gray-700 to-gray-900 rounded-3xl p-8 shadow-2xl border-4 border-gray-900">
          {/* Screen Container */}
          <div className="relative bg-black rounded-2xl overflow-hidden" style={{ width: '800px', height: '600px' }}>
            {/* Screen Glow Effect */}
            <div className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent opacity-50"></div>

            {/* Flash Overlay */}
            {flashColor && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`absolute inset-0 ${
                  flashColor === 'green' ? 'bg-green-500' : 'bg-red-500'
                } mix-blend-screen`}
              />
            )}

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
                }}
              />
              {/* Moving scanline */}
              <div
                className="absolute w-full h-1 bg-gradient-to-b from-transparent via-green-400/30 to-transparent"
                style={{ top: `${scanlinePosition}%`, transition: 'top 0.05s linear' }}
              />
            </div>

            {/* CRT Curvature Effect */}
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" style={{
              boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5), inset 0 0 50px rgba(0,255,0,0.1)'
            }}></div>

            {/* Screen Flicker */}
            <motion.div
              animate={{ opacity: [0.97, 1, 0.97] }}
              transition={{ duration: 0.1, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 bg-green-500/5 pointer-events-none"
            />

            {/* Content Area */}
            <div className="relative h-full overflow-auto p-8 font-mono text-green-400">
              {isBooting ? (
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-green-500">SMAART MINDCARE SYSTEM v1.0</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span>Initializing neural pathways...</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <span>Loading mindfulness modules...</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    <span>System ready.</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ delay: 1.5, duration: 0.5, repeat: Infinity }}
                    className="inline-block"
                  >
                    <span>█</span>
                  </motion.div>
                </div>
              ) : (
                children
              )}
            </div>

            {/* Screen Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.8) 100%)'
            }}></div>
          </div>

          {/* Power LED */}
          <div className="absolute bottom-4 right-8 flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
            />
            <span className="text-xs text-gray-400 font-mono">PWR</span>
          </div>

          {/* Brand Label */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <span className="text-gray-500 font-bold text-sm tracking-wider">SMAART TERMINAL</span>
          </div>
        </div>

        {/* Monitor Stand */}
        <div className="mx-auto w-32 h-4 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-lg"></div>
        <div className="mx-auto w-48 h-3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full"></div>
      </div>
    </div>
  );
};

export default RetroScreen;
