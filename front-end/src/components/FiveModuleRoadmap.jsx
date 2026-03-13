import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList } from "lucide-react";
import FloatingDictionary from "@/components/FloatingDictionary";
import Navbar from "@/components/Navbar";

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
  const navyBlue = '#11224D'; 
  const gold = '#C9A45B'; 
  const cream = '#F5F2ED'; 
  const white = '#FFFFFF';
  const tan = '#A68B5C';
  const cardNavy = '#1A2A3A';

  const defaultModules = [
    { id: 1, title: "Foundations of Capacity Building", level: 1, progress: 100 },
    { id: 2, title: "Self-Assessment & SWOT Analysis", level: 2, progress: 85 },
    { id: 3, title: "Goal Setting & Planning", level: 3, progress: 75 },
    { id: 4, title: "Leadership & Team Building", level: 4, progress: 0 },
    { id: 5, title: "Resource Management", level: 5, progress: 0 },
    { id: 6, title: "Process Optimization", level: 6, progress: 0 },
    { id: 7, title: "Marketing & Strategy", level: 7, progress: 0 },
    { id: 8, title: "Financial Literacy", level: 8, progress: 0 },
    { id: 9, title: "Risk Mitigation", level: 9, progress: 0 },
    { id: 10, title: "Final Review & Grading", level: 10, progress: 0 },
  ];

  // Always ensure 10 modules are shown by padding courseData with defaults
  const displayModules = Array.from({ length: 10 }, (_, i) => {
    const m = courseData?.modules?.[i];
    if (m) {
      return {
        id: m.id || i + 1,
        level: i + 1,
        title: m.title || `Module ${i + 1}`,
        progress: m.progress || 0,
      };
    }
    return defaultModules[i];
  });

  // Safe state initialization
  const [selectedModule, setSelectedModule] = useState(displayModules[0] || null);

  const scrollRef = useRef(null);
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
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <Navbar />
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
          
          <svg width={pathWidth} height={pathHeight} style={{ 
            position: 'absolute', 
            top: '50%', 
            left: 0, 
            transform: 'translateY(-50%)', 
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
              
              return (
                <g key={i} onClick={() => setSelectedModule(module)} style={{ cursor: 'pointer' }}>
                  {/* Wire connecting card to path */}
                  <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + 60} stroke="#9CA3AF" strokeWidth="1.5" />
                  
                  {/* Path Node */}
                  <circle cx={p.x} cy={p.y} r="8" fill={isSelected ? gold : "#D1D5DB"} />
                  {isSelected && (
                    <motion.circle 
                      cx={p.x} cy={p.y} r="15" 
                      fill="none" stroke={gold} strokeWidth="1" 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}

                  {/* The Hanging Card */}
                  <foreignObject
                    x={p.x - 90}
                    y={p.y + 60}
                    width="180" // Smaller width
                    height="260" // Smaller height
                  >
                    <motion.div
                      whileHover={{ y: 8 }}
                      animate={{ 
                        scale: isSelected ? 1.05 : 1,
                        borderColor: isSelected ? gold : 'transparent'
                      }}
                      style={{
                        backgroundColor: cardNavy,
                        borderRadius: '16px',
                        padding: '16px 14px', // Reduced padding
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: isSelected ? `0 15px 35px rgba(0,0,0,0.4), 0 0 15px ${gold}33` : '0 10px 25px rgba(0,0,0,0.3)',
                        border: '2px solid transparent',
                        textAlign: 'center',
                        color: white,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <StarIcon color={gold} />

                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '8px 0 2px', color: gold }}>
                          Module {module.level}
                        </h3>
                        <p style={{ fontSize: '11px', opacity: 0.8, margin: 0, fontWeight: '500', minHeight: '32px', lineHeight: '1.3' }}>
                          {module.title}
                        </p>
                      </div>

                      <div style={{ width: '100%', padding: '0 5px' }}>
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
                            backgroundColor: gold, 
                            borderRadius: '3px' 
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: gold }}>
                          {module.progress}%
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onModuleSelect(module);
                        }}
                        style={{
                          backgroundColor: gold,
                          color: navyBlue,
                          border: 'none',
                          padding: '10px 0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          width: '100%',
                          marginTop: '4px'
                        }}
                      >
                        Continue
                      </motion.button>
                    </motion.div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
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
                    fontFamily: "'Playfair Display', serif",
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
            onClick={() => onModuleSelect(selectedModule)}
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
