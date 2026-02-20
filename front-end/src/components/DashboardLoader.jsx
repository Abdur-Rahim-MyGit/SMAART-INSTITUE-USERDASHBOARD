import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DashboardLoader = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate loading progress
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => onComplete?.(), 500); // Small delay after 100%
                    return 100;
                }
                return prev + 2; // finish in ~2.5s (50 steps * 50ms)
            });
        }, 40);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-[#001229] flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={{ opacity: progress === 100 ? 0 : 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#001229] to-[#001229]" />

            <div className="relative flex flex-col items-center z-10">
                {/* Animated Shard Logo (Paper Rocket) */}
                <div className="relative w-24 h-40 mb-6 flex items-center justify-center">
                    <svg viewBox="0 0 100 160" className="w-full h-full overflow-visible">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <linearGradient id="pathGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor="#daa520" stopOpacity="0" />
                                <stop offset="50%" stopColor="#daa520" stopOpacity="1" />
                                <stop offset="100%" stopColor="#fff" stopOpacity="1" />
                            </linearGradient>
                        </defs>

                        {/* Shard Outline */}
                        <motion.path
                            d="M50 10 L80 150 L50 140 L20 150 Z"
                            fill="none"
                            stroke="#1a3884"
                            strokeWidth="1.5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />

                        {/* Internal Structure Lines */}
                        <motion.path
                            d="M50 10 L50 140 M50 10 L35 145 M50 10 L65 145"
                            stroke="#1a3884"
                            strokeWidth="0.5"
                            strokeOpacity="0.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                        />

                        {/* "The Right Path" - Gold Particle Traveling Up */}
                        <motion.circle
                            r="2.5"
                            fill="#daa520"
                            filter="url(#glow)"
                            initial={{ cx: 50, cy: 150, opacity: 0 }}
                            animate={{
                                cy: 10,
                                opacity: [0, 1, 1, 0],
                                scale: [1, 1.5, 1]
                            }}
                            transition={{
                                duration: 2,
                                delay: 0.5,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatDelay: 0.5
                            }}
                        />

                        {/* Path Trail */}
                        <motion.path
                            d="M50 150 L50 10"
                            stroke="url(#pathGradient)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                            transition={{
                                duration: 2,
                                delay: 0.5,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatDelay: 0.5
                            }}
                        />

                        {/* Burst at the Top (Success) */}
                        <motion.circle
                            cx="50"
                            cy="10"
                            r="1"
                            fill="#fff"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 3, 0], opacity: [0, 1, 0] }}
                            transition={{
                                duration: 0.4,
                                delay: 2.5,
                                repeat: Infinity,
                                repeatDelay: 2.1
                            }}
                        />
                    </svg>

                    {/* Subtle Glow Behind */}
                    <motion.div
                        className="absolute inset-0 bg-teal/20 blur-[30px] rounded-full -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ duration: 2 }}
                    />
                </div>

                {/* Text Animation */}
                <div className="text-center">
                    <motion.h1
                        className="text-3xl font-bold tracking-tight text-white mb-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        SMAART <span className="text-[#1a3884]">Institute</span>
                    </motion.h1>

                    <motion.div
                        className="flex items-center gap-2 justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >

                        <span className="text-xs text-slate-400 uppercase tracking-[0.2em]">DashBoard</span>
                    </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="w-48 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden relative">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#1a3884] to-cyan-400"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                    />
                </div>

                <p className="mt-3 text-[10px] text-slate-500 font-mono">
                    {progress < 100 ? "LOADING RESOURCES..." : "READY"}
                </p>
            </div>
        </motion.div>
    );
};

export default DashboardLoader;

