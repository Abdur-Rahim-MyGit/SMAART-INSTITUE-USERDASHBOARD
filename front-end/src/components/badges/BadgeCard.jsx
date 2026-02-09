import { useState } from 'react';
import { FaShieldAlt, FaLock, FaAward } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Unified badge style - single teal/navy design
const badgeStyle = {
    gradient: 'from-[#30919D] via-[#287a84] to-[#002147]',
    glow: 'shadow-[#30919D]/30',
    bgGlow: 'bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20',
    borderColor: 'border-[#30919D]',
    textColor: 'text-[#002147] dark:text-teal-300',
};

const BadgeCard = ({ badge, onClick, isLocked = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: isLocked ? 1 : 1.05, y: isLocked ? 0 : -5 }}
            transition={{ duration: 0.3 }}
            className={`relative cursor-pointer ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !isLocked && onClick?.(badge)}
        >
            {/* Card Container */}
            <div className={`
                relative overflow-hidden rounded-2xl p-1
                bg-gradient-to-br ${badgeStyle.gradient}
                ${!isLocked && `shadow-xl ${badgeStyle.glow}`}
                transition-all duration-300
            `}>
                {/* Inner Card */}
                <div className={`
                    ${badgeStyle.bgGlow}
                    rounded-xl p-5 backdrop-blur-sm
                    border ${badgeStyle.borderColor} border-opacity-30
                `}>
                    {/* Lock Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-10">
                            <FaLock className="w-8 h-8 text-white/80" />
                        </div>
                    )}

                    {/* Shield Icon */}
                    <div className="relative flex justify-center mb-4">
                        <div className={`
                            relative w-20 h-20 flex items-center justify-center
                            bg-gradient-to-br ${badgeStyle.gradient}
                            rounded-full shadow-lg
                        `}>
                            <FaShieldAlt className="w-12 h-12 text-white drop-shadow-md" />
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-md">
                                <FaAward className={`w-4 h-4 ${badgeStyle.textColor}`} />
                            </div>
                        </div>
                        
                        {/* Animated Glow Ring */}
                        {!isLocked && isHovered && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 0.5 }}
                                className={`absolute inset-0 w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${badgeStyle.gradient} blur-xl`}
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
                            <span className={`
                                px-3 py-1 rounded-full text-xs font-bold
                                bg-gradient-to-r ${badgeStyle.gradient} text-white
                                shadow-md
                            `}>
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
