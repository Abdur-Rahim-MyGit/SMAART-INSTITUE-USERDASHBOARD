import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight as ChevronIcon
} from "lucide-react";

/**
 * ModulePathway Component
 * @param {Array} modules - List of modules in the course
 * @param {Function} onModuleClick - Callback when a module is clicked
 * @param {Function} getModuleCompletedCount - Function to get completion status (returns {completed, total})
 */
const ModulePathway = ({ modules, onModuleClick, getModuleCompletedCount }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // --- Configuration ---
  const CARD_WIDTH = isMobile ? 260 : 300;
  const GAP_X = isMobile ? 100 : 200; 
  const NODE_X_SPACING = CARD_WIDTH + GAP_X; 
  const ROAD_Y = isMobile ? 320 : 350; 

  const MODULE_COLORS = [
    { border: '#0288D1', shadow: 'rgba(2, 136, 209, 0.4)', iconBg: 'rgba(2, 136, 209, 0.15)', color: '#0288D1' }, // Light Blue
    { border: '#0097A7', shadow: 'rgba(0, 151, 167, 0.4)', iconBg: 'rgba(0, 151, 167, 0.15)', color: '#0097A7' }, // Cyan/Teal
    { border: '#1976D2', shadow: 'rgba(25, 118, 210, 0.4)', iconBg: 'rgba(25, 118, 210, 0.15)', color: '#1976D2' }, // Blue
    { border: '#0277BD', shadow: 'rgba(2, 119, 189, 0.4)', iconBg: 'rgba(2, 119, 189, 0.15)', color: '#0277BD' }, // Ocean Blue
  ];

  const getColorConfig = (index) => MODULE_COLORS[index % MODULE_COLORS.length];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
    }
    return () => container?.removeEventListener('scroll', checkScroll);
  }, [modules]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = NODE_X_SPACING; 
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const getPosition = (index) => ({
    x: (isMobile ? 130 : 250) + index * NODE_X_SPACING, 
    y: ROAD_Y
  });

  const generateRoadPath = () => {
    if (modules.length === 0) return "";
    const startX = getPosition(0).x - (isMobile ? 150 : 300);
    const endX = getPosition(modules.length - 1).x + (isMobile ? 250 : 500);
    return `M ${startX} ${ROAD_Y} L ${endX} ${ROAD_Y}`;
  };

  if (!modules || modules.length === 0) return null;

  return (
    <div className="w-full relative select-none">
      {/* Navigation Buttons */}
      {!isMobile && (
        <>
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 ${!canScrollLeft ? 'opacity-0 scale-90 cursor-default' : 'hover:scale-110 text-slate-700 dark:text-slate-200 shadow-blue-500/10'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 ${!canScrollRight ? 'opacity-0 scale-90 cursor-default' : 'hover:scale-110 text-slate-700 dark:text-slate-200 shadow-blue-500/10'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className={`w-full ${isMobile ? 'h-[440px]' : 'h-[500px]'} overflow-x-auto overflow-y-hidden py-4 relative scrollbar-hide snap-x snap-mandatory perspective-1000`}
      >
        <div
          className="relative h-full"
          style={{ width: `${getPosition(modules.length - 1).x + (isMobile ? 300 : 500)}px` }}
        >
          {/* THE ROAD SVG */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="moduleRoadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>

            {/* Main Road Surface */}
            <path
              d={generateRoadPath()}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={isMobile ? "32" : "48"}
              strokeLinecap="round"
              className="dark:stroke-slate-800 opacity-60"
            />
            
            {/* Center Dashed Line */}
            <path
              d={generateRoadPath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="15 25"
              className="opacity-20"
            />
          </svg>

          {/* Goal Marker */}
          <div
            className="absolute z-10 font-bold text-slate-700 dark:text-white flex flex-col items-center text-center pointer-events-none"
            style={{
              left: `${getPosition(modules.length - 1).x + (isMobile ? 180 : 350)}px`,
              top: `${ROAD_Y}px`,
              transform: 'translateY(-50%)',
              width: isMobile ? '140px' : '200px'
            }}
          >
            <div className="bg-gradient-to-r from-emerald-400 to-green-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full mb-3 shadow-lg animate-pulse tracking-widest ring-4 ring-white/50 dark:ring-slate-800/50 uppercase">GRADUATION</div>
            <h3 className="text-sm font-black leading-tight drop-shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-slate-200 dark:border-slate-800">You're ready for<br />Certification!</h3>
          </div>

          {/* MODULE CARDS */}
          {modules.map((module, index) => {
            const pos = getPosition(index);
            const config = getColorConfig(index);
            const { completed, total } = getModuleCompletedCount(module.id);
            const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            // Unlock logic: First module unlocked, OR previous module has progress/done
            const isLocked = false; // All modules unlocked

            const isAbove = true;

            return (
              <div key={module.id} className="snap-center">
                {/* Visual Connector Dot on the Road */}
                <div 
                  className={`absolute w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border-4 z-20 shadow-2xl flex items-center justify-center transition-all duration-300 ${isLocked ? 'grayscale' : ''}`}
                  style={{ 
                    left: `${pos.x}px`, 
                    top: `${pos.y}px`, 
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    borderColor: isLocked ? '#e2e8f0' : config.color,
                    boxShadow: isLocked ? 'none' : `0 0 20px ${config.shadow}`
                  }}
                >
                  <div className="-rotate-45">
                     {isLocked ? <Lock size={16} className="text-slate-400" /> : <BookOpen size={18} style={{ color: config.color }} />}
                  </div>
                </div>

                {/* Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: isAbove ? -20 : 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="absolute"
                  style={{
                    left: `${pos.x - (CARD_WIDTH / 2)}px`,
                    top: isAbove ? `${pos.y - (isMobile ? 260 : 320)}px` : `${pos.y + (isMobile ? 60 : 80)}px`,
                    width: CARD_WIDTH,
                    zIndex: 50
                  }}
                >
                    <div
                      onClick={() => {
                        if (!isLocked) {
                          onModuleClick(module);
                        }
                      }}
                      className={`relative group ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {/* Connector Line between card and road dot */}
                      <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b ${isAbove ? 'top-full h-[60px] from-slate-200 via-slate-200 to-transparent' : 'bottom-full h-[60px] from-transparent via-slate-200 to-slate-200'} dark:via-slate-800 transition-opacity group-hover:opacity-100 opacity-40`} />

                      <div className={`
                        relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 
                        ${isLocked ? 'border-slate-100 dark:border-slate-800 opacity-80' : 'border-slate-200/50 dark:border-slate-800 hover:border-blue-500/30'} 
                        shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all duration-500 
                        ${!isLocked ? 'hover:-translate-y-2' : ''}
                      `}>
                        
                        {/* Header Color Strip */}
                        <div className="h-20 bg-gradient-to-br p-6 flex justify-between items-start"
                          style={{
                            backgroundImage: !isLocked 
                              ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`
                              : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                          }}
                        >
                          <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest opacity-90">
                            Module {String(module.id).padStart(2, '0')}
                          </div>
                          <div className="bg-white/95 dark:bg-slate-900 p-2 rounded-xl text-slate-700 dark:text-slate-300 shadow-md">
                            {isLocked ? (
                              <Lock size={16} />
                            ) : progressPercent === 100 ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                               <PlayCircle size={16} className="text-blue-600" />
                            )}
                          </div>
                        </div>

                      {/* Content */}
                      <div className="p-6 pt-2">
                        {/* Ambient Glow */}
                        {!isLocked && (
                          <div
                            className="absolute top-20 right-0 w-32 h-32 opacity-5 rounded-full blur-2xl"
                            style={{ background: config.color }}
                          />
                        )}

                        <h3 className={`text-base font-bold mb-2 pr-2 line-clamp-2 min-h-[2.5rem] transition-colors ${isLocked ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                          {module.title}
                        </h3>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6 line-clamp-2 h-8">
                          {module.description}
                        </p>

                        {/* Progress Bar */}
                        {!isLocked && total > 0 && (
                          <div className="mb-6 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Progress</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    style={{ backgroundColor: config.color }}
                                />
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) onModuleClick(module);
                          }}
                          className={`
                            w-full py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300
                            ${isLocked 
                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-100 dark:border-slate-800' 
                                : 'bg-slate-50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 border border-blue-50/50 dark:border-blue-900/30 hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
                            }
                          `}
                        >
                          {isLocked ? 'Locked' : progressPercent === 100 ? 'Review' : 'Continue'} <ChevronIcon size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModulePathway;
