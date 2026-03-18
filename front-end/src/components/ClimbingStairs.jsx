import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const ClimbingStairs = ({ modules = [] }) => {
  // Default modules if none provided
  const defaultModules = [
    { id: 1, title: "Fundamentals of Stock Markets", status: "completed", duration: "12 hrs mins", locked: false },
    { id: 2, title: "Selecting Right Stock", status: "locked", duration: "29 hrs mins", locked: true },
    { id: 3, title: "Conduct Financial Overview", status: "pending", duration: "15 hrs mins", locked: false },
    { id: 4, title: "Risk Management Strategies", status: "pending", duration: "18 hrs mins", locked: false },
    { id: 5, title: "Portfolio Building", status: "pending", duration: "22 hrs mins", locked: false },
  ];

  const pathwayModules = modules.length > 0 ? modules : defaultModules;
  const totalSteps = pathwayModules.length;

  // Calculate current step based on completed modules
  const completedCount = pathwayModules.filter(m => m.status === "completed").length;
  const [currentStep, setCurrentStep] = useState(completedCount);

  useEffect(() => {
    setCurrentStep(completedCount);
  }, [completedCount]);

  return (
    <div className="flex flex-col items-center rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 py-6 sm:py-8 md:py-10 lg:py-12 shadow-2xl shadow-black/50 bg-navy-light/20 backdrop-blur-xl border border-white/10 relative overflow-hidden">
      {/* Abstract Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-[150px] sm:h-[200px] md:h-[250px] lg:h-[300px] bg-teal/5 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] pointer-events-none" />

      {/* Title - Moved up */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-12 lg:mb-16 tracking-wide text-white relative z-10">
        Your Learning <span className="text-teal">Journey</span>
      </h1>

      {/* Progress Info - Repositioned */}
      <div className="w-full max-w-4xl relative z-10 overflow-hidden">
        {/* Staircase Progress Bar - Moved down */}
        <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 mb-4 sm:mb-6 min-w-0">
          <svg className="w-full h-full" viewBox="0 -200 1200 360" preserveAspectRatio="xMidYMid meet">
            {/* Background staircase path - Starting from bottom left to top right */}
            <path
              d="M 0 150 L 0 120 L 200 120 L 200 90 L 400 90 L 400 60 L 600 60 L 600 30 L 800 30 L 800 10 L 1000 10 L 1000 0 L 1100 0"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="3"
            />

            {/* Animated progress path */}
            <motion.path
              d="M 0 150 L 0 120 L 200 120 L 200 90 L 400 90 L 400 60 L 600 60 L 600 30 L 800 30 L 800 10 L 1000 10 L 1000 0 L 1100 0"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: completedCount / totalSteps }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="drop-shadow-[0_0_15px_rgba(26,56,132,0.6)]"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a3884" />
                <stop offset="50%" stopColor="#C0C0C0" />
                <stop offset="100%" stopColor="#C0C0C0" />
              </linearGradient>
            </defs>

            {/* Stage markers with labels below */}
            {[0, 1, 2, 3, 4].map((stage) => {
              const positions = [
                { x: 100, y: 120, label: "Stage 1" },
                { x: 300, y: 90, label: "Stage 2" },
                { x: 500, y: 60, label: "Stage 3" },
                { x: 700, y: 30, label: "Stage 4" },
                { x: 900, y: 10, label: "Stage 5" },
              ];
              const pos = positions[stage];
              const isCompleted = stage < completedCount;

              return (
                <g key={stage}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="8"
                    fill={isCompleted ? "#1a3884" : "rgba(26, 56, 132, 0.1)"}
                    stroke={isCompleted ? "#C0C0C0" : "rgba(255, 255, 255, 0.1)"}
                    strokeWidth="2"
                    className={isCompleted ? "drop-shadow-[0_0_15px_rgba(26,56,132,0.8)]" : ""}
                  />
                  {/* Stage label below each step */}
                  <text
                    x={pos.x}
                    y={pos.y + 25}
                    textAnchor="middle"
                    fill={isCompleted ? "#fff" : "rgba(255, 255, 255, 0.4)"}
                    fontSize="14"
                    fontWeight="500"
                    className="transition-colors duration-300"
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}

            {/* Goal marker at the end (big floating flag) */}
            <motion.g
              initial={{ y: 0 }}
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Large Flag Pole extending upward */}
              <line
                x1="1100"
                y1="0"
                x2="1100"
                y2="-120"
                stroke="#C0C0C0"
                strokeWidth="4"
                className="drop-shadow-[0_0_15px_rgba(192, 192, 192,0.8)]"
              />

              {/* Large Glowing White Flag */}
              <g filter="url(#flagGlow)">
                <path
                  d="M 1100 -120 L 1190 -120 L 1190 -180 L 1100 -180 Z"
                  fill="#1a3884"
                  stroke="#C0C0C0"
                  strokeWidth="2"
                />
                {/* Goal text on big flag */}
                <text
                  x="1145"
                  y="-148"
                  textAnchor="middle"
                  fill="#F0F0F2"
                  fontSize="18"
                  fontWeight="800"
                  fontFamily="Arial, sans-serif"
                >
                  Goal
                </text>
              </g>

              {/* Glow filter for flag */}
              <defs>
                <filter id="flagGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle
                cx="1100"
                cy="0"
                r="10"
                fill={completedCount === totalSteps ? "#C0C0C0" : "rgba(192, 192, 192, 0.1)"}
                stroke={completedCount === totalSteps ? "#C0C0C0" : "rgba(255, 255, 255, 0.1)"}
                strokeWidth="2"
                className={completedCount === totalSteps ? "drop-shadow-[0_0_20px_rgba(192, 192, 192,0.9)]" : ""}
              />
              {/* Goal label */}
              <text
                x="1100"
                y="25"
                textAnchor="middle"
                fill="#F0F0F2"
                fontSize="16"
                fontWeight="600"
              >
                Goal
              </text>
            </motion.g>

            {/* Animated Ball climbing the stairs */}
            <motion.g
              initial={{ x: 0, y: 150 }}
              animate={{
                x: completedCount === 0 ? 0 :
                  completedCount === 1 ? 100 :
                    completedCount === 2 ? 300 :
                      completedCount === 3 ? 500 :
                        completedCount === 4 ? 700 :
                          completedCount === 5 ? 1050 : 0,
                y: completedCount === 0 ? 150 :
                  completedCount === 1 ? 120 :
                    completedCount === 2 ? 90 :
                      completedCount === 3 ? 60 :
                        completedCount === 4 ? 30 :
                          completedCount === 5 ? 0 : 150,
              }}
              transition={{
                type: "spring",
                stiffness: 60,
                damping: 12,
                duration: 1.5
              }}
            >
              {/* Ball with gradient and glow */}
              <defs>
                <radialGradient id="ballGradient">
                  <stop offset="0%" stopColor="#C0C0C0" />
                  <stop offset="50%" stopColor="#C0C0C0" />
                  <stop offset="100%" stopColor="#f5d78e" />
                </radialGradient>
                <filter id="ballGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer glow circle */}
              <circle
                cx="0"
                cy="0"
                r="16"
                fill="rgba(192, 192, 192, 0.3)"
                filter="url(#ballGlow)"
              />

              {/* Main ball */}
              <circle
                cx="0"
                cy="0"
                r="12"
                fill="url(#ballGradient)"
                stroke="#C0C0C0"
                strokeWidth="2"
              />

              {/* Highlight on ball */}
              <circle
                cx="-4"
                cy="-4"
                r="4"
                fill="rgba(255, 255, 255, 0.95)"
              />
            </motion.g>
          </svg>
        </div>

        <p className="text-center mt-4 sm:mt-6 md:mt-8 text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-widest">
          Progress: <span className="text-white">{completedCount}</span> / {totalSteps} Steps Completed
        </p>
      </div>
    </div>
  );
};

export default ClimbingStairs;



