import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ClipboardList, Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import FloatingDictionary from "@/components/FloatingDictionary";
import blueLogo from "@/assets/blue.png";
import { Link } from "react-router-dom";

const StarIcon = ({ color }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill={color} 
    style={{ width: '20px', height: '20px' }}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const FiveModuleRoadmap = ({ courseData, onModuleSelect }) => {
  const navyBlue = '#1a3884'; 
  const silver = '#C0C0C0'; 
  const cream = '#F5F2ED'; 
  const white = '#FFFFFF';
  const tan = '#A68B5C';
  const cardNavy = '#112558';

  const defaultModules = [
    { id: 1, title: "Foundations of Capacity Building", level: 1 },
    { id: 2, title: "Self-Assessment & SWOT Analysis", level: 2 },
    { id: 3, title: "Goal Setting & Planning", level: 3 },
    { id: 4, title: "Leadership & Team Building", level: 4 },
    { id: 5, title: "Resource Management", level: 5 },
    { id: 6, title: "Process Optimization", level: 6 },
    { id: 7, title: "Marketing & Strategy", level: 7 },
    { id: 8, title: "Financial Literacy", level: 8 },
    { id: 9, title: "Risk Mitigation", level: 9 },
    { id: 10, title: "Final Review & Grading", level: 10 },
  ];

  const [localProgress, setLocalProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('smaart_demo_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Always ensure 10 modules are shown by padding courseData with defaults
  const displayModules = Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    const m = courseData?.modules?.[i];
    return {
      id: m?.id || level,
      level: level,
      title: m?.title || defaultModules[i].title,
      progress: localProgress[level] ? 100 : 0,
    };
  });

  const actualActiveLevel = displayModules.find(m => m.progress < 100)?.level || 10;
  
  const [visualActiveLevel, setVisualActiveLevel] = useState(() => {
    const lastActive = parseInt(localStorage.getItem('smaart_last_active') || '1', 10);
    return Math.min(lastActive, actualActiveLevel); // Start from what they saw last
  });

  // Safe state initialization
  const [selectedModule, setSelectedModule] = useState(displayModules.find(m => m.progress < 100) || displayModules[0]);

  const scrollRef = useRef(null);

  useEffect(() => {
    const ele = scrollRef.current;
    if (!ele) return;

    if (actualActiveLevel > visualActiveLevel) {
      // 1. Instantly snap camera to previously active module
      ele.scrollLeft = Math.max(0, (visualActiveLevel - 1) * 350 - 200);

      // 2. Smoothly scroll to the newly unlocked module after a brief pause
      const scrollTimer = setTimeout(() => {
        ele.scrollTo({
          left: Math.max(0, (250 + (actualActiveLevel - 1) * 350) - (window.innerWidth / 2)),
          behavior: 'smooth'
        });
      }, 600);

      // 3. Trigger the unlock sequence state exactly when the camera arrives
      const unlockTimer = setTimeout(() => {
        setVisualActiveLevel(actualActiveLevel);
        localStorage.setItem('smaart_last_active', actualActiveLevel.toString());
      }, 1600);

      return () => { clearTimeout(scrollTimer); clearTimeout(unlockTimer); };
    } else {
      // Normal map load, just center on current
      ele.scrollLeft = Math.max(0, (250 + (actualActiveLevel - 1) * 350) - (window.innerWidth / 2));
      setVisualActiveLevel(actualActiveLevel);
      localStorage.setItem('smaart_last_active', actualActiveLevel.toString());
    }
  }, [actualActiveLevel, visualActiveLevel]);

  const handleModuleClick = (module) => {
    const newProgress = { ...localProgress, [module.level]: 100 };
    setLocalProgress(newProgress);
    localStorage.setItem('smaart_demo_progress', JSON.stringify(newProgress));
    
    if (onModuleSelect) {
      onModuleSelect(module);
    }
  };

  const { scrollX } = useScroll({ container: scrollRef });
  const yVerticalOffset = useTransform(scrollX, v => v * (45 / 350));

  const pathWidth = 3800;
  const pathHeight = 1000; 

  // Generate path points (diagonal rising linear path)
  const points = displayModules.map((_, i) => ({
    x: 250 + i * 350,
    y: pathHeight - 580 - (i * 45) 
  }));

  const pathD = `M ${points[0].x} ${points[0].y} ` + 
    points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{
      height: '100vh',
      backgroundColor: cream,
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '40px', left: '300px', zIndex: 10, pointerEvents: 'none' }}>
        <div className="flex flex-col gap-4 mb-4">
          <Link 
            to="/dashboard/courses" 
            style={{ 
              pointerEvents: 'auto', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              color: navyBlue,
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              opacity: 0.8,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <ArrowLeft size={16} />
            Back to My Courses
          </Link>
        </div>
        <h1 style={{ 
          color: navyBlue, 
          fontSize: '38px', 
          fontWeight: '900', 
          fontFamily: "'Inter', sans-serif", 
          margin: 0,
          textShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
          Your Learning Journey
        </h1>
      </div>

      {/* TOP SECTION: The Diagonal Hanging Path */}
      <div 
        ref={scrollRef}
        onMouseDown={(e) => {
          const ele = scrollRef.current;
          if (!ele) return;
          ele.style.cursor = 'grabbing';
          ele.onmousemove = (mv) => {
            ele.scrollLeft -= mv.movementX;
          };
        }}
        onMouseUp={() => {
          const ele = scrollRef.current;
          if (ele) {
            ele.style.cursor = 'grab';
            ele.onmousemove = null;
          }
        }}
        onMouseLeave={() => {
          const ele = scrollRef.current;
          if (ele) {
            ele.style.cursor = 'grab';
            ele.onmousemove = null;
          }
        }}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          position: 'relative',
          background: `linear-gradient(to bottom, ${cream}, #E8E5DF)`,
          cursor: 'grab',
          userSelect: 'none' // Prevent text selection while dragging
        }}
      >
        <div style={{ 
          position: 'relative', 
          minWidth: pathWidth, 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          
          <motion.svg width={pathWidth} height={pathHeight} style={{ 
            position: 'absolute', 
            top: '50%', 
            left: 0, 
            marginTop: '-500px',
            y: yVerticalOffset,
            overflow: 'visible' 
          }}>
            {/* The main diagonal wire path */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="#D1D5DB" 
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {points.map((p, i) => {
              const module = displayModules[i];
              const isSelected = selectedModule?.level === module.level;
              const isCompleted = module.progress === 100;
              const isCurrent = module.level === visualActiveLevel && !isCompleted;
              const isLocked = module.level > visualActiveLevel;
              
              return (
                <g key={i} onClick={() => !isLocked && setSelectedModule(module)} style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.8 : 1 }}>
                  {/* Wire connecting card to path */}
                  <motion.line 
                    x1={p.x} y1={p.y} x2={p.x} y2={p.y + 60} 
                    animate={{ stroke: isLocked ? "#9CA3AF" : silver }} 
                    strokeWidth="1.5" 
                    transition={{ duration: 0.6 }}
                  />
                  
                  {/* Path Node */}
                  <motion.circle 
                    cx={p.x} cy={p.y} r="8" 
                    animate={{ fill: isCurrent || isCompleted ? silver : "#D1D5DB" }} 
                    transition={{ duration: 0.6 }}
                  />
                  {isCurrent && (
                    <>
                      <motion.circle 
                        cx={p.x} cy={p.y} r="15" 
                        fill="none" stroke={silver} strokeWidth="2" 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [0.8, 1.4], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                      />
                      <motion.circle 
                        cx={p.x} cy={p.y} r="8" 
                        fill={silver}
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    </>
                  )}

                  {/* The Hanging Card */}
                  <foreignObject
                    x={p.x - 90}
                    y={p.y + 60}
                    width="180" // Smaller width
                    height="260" // Smaller height
                  >
                    <motion.div
                      animate={{ 
                        backgroundColor: isCurrent ? navyBlue : cardNavy,
                        boxShadow: isCurrent 
                          ? `0 0 20px ${silver}, 0 0 40px ${silver}44, inset 0 0 10px ${silver}33` 
                          : (isSelected ? `0 0 15px ${silver}66` : '0 10px 25px rgba(0,0,0,0.3)'),
                        borderColor: isCurrent || (isSelected && !isLocked) ? silver : 'transparent',
                      }}
                      transition={{ duration: 0.6 }}
                      style={{
                        borderRadius: '0px',
                        padding: '16px 14px', // Reduced padding
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '2px solid transparent',
                        textAlign: 'center',
                        color: white,
                      }}
                    >
                      <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence mode="wait">
                          {isLocked ? (
                            <motion.div key="lock" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0, rotate: 90 }} transition={{ duration: 0.3 }}>
                              <Lock size={20} color={'rgba(255,255,255,0.4)'} />
                            </motion.div>
                          ) : isCompleted ? (
                            <motion.div key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}>
                              <CheckCircle2 size={20} color={silver} />
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="star" 
                              initial={{ opacity: 0, scale: 0, rotate: -180 }} 
                              animate={{ 
                                opacity: [1, 0.4, 1], 
                                scale: [1, 1.2, 1], 
                                rotate: 0 
                              }} 
                              exit={{ opacity: 0, scale: 0 }} 
                              transition={{ 
                                opacity: { repeat: Infinity, duration: 1.5 },
                                scale: { repeat: Infinity, duration: 1.5 },
                                default: { type: 'spring', stiffness: 200, damping: 10 }
                              }}
                            >
                              <StarIcon color={silver} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '8px 0 2px', color: isLocked ? 'rgba(192, 192, 192, 0.5)' : silver }}>
                          Module {module.level}
                        </h3>
                        <p style={{ fontSize: '11px', opacity: isLocked ? 0.4 : 0.8, margin: 0, fontWeight: '500', minHeight: '32px', lineHeight: '1.3' }}>
                          {module.title}
                        </p>
                      </div>

                      <div style={{ width: '100%', padding: '0 5px', opacity: isLocked ? 0.3 : 1 }}>
                        <div style={{ 
                          width: '100%', 
                          height: '6px', // Slimmer bar
                          backgroundColor: 'rgba(255,255,255,0.1)', 
                          borderRadius: '3px',
                          overflow: 'hidden',
                          marginBottom: '6px'
                        }}>
                          <div style={{ 
                            width: `${module.progress}%`, 
                            height: '100%', 
                            backgroundColor: silver, 
                            borderRadius: '3px' 
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: silver }}>
                          {module.progress}%
                        </span>
                      </div>

                      <motion.button
                        whileHover={!isLocked ? { scale: 1.05 } : {}}
                        whileTap={!isLocked ? { scale: 0.95 } : {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) handleModuleClick(module);
                        }}
                        style={{
                          backgroundColor: isLocked ? 'rgba(255,255,255,0.1)' : silver,
                          color: isLocked ? 'rgba(255,255,255,0.4)' : (isCompleted ? navyBlue : cardNavy),
                          border: 'none',
                          padding: '10px 0',
                          borderRadius: '0px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          textTransform: 'uppercase',
                          width: '100%',
                          marginTop: '4px'
                        }}
                      >
                        {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Continue'}
                      </motion.button>
                    </motion.div>
                  </foreignObject>
                </g>
              );
            })}
          </motion.svg>
        </div>
      </div>

      {/* BOTTOM SECTION: Detail Dashboard Bar */}
      <motion.div 
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        style={{
          height: '140px', // Slimmer height as per reference
          backgroundColor: white,
          borderTop: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 60px',
          boxShadow: '0 -15px 50px rgba(0,0,0,0.08)',
          zIndex: 150
        }}
      >
        <div style={{ flex: 1.5 }}>
          {selectedModule && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedModule.level}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    color: navyBlue, 
                    fontWeight: '900', 
                    margin: 0,
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: 'nowrap'
                  }}>
                    Now Learning Module {selectedModule.level}:
                  </h2>
                  <p style={{ 
                    fontSize: '18px', 
                    color: navyBlue, 
                    fontWeight: '500', 
                    margin: 0,
                    opacity: 0.7,
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedModule.title}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div style={{ flex: 4, display: 'flex', alignItems: 'center', gap: '30px', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'flex-end', maxWidth: '800px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: `1.5px solid ${navyBlue}`, 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: navyBlue,
              flexShrink: 0
            }}>
              <ClipboardList size={22} />
            </div>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
              <div style={{ 
                width: '100%', 
                height: '12px', 
                backgroundColor: '#F3F4F6', 
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedModule?.progress || 0}%` }}
                  style={{ 
                    height: '100%', 
                    backgroundColor: tan, 
                    borderRadius: '6px' 
                  }} 
                />
              </div>
            </div>
            <span style={{ fontSize: '20px', fontWeight: '900', color: navyBlue, minWidth: '50px' }}>
              {selectedModule?.progress || 0}%
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#b69a6d', boxShadow: '0 8px 25px rgba(166, 139, 92, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModuleClick(selectedModule)}
            style={{
              backgroundColor: tan,
              color: white,
              border: 'none',
              padding: '14px 35px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 5px 15px rgba(166, 139, 92, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Continue This Level
          </motion.button>
        </div>
      </motion.div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <FloatingDictionary />
    </div>
  );
};

export default FiveModuleRoadmap;

