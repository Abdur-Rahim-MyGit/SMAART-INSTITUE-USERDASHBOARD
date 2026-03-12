import { useState } from 'react';
import { FaShieldAlt, FaLock, FaAward } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Unified badge style — navy/teal brand palette
const badgeStyle = {
    gradient: 'from-[#1a3884] via-[#287a84] to-[#002147]',
    glow: 'shadow-[#1a3884]/30',
    bgGlow: 'bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20',
    borderColor: '#1a3884',
    textColor: 'text-[#002147] dark:text-teal-300',
};

const BadgeCard = ({ badge, onClick, isLocked = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: isLocked ? 1 : 1.04, y: isLocked ? 0 : -6 }}
            transition={{ duration: 0.3 }}
            className={`relative cursor-pointer ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !isLocked && onClick?.(badge)}
        >
            {/* Outer glow frame — sharp corners, color border + glow */}
            <div
                className="relative overflow-hidden p-[2px] transition-all duration-300"
                style={{
                    background: isLocked
                        ? 'linear-gradient(135deg, #64748b, #94a3b8)'
                        : 'linear-gradient(135deg, #1a3884, #287a84, #002147)',
                    boxShadow: isLocked
                        ? 'none'
                        : isHovered
                            ? '0 0 0 1px #1a388466, 0 0 24px #1a388455, 0 8px 32px #1a388433'
                            : '0 0 0 1px #1a388433, 0 4px 20px #1a388422',
                }}
            >
                {/* Inner Card */}
                <div
                    className={`relative ${badgeStyle.bgGlow} p-5 backdrop-blur-sm`}
                    style={{
                        border: `1px solid ${isLocked ? '#94a3b840' : '#1a388430'}`,
                    }}
                >
                    {/* Lock Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                            <FaLock className="w-8 h-8 text-white/80" />
                        </div>
                    )}

                    {/* Shield Icon */}
                    <div className="relative flex justify-center mb-4">
                        <div
                            className="relative w-20 h-20 flex items-center justify-center shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, #1a3884, #287a84, #002147)',
                            }}
                        >
                            <FaShieldAlt className="w-12 h-12 text-white drop-shadow-md" />
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1.5 shadow-md">
                                <FaAward className={`w-4 h-4 ${badgeStyle.textColor}`} />
                            </div>
                        </div>

                        {/* Animated Glow Ring */}
                        {!isLocked && isHovered && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.3, opacity: 0.4 }}
                                className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-[#1a3884] via-[#287a84] to-[#002147] blur-xl"
                            />
                        )}
                    </div>

                    {/* Badge Title */}
                    <h3 className={`text-center font-bold text-sm mb-1 ${badgeStyle.textColor}`}>
                        {badge.title}
                    </h3>

                    {/* Badge Description */}
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {badge.description}
                    </p>

                    {/* XP Badge */}
                    {badge.xp && (
                        <div className="mt-3 flex justify-center">
                            <span
                                className="px-3 py-1 text-xs font-bold text-white shadow-md"
                                style={{
                                    background: 'linear-gradient(90deg, #1a3884, #287a84)',
                                    boxShadow: '0 2px 10px #1a388444',
                                }}
                            >
                                +{badge.xp} XP
                            </span>
                        </div>
                    )}

                    {/* Earned Date */}
                    {badge.earnedDate && !isLocked && (
                        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                            Earned: {new Date(badge.earnedDate).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default BadgeCard;
