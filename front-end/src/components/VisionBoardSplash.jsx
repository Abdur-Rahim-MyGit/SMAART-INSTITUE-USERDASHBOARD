import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveVision } from "@/features/visionBoard/services/visionBoardProApi";

const VisionBoardSplash = ({ onComplete, duration = 3000 }) => {
    const [vision, setVision] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(Math.floor(duration / 1000));

    useEffect(() => {
        const loadVision = async () => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 2000)
            );

            try {
                const apiPromise = getActiveVision();
                const result = await Promise.race([apiPromise, timeoutPromise]);

                if (result.data) {
                    setVision(result.data);
                } else {
                    onComplete?.();
                }
            } catch (error) {
                console.warn("Vision board load skipped or timed out:", error.message);
                onComplete?.();
            } finally {
                setLoading(false);
            }
        };
        loadVision();
    }, []);

    useEffect(() => {
        if (!vision || loading) return;

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Auto-dismiss after duration
        const timer = setTimeout(() => {
            onComplete?.();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearInterval(countdownInterval);
        };
    }, [vision, loading, duration, onComplete]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#002147] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-[#30919D] border-r-transparent border-b-[#daa520] border-l-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!vision) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-[#002147] flex items-center justify-center overflow-hidden"
            >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#002147] via-[#001a38] to-[#002147]" />

                {/* Decorative elements */}
                <div className="absolute top-10 left-10 text-[#30919D]/20 text-6xl font-black tracking-wider">VISION</div>
                <div className="absolute bottom-10 right-10 text-[#daa520]/20 text-6xl font-black tracking-wider">MANIFEST</div>

                {/* Main Vision Board Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="relative w-[96vw] max-w-[95vw] h-[85vh]"
                >
                    {/* The Vision Board Image */}
                    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-[#30919D]/30">
                        <img
                            src={vision.image}
                            alt={vision.title || "My Vision"}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                console.warn("Vision Board image failed to load:", vision.image);
                                // Fallback to hidden or default logic
                                e.target.style.display = 'none';
                                // Optionally call onComplete to close splash if image is critical
                                // onComplete?.(); 
                                // For now just hiding image so it doesn't look broken, 
                                // but maybe text is enough?
                            }}
                        />

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#002147]/90 via-transparent to-[#002147]/40" />

                        {/* Title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                            <motion.h2
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-white text-3xl md:text-4xl font-bold mb-2"
                            >
                                {vision.title || "My Vision Board"}
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-[#30919D] text-lg font-medium"
                            >
                                Visualize • Believe • Achieve
                            </motion.p>
                        </div>
                    </div>
                </motion.div>

                {/* Skip button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    onClick={() => onComplete?.()}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 px-8 py-3 bg-gradient-to-r from-[#daa520] to-[#f0c040] hover:from-[#c4941a] hover:to-[#daa520] text-[#002147] text-base font-bold rounded-full transition-all shadow-lg border-2 border-white/30"
                >
                    A'int giving up on my dream! ✨
                </motion.button>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: duration / 1000, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-[#30919D] to-[#daa520]"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VisionBoardSplash;
