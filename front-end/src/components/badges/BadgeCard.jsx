import { Trophy, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Clean category styling matching standard quotient card colors
const tierStyles = {
    gold: {
        bg: 'bg-amber-50 dark:bg-amber-950/25',
        color: 'text-amber-500 dark:text-amber-400',
        border: 'group-hover:border-amber-500/30'
    },
    silver: {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        color: 'text-slate-400 dark:text-slate-300',
        border: 'group-hover:border-slate-400/30'
    },
    bronze: {
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        color: 'text-orange-600 dark:text-orange-400',
        border: 'group-hover:border-orange-500/30'
    },
    standard: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        color: 'text-[#1a3884] dark:text-blue-400',
        border: 'group-hover:border-[#1a3884]/30'
    }
};

const BadgeCard = ({ badge, onClick }) => {
    const tier = badge.tier?.toLowerCase() || 'standard';
    const style = tierStyles[tier] || tierStyles.standard;

    // Pick dynamic icons based on tier
    const isGoldOrTrophy = tier === 'gold' || badge.title?.toLowerCase().includes('gold') || badge.title?.toLowerCase().includes('conqueror');
    const BadgeIcon = isGoldOrTrophy ? Trophy : Award;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            onClick={() => onClick?.(badge)}
            className={`bg-white dark:bg-slate-900/40 rounded-[24px] p-6 border border-slate-100 dark:border-white/8 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 group cursor-pointer ${style.border}`}
        >
            <div className="flex flex-col h-full justify-between min-h-[220px]">
                <div>
                    {/* Clean rounded icon slot */}
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <BadgeIcon className="w-6 h-6" />
                        </div>
                        
                        {/* Verified Pill Status */}
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-900/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Active
                        </span>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-base font-black text-slate-950 dark:text-white leading-tight mb-2 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors duration-200">
                        {badge.title}
                    </h4>
                    
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {badge.description}
                    </p>
                </div>

                {/* Footer XP Pill */}
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                    {badge.xp ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#1a3884] dark:text-blue-400 bg-blue-50/50 dark:bg-[#002A5C]/40 px-2.5 py-1 rounded-lg">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            +{badge.xp} XP
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Unlocked</span>
                    )}

                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        View
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default BadgeCard;
