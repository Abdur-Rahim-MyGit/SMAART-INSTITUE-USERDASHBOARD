import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Lock } from "@/components/icons";
import { toast } from 'sonner';

/* ────────────────────────────────────────────────
   Module palette — every badge shares the SMAART
   brand navy bezel; only the module code on the
   seal and the chip label change.
   ──────────────────────────────────────────────── */
const BRAND = { c1: '#034a7d', c2: '#045C9A' };

export const MODULE_PALETTE = {
    capacity:   { key: 'capacity',   code: 'CAP', label: 'Capacity',   ...BRAND },
    capability: { key: 'capability', code: 'APC', label: 'Capability', ...BRAND },
    leadership: { key: 'leadership', code: 'ELR', label: 'Leadership', ...BRAND },
    piq:        { key: 'piq',        code: 'PIQ', label: 'PIQ',        ...BRAND },
    aiq:        { key: 'aiq',        code: 'AIQ', label: 'AIQ',        ...BRAND },
    sq:         { key: 'sq',         code: 'SQ',  label: 'SQ',         ...BRAND },
    default:    { key: 'default',    code: 'SMT', label: 'Learning',   ...BRAND },
};

export const resolveColors = (category = '') => {
    const c = String(category || '').toLowerCase();
    if (c.includes('capacity'))   return MODULE_PALETTE.capacity;
    if (c.includes('capability')) return MODULE_PALETTE.capability;
    if (c.includes('leadership')) return MODULE_PALETTE.leadership;
    if (c.includes('piq'))        return MODULE_PALETTE.piq;
    if (c.includes('aiq'))        return MODULE_PALETTE.aiq;
    if (c.includes('sq'))         return MODULE_PALETTE.sq;
    return MODULE_PALETTE.default;
};

/* The SMAART star — same geometry as public/favicon.svg (100×100 box) */
export const STAR_PATH = 'M50 6 A44 44 0 0 0 94 50 A44 44 0 0 0 50 94 A44 44 0 0 0 6 50 A44 44 0 0 0 50 6 Z';

const TICKS = Array.from({ length: 60 }, (_, i) => {
    const a = (i * 6 * Math.PI) / 180;
    const len = i % 5 ? 1.6 : 3.2;
    return {
        x1: 70 + 55 * Math.cos(a), y1: 70 + 55 * Math.sin(a),
        x2: 70 + (55 - len) * Math.cos(a), y2: 70 + (55 - len) * Math.sin(a),
    };
});

/* ────────────────────────────────────────────────
   StarSealSVG — the medallion used everywhere a
   badge is drawn (gallery, modal, PDF, verify page,
   course completion). Pure SVG so it scales crisp.

   The gap ring and the check chip base use
   `currentColor`, so the wrapper decides the surface
   colour (white on light cards, navy on dark cards).
   ──────────────────────────────────────────────── */
