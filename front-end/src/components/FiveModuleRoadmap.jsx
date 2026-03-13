import React, { useRef } from "react";
import { motion } from "framer-motion";
import FloatingDictionary from "@/components/FloatingDictionary";
import Navbar from "@/components/Navbar";

const FiveModuleRoadmap = ({ courseData, onModuleSelect }) => {
  const navyBlue = '#11224D'; 
  const gold = '#C9A45B'; 
  const cream = '#F5F2ED'; 
  const white = '#FFFFFF';

  const defaultModules = [
    { id: 1, roman: "I", title: "Foundations" },
    { id: 2, roman: "II", title: "Strategy" },
    { id: 3, roman: "III", title: "Planning" },
    { id: 4, roman: "IV", title: "Leadership" },
    { id: 5, roman: "V", title: "Resources" },
    { id: 6, roman: "VI", title: "Optimization" },
    { id: 7, roman: "VII", title: "Marketing" },
    { id: 8, roman: "VIII", title: "Finance" },
    { id: 9, roman: "IX", title: "Risk" },
    { id: 10, roman: "X", title: "Review" },
  ];

  const displayModules = courseData?.modules?.length > 0 
    ? courseData.modules.slice(0, 10).map((m, i) => ({
        id: m.id || i + 1,
        roman: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][i],
        title: m.title || `Module ${i + 1}`,
      }))
    : defaultModules;

  const scrollRef = useRef(null);

  // Constants for Highway Layout
  const trackHeight = 80;
  const centerY = 300;
  const moduleSpacing = 350;
  const trackLength = displayModules.length * moduleSpacing + 400;

  return (
    <div style={{
      height: '100vh',
      backgroundColor: cream,
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <Navbar />
      </div>

      <div 
        ref={scrollRef}
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          alignItems: 'center',
          cursor: 'grab',
          paddingLeft: '100px',
          paddingRight: '100px'
        }}
      >
        <div style={{ position: 'relative', minWidth: trackLength, height: '600px' }}>
          
          {/* SVG LAYER: Precision Linear Path */}
          <svg width={trackLength} height="600" style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, overflow: 'visible' }}>
            {/* Linear Horizontal Line */}
            <line 
              x1={200} 
              y1={centerY + 120} // Aligned with the bottom of the first circle (centerY=300, r=120)
              x2={trackLength} 
              y2={centerY + 120} 
              stroke={navyBlue} 
              strokeWidth="4" 
              strokeDasharray="10,10" // Adding a subtle dash as seen in some professional LMS
            />

            {/* Path Arrows/Chevrons */}
            {displayModules.map((m, i) => {
              const x = 200 + i * moduleSpacing;
              const y = centerY + 120;
              if (i === 0) return null;

              return (
                <text 
                  key={i}
                  x={x - moduleSpacing / 2} 
                  y={y + 8} 
                  fill={gold} 
                  style={{ fontSize: '28px', fontWeight: 'bold', pointerEvents: 'none' }}
                  textAnchor="middle"
                >
                  »
                </text>
              );
            })}
          </svg>

          {/* MODULE CARDS & CHEVRONS */}
          {displayModules.map((m, i) => {
            const xPos = 200 + i * moduleSpacing;
            return (
              <React.Fragment key={m.id}>
                {/* Gold Chevrons Above */}
                <div style={{
                  position: 'absolute',
                  left: xPos + moduleSpacing / 2,
                  top: centerY - 80,
                  fontSize: '32px',
                  color: gold,
                  fontWeight: '900',
                  opacity: 0.6,
                  zIndex: 3
                }}>
                  »
                </div>

                {/* Gold Chevrons Below */}
                <div style={{
                  position: 'absolute',
                  left: xPos + moduleSpacing / 2,
                  top: centerY + 40,
                  fontSize: '32px',
                  color: gold,
                  fontWeight: '900',
                  opacity: 0.6,
                  zIndex: 3
                }}>
                  »
                </div>

                {/* Circular Module card */}
                <div style={{
                  position: 'absolute',
                  left: xPos,
                  top: centerY - 140, // Increased gap to match reference
                  transform: 'translateX(-50%)',
                  zIndex: 20
                }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onModuleSelect(m)}
                    style={{
                      width: '240px',
                      height: '240px',
                      backgroundColor: white,
                      borderRadius: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                      border: `12px solid ${navyBlue}`, // Thick circle as requested
                      textAlign: 'center',
                      padding: '20px',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '80px', fontFamily: "'Playfair Display', serif", color: gold, lineHeight: 1 }}>
                      {m.roman}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', marginTop: '10px', lineHeight: 1.2 }}>
                      Module {i + 1}:<br/>{m.title}
                    </div>

                    {/* Speech Bubble Pointer */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '30px',
                      height: '30px',
                      backgroundColor: white,
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      borderRight: '1px solid rgba(0,0,0,0.05)',
                      zIndex: -1
                    }} />
                  </motion.div>
                </div>

                {/* Gold Node on Track */}
                <div style={{
                  position: 'absolute',
                  left: xPos,
                  top: centerY,
                  width: '24px',
                  height: '24px',
                  backgroundColor: gold,
                  borderRadius: '50%',
                  border: '4px solid white',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }} />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          user-select: none;
        }
      `}</style>

      <FloatingDictionary />
    </div>
  );
};

export default FiveModuleRoadmap;
