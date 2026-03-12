import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Lock, ChevronRight } from "lucide-react";

const STEPS = [
  {
    id: 1,
    label: "STEP 01",
    title: "Capacity",
    description: "Build the foundational skills and resources to perform at your best in any environment.",
    color: "#3B82F6",
    active: true,
  },
  {
    id: 2,
    label: "STEP 02",
    title: "Capability",
    description: "Develop core competencies and technical expertise to excel in your chosen field.",
    color: "#8B5CF6",
    active: false,
  },
  {
    id: 3,
    label: "STEP 03",
    title: "Leadership",
    description: "Cultivate the mindset and vision to lead teams and drive meaningful change.",
    color: "#06B6D4",
    active: false,
  },
];

// Coordinate space: 1000 × 520
// Card size in that space
const VB_W = 1000;
const VB_H = 520;
const C_W = 240;  // card width in viewBox units
const C_H = 210;  // card height in viewBox units

// Top-left positions of each card in viewBox space
const POS = [
  { x: 20, y: 295 },
  { x: 382, y: 160 },
  { x: 744, y: 25 },
];

// L-shaped staircase connector path (right-center → horizontal → vertical → left-center)
const stepPath = (a, b) => {
  const ax = a.x + C_W, ay = a.y + C_H / 2;
  const bx = b.x, by = b.y + C_H / 2;
  const mid = ax + (bx - ax) / 2;
  return `M ${ax} ${ay} L ${mid} ${ay} L ${mid} ${by} L ${bx} ${by}`;
};

const CoursePathway = ({ onCourseClick }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="w-full select-none">
      {/* ── Header ── */}
      <div className="text-center mb-4 px-4">
        <div className="inline-block px-4 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-2">
          Career Roadmap
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-2">
          Your Learning{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Journey
          </span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-xs leading-relaxed">
          Follow this curated path to master your skills. Complete each step to unlock the next stage in your career.
        </p>
      </div>

      {isMobile ? (
        /* ── Mobile: stacked vertically ── */
        <div className="flex flex-col gap-4 px-4 max-w-xs mx-auto">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <StepCard step={step} index={i} onCourseClick={onCourseClick} />
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── Desktop: fully responsive staircase ── */
        <div className="relative w-full" style={{ paddingBottom: `${(VB_H / VB_W) * 100}%` }}>
          {/* SVG connectors — scales with container */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Staircase lines */}
            <path d={stepPath(POS[0], POS[1])} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="square" opacity="0.6" />
            <path d={stepPath(POS[1], POS[2])} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="square" opacity="0.6" />

            {/* Dots at connection points */}
            {POS.map((p, i) => (
              <g key={i}>
                {i < 2 && <circle cx={p.x + C_W} cy={p.y + C_H / 2} r="5" fill={STEPS[i].color} opacity="0.85" />}
                {i > 0 && <circle cx={p.x} cy={p.y + C_H / 2} r="5" fill={STEPS[i].color} opacity="0.85" />}
              </g>
            ))}
          </svg>

          {/* Cards — positioned using % mapped to the same viewBox space */}
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              className="absolute"
              style={{
                left: `${(POS[i].x / VB_W) * 100}%`,
                top: `${(POS[i].y / VB_H) * 100}%`,
                width: `${(C_W / VB_W) * 100}%`,
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.14 }}
            >
              <StepCard step={step} index={i} onCourseClick={onCourseClick} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Step Card ── */
const StepCard = ({ step, index, onCourseClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: step.active ? -5 : 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={step.active ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
      onClick={() => step.active && onCourseClick?.(step.id)}
    >
      <div
        className="relative overflow-hidden border-2 transition-all duration-300"
        style={{
          borderColor: step.active ? step.color : "#94a3b8",
          background: "#ffffff",
          boxShadow: step.active
            ? hovered
              ? `0 0 0 1px ${step.color}44, 0 8px 28px ${step.color}40`
              : `0 0 0 1px ${step.color}20, 0 4px 18px ${step.color}22`
            : "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        {/* Colored header */}
        <div
          className="flex items-start justify-between px-3 pt-3 pb-3"
          style={{
            background: step.active
              ? `linear-gradient(135deg, ${step.color}, ${step.color}cc)`
              : "linear-gradient(135deg, #94a3b8, #64748b)",
            minHeight: "52px",
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/90 bg-white/20 px-2 py-0.5">
            {step.label}
          </span>
          <div className="bg-white/90 p-1">
            {step.active
              ? <PlayCircle size={12} className="text-blue-600" />
              : <Lock size={12} className="text-slate-400" />}
          </div>
        </div>

        {/* Number badge */}
        <div
          className="absolute top-[33px] right-3 w-8 h-8 flex items-center justify-center border-2 bg-white shadow font-black text-xs transition-transform duration-300"
          style={{
            borderColor: step.active ? step.color : "#94a3b8",
            color: step.active ? step.color : "#94a3b8",
            transform: hovered ? "rotate(10deg)" : "none",
          }}
        >
          {index + 1}
        </div>

        {/* Body */}
        <div className="px-3 pt-3 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1 pr-9 leading-tight">
            {step.title}
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            {step.description}
          </p>
          <button
            className="w-full py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] border flex items-center justify-center gap-1 transition-all duration-200"
            style={{
              color: step.active ? step.color : "#94a3b8",
              borderColor: step.active ? `${step.color}44` : "#e2e8f0",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              if (step.active) {
                e.currentTarget.style.background = step.color;
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = step.color;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = step.active ? step.color : "#94a3b8";
              e.currentTarget.style.borderColor = step.active ? `${step.color}44` : "#e2e8f0";
            }}
          >
            {step.active ? "Start Course" : "Locked"}
            <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CoursePathway;
