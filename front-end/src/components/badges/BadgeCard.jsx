import { Trophy, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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

const cleanTitle = (title) => {
    if (!title) return '';
    return title
        .replace(/\s*\(\s*(gold|silver|bronze)\s*\)/i, '')
        .replace(/\s+(gold|silver|bronze)/i, '')
        .trim();
};

const BadgeCard = ({ badge, onClick }) => {
    const { t } = useTranslation();
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
            className={`relative bg-white dark:bg-slate-900/40 rounded-[24px] p-4 sm:p-6 border border-slate-100 dark:border-white/8 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 group cursor-pointer ${style.border}`}
        >
            {/* Verified Pill Status - Positioned at the absolute top-right, collapsing beautifully on mobile */}
            <span className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-1 sm:px-2 sm:py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-900/30 z-10">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-3 h-3 text-emerald-500" />
                <span className="hidden sm:inline">{t('badge_gallery.verified')}</span>
            </span>

            <div className="flex flex-col h-full justify-between min-h-[140px]">
                <div>
                    {/* Clean centered icon slot */}
                    <div className="flex justify-center mb-4 sm:mb-5 mt-1 sm:mt-2">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <BadgeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                    </div>

                    {/* Title centered with cleanTitle */}
                    <h4 className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-tight mb-2 text-center group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors duration-200">
                        {cleanTitle(badge.title)}
                    </h4>
                </div>

                {/* Footer XP Pill */}
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between gap-1">
                    {badge.xp ? (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#1a3884] dark:text-blue-400 bg-blue-50/50 dark:bg-[#002A5C]/40 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg whitespace-nowrap">
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" />
                            +{badge.xp} XP
                        </span>
                    ) : (
                        <span className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500">
                            {t('badge_gallery.unlocked')}
                        </span>
                    )}

                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        {t('badge_gallery.view')}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default BadgeCard;
