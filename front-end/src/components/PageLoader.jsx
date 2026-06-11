import { motion } from "framer-motion";

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden"
    style={{ background: "linear-gradient(135deg, #020c1b 0%, #00152e 60%, #001a3d 100%)" }}>

    {/* Subtle grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(56,189,248,1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />

    {/* Centre glow */}
    <div className="absolute pointer-events-none"
      style={{
        width: 340, height: 340,
        background: "radial-gradient(circle, rgba(26,56,132,0.3) 0%, transparent 70%)",
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      }}
    />

    {/* Logo card */}
    <motion.div
      className="relative flex items-center justify-center mb-8"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Outer breathing ring */}
      <motion.div
        className="absolute rounded-[28px] rotate-45"
        style={{
          width: 92, height: 92,
          border: "1.5px solid rgba(56,189,248,0.25)",
          boxShadow: "0 0 20px rgba(56,189,248,0.15)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Spinning arc */}
      <motion.div
        className="absolute rounded-[24px] rotate-45"
        style={{
          width: 80, height: 80,
          border: "2.5px solid transparent",
          borderTopColor: "#38bdf8",
          borderRightColor: "rgba(99,102,241,0.6)",
          boxShadow: "0 0 14px rgba(56,189,248,0.4)",
        }}
        animate={{ rotate: [45, 405] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />

      {/* Static inner card */}
      <div
        className="relative w-16 h-16 rounded-[18px] rotate-45 flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(26,56,132,0.6) 0%, rgba(0,21,46,0.9) 100%)",
          border: "1px solid rgba(56,189,248,0.2)",
          boxShadow: "inset 0 0 16px rgba(56,189,248,0.08)",
        }}
      >
        <motion.span
          className="font-black text-2xl -rotate-45 select-none"
          style={{
            background: "linear-gradient(135deg, #e0f2fe, #38bdf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 6px rgba(56,189,248,0.6))",
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          S
        </motion.span>
      </div>
    </motion.div>

    {/* Brand name */}
    <motion.div
      className="text-center mb-7"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <p className="text-sm font-black tracking-tight mb-0.5">
        <span className="text-white">SMAART</span>
        <span style={{
          background: "linear-gradient(90deg, #38bdf8, #6366f1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}> Institute</span>
      </p>
      <p className="text-[9px] tracking-[0.3em] uppercase font-medium"
        style={{ color: "rgba(100,116,139,0.55)" }}>
        Loading…
      </p>
    </motion.div>

    {/* Dot trail */}
    <motion.div
      className="flex gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 6, height: 6,
            background: i % 2 === 0 ? "#38bdf8" : "#6366f1",
            boxShadow: `0 0 6px ${i % 2 === 0 ? "rgba(56,189,248,0.7)" : "rgba(99,102,241,0.7)"}`,
          }}
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 0.9,
            delay: i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  </div>
);

export default PageLoader;