export const StarSealSVG = ({
    colors = MODULE_PALETTE.default,
    badgeId,
    year,
    size = 132,
    locked = false,
    className = 'text-white dark:text-[#0d3a5f]',
    surfaceColor,
    style,
}) => {
    // Explicit surface colour for rasterised exports (html2canvas drops currentColor)
    const surface = surfaceColor || 'currentColor';
    const uid = String(badgeId || 'badge').replace(/[^a-zA-Z0-9]/g, '') || 'badge';
    const c = colors || MODULE_PALETTE.default;
    const yr = year || new Date().getFullYear();

    if (locked) {
        return (
            <svg
                viewBox="0 0 140 140"
                width={size}
                height={size}
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                style={style}
                aria-hidden="true"
            >
                <circle cx="70" cy="70" r="62" fill="none" stroke="#c9dbe6" strokeWidth="1.5" strokeDasharray="3 4" />
                <circle cx="70" cy="70" r="50" fill={surface} stroke="#c9dbe6" strokeWidth="1.5" />
                <g transform="translate(43 43) scale(0.54)">
                    <path d={STAR_PATH} fill="none" stroke="#9db4c4" strokeWidth="4" />
                </g>
                <g transform="translate(108 108)">
                    <circle r="13" fill={surface} stroke="#c9dbe6" />
                    <path d="M-4.5 -0.5v-3a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#7a94a6" strokeWidth="1.8" />
                    <rect x="-6" y="-0.5" width="12" height="8" rx="1.5" fill="#7a94a6" />
                </g>
            </svg>
        );
    }

    return (
        <svg
            viewBox="0 0 140 140"
            width={size}
            height={size}
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ overflow: 'visible', ...style }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={c.c2} />
                    <stop offset="1" stopColor={c.c1} />
                </linearGradient>
                <linearGradient id={`face-${uid}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#0f4573" />
                    <stop offset="0.55" stopColor="#072036" />
                    <stop offset="1" stopColor="#051627" />
                </linearGradient>
                <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
                    <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <radialGradient id={`halo-${uid}`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
                    <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.06" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <path id={`arc-top-${uid}`} d="M28 70 A42 42 0 0 1 112 70" />
                <path id={`arc-bottom-${uid}`} d="M26 70 A44 44 0 0 0 114 70" />
                <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#072036" floodOpacity="0.28" />
                </filter>
            </defs>

            {/* Bezel + gap ring */}
            <g filter={`url(#shadow-${uid})`}>
                <circle cx="70" cy="70" r="64" fill={`url(#ring-${uid})`} />
                <circle cx="70" cy="70" r="59" fill={surface} />
            </g>

            {/* Tick ring */}
            <g stroke={c.c1} strokeOpacity="0.55" strokeWidth="1">
                {TICKS.map((tk, i) => (
                    <line key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} />
                ))}
            </g>

            {/* Navy face */}
            <circle cx="70" cy="70" r="49" fill={`url(#face-${uid})`} />
            <circle cx="70" cy="70" r="49" fill={`url(#sheen-${uid})`} />
            <circle cx="70" cy="70" r="46" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="0.8" />

            {/* Ring text */}
            <text fontFamily="Inter, 'Segoe UI', Arial, sans-serif" fontWeight="800" fontSize="6.4" fill="#ffffff" fillOpacity="0.78" letterSpacing="2">
                <textPath href={`#arc-top-${uid}`} startOffset="50%" textAnchor="middle">SMAART INSTITUTE</textPath>
            </text>
            <text fontFamily="Inter, 'Segoe UI', Arial, sans-serif" fontWeight="800" fontSize="6.4" fill="#ffffff" fillOpacity="0.78" letterSpacing="2">
                <textPath href={`#arc-bottom-${uid}`} startOffset="50%" textAnchor="middle">{`${c.code} · ${yr}`}</textPath>
            </text>

            {/* Halo + star */}
            <circle cx="70" cy="70" r="30" fill={`url(#halo-${uid})`} />
            <g transform="translate(51 51) scale(0.38)">
                <path d={STAR_PATH} fill="#ffffff" />
            </g>

            {/* Verified chip */}
            <g transform="translate(113 106)">
                <circle r="14" fill={surface} />
                <circle r="10.5" fill={c.c1} />
                <path d="M-4.5 0.5l3 3 6-6.5" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </svg>
    );
};

/** @deprecated kept for older imports — renders the Star Seal. */
export const HexBadgeSVG = ({ colors, badgeId, year, size = 190, ...rest }) => (
    <StarSealSVG colors={colors} badgeId={badgeId} year={year} size={size} {...rest} />
);

