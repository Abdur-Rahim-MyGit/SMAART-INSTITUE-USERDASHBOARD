import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SplashScreen = ({ onComplete }) => {
    const [nodes, setNodes] = useState([]);

    useEffect(() => {
        // Generate "Minds" Nodes for background (Neural Network)
        const newNodes = Array.from({ length: 15 }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            radius: Math.random() * 1.5 + 0.5,
        }));
        setNodes(newNodes);
    }, []);

    useEffect(() => {
        // Safety timeout to ensure splash always completes
        const timer = setTimeout(() => {
            onComplete?.();
        }, 3000); // 1.5s delay + 1s duration + 0.5s buffer
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-navy flex items-center justify-center overflow-hidden global-splash-screen"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
        >
            {/* Background: Connected Minds (Neural Network) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full">
                    {nodes.map((node, i) => (
                        nodes.map((otherNode, j) => {
                            // Connect nodes if they are close enough (simulating connections)
                            const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
                            if (i < j && dist < 30) {
                                return (
                                    <motion.line
                                        key={`line-${i}-${j}`}
                                        x1={`${node.x}%`}
                                        y1={`${node.y}%`}
                                        x2={`${otherNode.x}%`}
                                        y2={`${otherNode.y}%`}
                                        stroke="#2a4d9e" // Teal connections
                                        strokeWidth="0.5"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
                                    />
                                )
                            }
                            return null;
                        })
                    ))}
                    {nodes.map((node, i) => (
                        <motion.circle
                            key={`node-${i}`}
                            cx={`${node.x}%`}
                            cy={`${node.y}%`}
                            r={node.radius}
                            fill="#fff"
                            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
                        />
                    ))}
                </svg>
            </div>

            <div className="relative flex flex-col items-center z-10">
                {/* "Path to Excellence" Shard Animation */}
                <div className="relative w-40 h-64 mb-8 flex items-center justify-center">
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
                                <stop offset="0%" stopColor="#C0C0C0" stopOpacity="0" />
                                <stop offset="50%" stopColor="#C0C0C0" stopOpacity="1" />
                                <stop offset="100%" stopColor="#fff" stopOpacity="1" />
                            </linearGradient>
                        </defs>

                        {/* Shard Outline - Elegant & Minimal */}
                        <motion.path
                            d="M50 10 L80 150 L50 140 L20 150 Z"
                            fill="none"
                            stroke="#2a4d9e" // Teal Outline
                            strokeWidth="0.8"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />

                        {/* Internal Structure Lines */}
                        <motion.path
                            d="M50 10 L50 140 M50 10 L35 145 M50 10 L65 145"
                            stroke="#2a4d9e"
                            strokeWidth="0.3"
                            strokeOpacity="0.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                        />

                        {/* "The Right Path" - Gold Particle Traveling Up */}
                        <motion.circle
                            r="2"
                            fill="#C0C0C0"
                            filter="url(#glow)"
                            initial={{ cx: 50, cy: 150, opacity: 0 }}
                            animate={{
                                cy: 10,
                                opacity: [0, 1, 1, 0],
                                scale: [1, 1.5, 1]
                            }}
                            transition={{
                                duration: 2.5,
                                delay: 2,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatDelay: 1
                            }}
                        />

                        {/* Path Trail */}
                        <motion.path
                            d="M50 150 L50 10"
                            stroke="url(#pathGradient)"
                            strokeWidth="1"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                            transition={{
                                duration: 2.5,
                                delay: 2,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatDelay: 1
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
                                duration: 0.5,
                                delay: 4.5,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        />
                    </svg>

                    {/* Subtle Glow Behind */}
                    <motion.div
                        className="absolute inset-0 bg-teal/10 blur-[40px] rounded-full -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 2, delay: 1 }}
                    />
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="text-center relative"
                >
                    <h1 className="text-4xl md:text-6xl font-sans font-bold text-white mb-3 tracking-tight">
                        <motion.span
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            transition={{ delay: 1.8, duration: 0.8 }}
                        >
                            SMAART
                        </motion.span>{" "}
                        <motion.span
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            transition={{ delay: 2.2, duration: 0.8 }}
                            className="text-teal-light"
                        >
                            Institute
                        </motion.span>
                    </h1>

                    <motion.div
                        className="h-[1px] bg-gradient-to-r from-transparent via-gold/60 to-transparent w-full max-w-[150px] mx-auto my-3"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: 2.5, duration: 0.8 }}
                    />

                    <motion.p
                        className="text-white/60 text-sm md:text-base tracking-[0.3em] uppercase font-light"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.8, duration: 1 }}
                    >
                        The Right Path
                    </motion.p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SplashScreen;



