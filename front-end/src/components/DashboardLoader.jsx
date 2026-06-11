import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

// ── Floating particle dots ──────────────────────────────────────────────────
const Particle = ({ x, y, size, delay, duration, color }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.8, 0],
      scale: [0, 1, 0],
      y: [0, -40 - Math.random() * 30, -80],
    }}
    transition={{ duration, delay, repeat: Infinity, repeatDelay: Math.random() * 3 + 1, ease: "easeInOut" }}
  />
);

// ── Hexagon ring particle ───────────────────────────────────────────────────
const HexRing = ({ radius, count, color, duration, reverse }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            animate={{
              x: [x, Math.cos(angle + (reverse ? -0.5 : 0.5)) * radius, x],
              y: [y, Math.sin(angle + (reverse ? -0.5 : 0.5)) * radius, y],
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.4, 0.8],
            }}
            transition={{ duration, delay: (i / count) * duration, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </>
  );
};

// ── Typewriter hook ─────────────────────────────────────────────────────────
const useTypewriter = (text, speed = 60, delay = 800) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(iv);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return { displayed, done };
};

// ── Main Component ──────────────────────────────────────────────────────────
const DashboardLoader = ({ onComplete, title = "Dashboard" }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=intro 1=loading 2=done
  const { displayed: loadingText } = useTypewriter(
    `Launching ${title.toUpperCase()}`,
    55,
    600
  );

  const particles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
      color: i % 3 === 0 ? "rgba(56,189,248,0.7)" : i % 3 === 1 ? "rgba(99,102,241,0.6)" : "rgba(192,192,192,0.5)",
    }))
  ).current;

  useEffect(() => {
    // Phase 0 → 1 after logo draw
    const t0 = setTimeout(() => setPhase(1), 700);
    return () => clearTimeout(t0);
  }, []);

  useEffect(() => {
    if (phase < 1) return;
    const iv = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(iv);
          setPhase(2);
          setTimeout(() => onComplete?.(), 600);
          return 100;
        }
        // Non-linear — fast then slow near 90, final burst to 100
        const step = prev < 70 ? 3 : prev < 90 ? 1.5 : 2;
        return Math.min(prev + step, 100);
      });
    }, 40);
    return () => clearInterval(iv);
  }, [phase, onComplete]);

  const statusMessages = [
    "Initializing secure session…",
    "Loading your learning profile…",
    "Syncing career intelligence…",
    "Preparing personalized content…",
    "Almost there…",
    "Ready!",
  ];
  const msgIndex = Math.min(Math.floor(progress / 20), statusMessages.length - 1);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #020c1b 0%, #00152e 50%, #001a3d 100%)" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 2 ? 0 : 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {/* ── Background grid ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Radial glow spots ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(26,56,132,0.35) 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
      </div>

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => <Particle key={p.id} {...p} />)}
      </div>

      {/* ── Main content card ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* ── Logo & orbit system ── */}
        <motion.div
          className="relative flex items-center justify-center mb-10"
          style={{ width: 200, height: 200 }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Outer slow spin ring */}
          <motion.div
            className="absolute rounded-full border border-[rgba(56,189,248,0.15)]"
            style={{ width: 190, height: 190 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <HexRing radius={95} count={8} color="rgba(56,189,248,0.5)" duration={4} reverse={false} />
          </motion.div>

          {/* Middle ring */}
          <motion.div
            className="absolute rounded-full border border-[rgba(99,102,241,0.2)]"
            style={{ width: 145, height: 145 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          >
            <HexRing radius={72} count={6} color="rgba(99,102,241,0.55)" duration={3.5} reverse={true} />
          </motion.div>

          {/* Inner glow ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 100, height: 100,
              background: "radial-gradient(circle, rgba(26,56,132,0.6) 0%, rgba(0,21,46,0) 80%)",
              boxShadow: "0 0 40px rgba(56,189,248,0.25), inset 0 0 25px rgba(56,189,248,0.1)",
              border: "1px solid rgba(56,189,248,0.3)",
            }}
            animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 30px rgba(56,189,248,0.2)", "0 0 55px rgba(56,189,248,0.35)", "0 0 30px rgba(56,189,248,0.2)"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* SVG rocket logo centred */}
          <div className="absolute flex items-center justify-center" style={{ width: 88, height: 88 }}>
            <svg viewBox="0 0 100 160" className="w-full h-full overflow-visible" style={{ filter: "drop-shadow(0 0 12px rgba(56,189,248,0.5))" }}>
              <defs>
                <linearGradient id="rocketBody" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#1a3884" />
                </linearGradient>
                <linearGradient id="trailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                  <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
                <filter id="glow2">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Rocket body */}
              <motion.path
                d="M50 8 L78 145 L50 132 L22 145 Z"
                fill="none"
                stroke="url(#rocketBody)"
                strokeWidth="2"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />

              {/* Internal structure */}
              <motion.path
                d="M50 8 L50 132 M50 8 L33 140 M50 8 L67 140"
                stroke="rgba(56,189,248,0.4)"
                strokeWidth="0.8"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              />

              {/* Animated particle trail */}
              <motion.circle
                r="3"
                fill="#38bdf8"
                filter="url(#glow2)"
                initial={{ cy: 145, cx: 50, opacity: 0 }}
                animate={{ cy: [145, 8], cx: 50, opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 1, 0.5] }}
                transition={{ duration: 2.2, delay: 0.8, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
              />

              {/* Trail glow line */}
              <motion.path
                d="M50 145 L50 8"
                stroke="url(#trailGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 2.2, delay: 0.8, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
              />

              {/* Tip burst */}
              <motion.circle
                cx="50" cy="8" r="1.5"
                fill="#fff"
                filter="url(#glow2)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 4, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, delay: 2.8, repeat: Infinity, repeatDelay: 2 }}
              />
            </svg>
          </div>
        </motion.div>

        {/* ── Brand text ── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <h1 className="text-4xl font-black tracking-tight mb-1" style={{ letterSpacing: "-0.03em" }}>
            <span className="text-white">SMAART</span>
            <span style={{
              background: "linear-gradient(90deg, #38bdf8, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}> Institute</span>
          </h1>

          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-sky-400/60" />
            <span className="text-[10px] font-bold tracking-[0.35em] text-sky-400/70 uppercase">
              {title}
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-sky-400/60" />
          </div>

          {/* Typewriter subtitle */}
          <motion.p
            className="mt-3 text-[11px] font-mono tracking-widest uppercase"
            style={{ color: "rgba(148,163,184,0.7)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {loadingText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="ml-0.5 inline-block w-[1px] h-[10px] bg-sky-400 align-middle"
            />
          </motion.p>
        </motion.div>

        {/* ── Progress system ── */}
        <motion.div
          className="w-72 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          {/* Percentage readout */}
          <div className="flex w-full justify-between items-center px-1">
            <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
              {statusMessages[msgIndex]}
            </span>
            <span className="text-[11px] font-mono font-bold"
              style={{ color: progress < 100 ? "#38bdf8" : "#4ade80" }}>
              {progress}%
            </span>
          </div>

          {/* Bar track */}
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            {/* Glow fill */}
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: "linear-gradient(90deg, #1a3884, #38bdf8, #6366f1)",
                boxShadow: "0 0 12px rgba(56,189,248,0.7)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "tween", ease: "linear", duration: 0.08 }}
            >
              {/* Moving shimmer */}
              <motion.div
                className="absolute right-0 top-0 h-full w-8 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)" }}
                animate={{ x: [-32, 32] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-1">
            {statusMessages.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: i === msgIndex ? 20 : 5,
                  height: 5,
                  background: i <= msgIndex
                    ? "linear-gradient(90deg, #38bdf8, #6366f1)"
                    : "rgba(255,255,255,0.08)",
                  boxShadow: i === msgIndex ? "0 0 8px rgba(56,189,248,0.6)" : "none",
                }}
                animate={{ width: i === msgIndex ? 20 : 5 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Footer tagline ── */}
        <motion.p
          className="mt-10 text-[9px] tracking-[0.3em] uppercase font-medium"
          style={{ color: "rgba(100,116,139,0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          Empowering Careers · Building Futures
        </motion.p>
      </div>
    </motion.div>
  );
};

export default DashboardLoader;
