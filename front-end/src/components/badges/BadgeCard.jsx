import { useState } from 'react';
import { FaShieldAlt, FaStar, FaLock, FaTrophy, FaMedal, FaCrown } from 'react-icons/fa';
import { motion } from 'framer-motion';

const tierConfig = {
    bronze: {
        gradient: 'from-amber-600 via-amber-500 to-yellow-600',
        glow: 'shadow-amber-500/30',
        bgGlow: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
        borderColor: 'border-amber-400',
        textColor: 'text-amber-700 dark:text-amber-400',
        stars: 1,
        icon: FaMedal,
    },
    silver: {
        gradient: 'from-slate-400 via-gray-300 to-slate-500',
        glow: 'shadow-slate-400/30',
        bgGlow: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-800/40 dark:to-gray-800/40',
        borderColor: 'border-slate-400',
        textColor: 'text-slate-600 dark:text-slate-300',
        stars: 2,
        icon: FaTrophy,
    },
    gold: {
        gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
        glow: 'shadow-yellow-400/40',
        bgGlow: 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30',
        borderColor: 'border-yellow-400',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        stars: 3,
        icon: FaCrown,
    },
};

const BadgeCard = ({ badge, onClick, isLocked = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const tier = tierConfig[badge.tier] || tierConfig.bronze;
    const TierIcon = tier.icon;

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
                bg-gradient-to-br ${tier.gradient}
                ${!isLocked && `shadow-xl ${tier.glow}`}
                transition-all duration-300
            `}>
                {/* Inner Card */}
                <div className={`
                    ${tier.bgGlow}
                    rounded-xl p-5 backdrop-blur-sm
                    border ${tier.borderColor} border-opacity-30
                `}>
                    {/* Lock Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-10">
                            <FaLock className="w-8 h-8 text-white/80" />
                        </div>
                    )}

                    {/* Shield Icon with Tier */}
                    <div className="relative flex justify-center mb-4">
                        <div className={`
                            relative w-20 h-20 flex items-center justify-center
                            bg-gradient-to-br ${tier.gradient}
                            rounded-full shadow-lg
                        `}>
                            <FaShieldAlt className="w-12 h-12 text-white drop-shadow-md" />
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-md">
                                <TierIcon className={`w-4 h-4 ${tier.textColor}`} />
                            </div>
                        </div>
                        
                        {/* Animated Glow Ring */}
                        {!isLocked && isHovered && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 0.5 }}
                                className={`absolute inset-0 w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${tier.gradient} blur-xl`}
                            />
                        )}
                    </div>

                    {/* Stars */}
                    <div className="flex justify-center gap-1 mb-3">
                        {[...Array(3)].map((_, i) => (
                            <FaStar
                                key={i}
                                className={`w-4 h-4 ${
                                    i < tier.stars
                                        ? tier.textColor
                                        : 'text-gray-300 dark:text-gray-600'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Badge Title */}
                    <h3 className={`text-center font-bold text-sm mb-1 ${tier.textColor}`}>
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
                                bg-gradient-to-r ${tier.gradient} text-white
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

            {/* Tier Label */}
            <div className={`
                absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                bg-gradient-to-r ${tier.gradient} text-white shadow-md
            `}>
                {badge.tier}
            </div>
        </motion.div>
    );
};

export default BadgeCard;