const formatEarned = (date, lang) => {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    try {
        return d.toLocaleDateString(lang || 'en-GB', { month: 'short', year: 'numeric' });
    } catch {
        return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
};

/* ────────────────────────────────────────────────
   BadgeCard — the card shown in the gallery grid
   ──────────────────────────────────────────────── */
const BadgeCard = ({ badge, isLocked = false, onClick }) => {
    const { t, i18n } = useTranslation();
    const colors = resolveColors(badge.category);
    const year = badge.earnedDate ? new Date(badge.earnedDate).getFullYear() : new Date().getFullYear();
    const shortTitle = (badge.title || '').replace(/ Master$/i, '').trim();
    const moduleLabel = t(`badge_gallery.categories.${colors.key}`, colors.label);
    const earnedLabel = isLocked ? '' : formatEarned(badge.earnedDate, i18n.language);

    const handleClick = () => {
        if (isLocked) {
            toast.info(t('badge_gallery.locked_toast', { title: shortTitle, defaultValue: `Complete "${shortTitle}" to unlock this badge.` }));
            return;
        }
        onClick?.(badge);
    };

    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={isLocked ? {} : { y: -4 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={handleClick}
            aria-label={isLocked ? `${shortTitle} — ${t('badge_gallery.locked', 'Locked')}` : shortTitle}
            data-locked={isLocked ? 'true' : 'false'}
            className={`group relative flex w-full flex-col items-center overflow-hidden rounded-2xl border px-4 pb-3 pt-5 text-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#045C9A]/40
                ${isLocked
                    ? 'cursor-default border-dashed border-[#d7ebf5] bg-[#F1F5F9] dark:border-white/10 dark:bg-[#072036]/60'
                    : 'cursor-pointer border-[#d7ebf5]/80 bg-white shadow-sm hover:border-[#045C9A]/30 hover:shadow-[0_10px_30px_rgba(4,92,154,0.14)] dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]'
                }`}
        >
            {/* Module-colour glow */}
            {!isLocked && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(ellipse 70% 45% at 50% 0%, ${colors.c1}1f 0%, transparent 70%)` }}
                />
            )}

            <div className="relative">
                <StarSealSVG
                    colors={colors}
                    badgeId={badge.id || badge.badgeId}
                    year={year}
                    size={124}
                    locked={isLocked}
                    className={isLocked ? 'text-white dark:text-[#0d3a5f]' : 'text-white dark:text-[#0d3a5f]'}
                />
            </div>

            <h4
                className={`relative mb-2 mt-3.5 px-1 text-[13.5px] font-extrabold leading-snug text-[#072036] dark:text-white [text-wrap:balance]
                    ${isLocked ? '' : 'transition-colors group-hover:text-[#045C9A] dark:group-hover:text-[#A6D7E8]'}`}
            >
                {shortTitle}
            </h4>

            <div className="relative flex flex-wrap items-center justify-center gap-1.5">
                <span
                    className={`rounded-full px-2.5 py-[3px] text-[8.5px] font-black uppercase tracking-[0.16em]
                        ${isLocked
                            ? 'bg-[#35566b]/10 text-[#35566b] dark:bg-white/10 dark:text-[#A6D7E8]'
                            : 'bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]'}`}
                >
                    {moduleLabel}
                </span>
                {earnedLabel && (
                    <span className="rounded-full border border-[#d7ebf5] px-2.5 py-[3px] text-[8.5px] font-black uppercase tracking-[0.16em] text-[#35566b] dark:border-white/10 dark:text-[#A6D7E8]">
                        {earnedLabel}
                    </span>
                )}
            </div>

            <div className="relative mt-3.5 flex w-full items-center justify-center gap-1.5 border-t border-[#d7ebf5] pt-2.5 text-[9px] font-extrabold uppercase tracking-[0.14em] dark:border-white/10">
                {isLocked ? (
                    <>
                        <Lock className="h-3.5 w-3.5 text-[#35566b] dark:text-[#A6D7E8]" />
                        <span className="text-[#35566b] dark:text-[#A6D7E8]">{t('badge_gallery.locked_hint', 'Complete the course to unlock')}</span>
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">{t('badge_gallery.verified_achievement', 'Verified achievement')}</span>
                    </>
                )}
            </div>
        </motion.button>
    );
};

export default BadgeCard;
