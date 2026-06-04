import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';

/* ────────────────────────────────────────────────
   Module colour palette — all in the Deep Navy family
──────────────────────────────────────────────── */
const MODULE_PALETTE = {
    'capacity': {
        hex: '#1a3884', ribbon: '#0d2059', text: '#FFFFFF',
        label: '#b3c6f5', glow: 'rgba(26,56,132,0.55)', tick: '#7aa3f0',
    },
    'capability': {
        hex: '#1750b3', ribbon: '#0f3d8c', text: '#FFFFFF',
        label: '#a8c4f8', glow: 'rgba(23,80,179,0.55)', tick: '#6fa4f5',
    },
    'leadership': {
        hex: '#14337a', ribbon: '#0b2057', text: '#FFFFFF',
        label: '#95b0e8', glow: 'rgba(20,51,122,0.55)', tick: '#6690e0',
    },
    'piq': {
        hex: '#0e5a8c', ribbon: '#09415f', text: '#FFFFFF',
        label: '#7fcde8', glow: 'rgba(14,90,140,0.55)', tick: '#5bbde0',
    },
    'aiq': {
        hex: '#1b5fa6', ribbon: '#114080', text: '#FFFFFF',
        label: '#90c4f4', glow: 'rgba(27,95,166,0.55)', tick: '#68aef2',
    },
    'sq': {
        hex: '#1e3a5f', ribbon: '#112338', text: '#FFFFFF',
        label: '#7ca2cc', glow: 'rgba(30,58,95,0.55)', tick: '#5a8ec2',
    },
    'default': {
        hex: '#1a3884', ribbon: '#0d2059', text: '#FFFFFF',
        label: '#b3c6f5', glow: 'rgba(26,56,132,0.55)', tick: '#7aa3f0',
    },
};

export const resolveColors = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('capacity'))   return MODULE_PALETTE['capacity'];
    if (c.includes('capability')) return MODULE_PALETTE['capability'];
    if (c.includes('leadership')) return MODULE_PALETTE['leadership'];
    if (c.includes('piq'))        return MODULE_PALETTE['piq'];
    if (c.includes('aiq'))        return MODULE_PALETTE['aiq'];
    if (c.includes('sq'))         return MODULE_PALETTE['sq'];
    return MODULE_PALETTE['default'];
};

/* ── Hexagonal path ── */
const HEX_PATH = 'M50 5 L95 27.5 L95 87.5 L50 110 L5 87.5 L5 27.5 Z';

/**
 * Split course title into neat lines (≤13 chars each, max 3 lines)
 * so they fit cleanly inside the hex face.
 */
/**
 * Split text into ≤3 lines that fit within the hex face.
 * Splits on spaces and hyphens, removing hyphens for clean visual centering.
 */
const splitIntoLines = (text = '', maxLen = 12) => {
    const tokens = [];
    text.split(/[ -]/).forEach(word => {
        if (word.trim()) {
            tokens.push(word.trim());
        }
    });
    const lines = [];
    let current = '';
    for (const tok of tokens) {
        const test = current ? `${current} ${tok}` : tok;
        if (test.length <= maxLen) {
            current = test;
        } else {
            if (current) lines.push(current.trim());
            current = tok;
        }
    }
    if (current) lines.push(current.trim());
    return lines.slice(0, 3);
};

/* ────────────────────────────────────────────────
   HexBadgeSVG  —  the visual badge centrepiece
   ──────────────────────────────────────────────── */
export const HexBadgeSVG = ({ colors, badgeId, courseName, year, size = 190 }) => {
    const c = colors;
    const uid = (badgeId || 'badge').replace(/[^a-zA-Z0-9]/g, '');

    const displayName = (courseName || '').replace(/ Master$/i, '').trim();
    const lines = splitIntoLines(displayName, 12);

    // Pick font sizes with perfect breathing room to avoid crowding the borders
    const maxLineLen = Math.max(...lines.map(l => l.length), 1);
    let fontSize = 8.2;
    if (maxLineLen > 11) fontSize = 7.2;
    else if (maxLineLen < 8) fontSize = 9.2;

    const lineHeight = fontSize * 1.25;
    const midY = 41.0; // Visually balanced center (between top point y=12 and ribbon peak y=61)
    
    // Standard baseline offset centering:
    // startY is the baseline of the first line.
    // startY = midY - ((n - 1) * lh - 0.7 * fs) / 2
    const startY = midY - ((lines.length - 1) * lineHeight - 0.7 * fontSize) / 2;

    return (
        <svg
            viewBox="0 0 100 130"
            width={size}
            height={size}
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <filter id={`gw-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id={`go-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={c.hex}    />
                    <stop offset="100%" stopColor={c.ribbon}  />
                </linearGradient>
                <linearGradient id={`gi-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#eef3ff" />
                </linearGradient>
                <clipPath id={`rc-${uid}`}>
                    <rect x="0" y="70" width="100" height="30" />
                </clipPath>
            </defs>

            {/* Outer hex ring */}
            <path d={HEX_PATH} fill={`url(#go-${uid})`} filter={`url(#gw-${uid})`} />

            {/* Inner white face */}
            <path d="M50 12 L88 32 L88 83 L50 103 L12 83 L12 32 Z" fill={`url(#gi-${uid})`} />

            {/* Ribbon band */}
            <g clipPath={`url(#rc-${uid})`}>
                <path d="M0 72 L100 72 L100 90 L0 90 Z" fill={c.hex} />
                <polygon points="0,90 50,98 100,90 100,93 50,101 0,93" fill={c.ribbon} />
                <polygon points="0,72 50,64 100,72 100,69 50,61 0,69" fill={c.hex} />
            </g>

            {/* Course name — dynamically sized and perfectly centered */}
            {lines.map((line, i) => (
                <text
                    key={i}
                    x="50"
                    y={startY + i * lineHeight}
                    textAnchor="middle"
                    fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
                    fontWeight="800"
                    fontSize={fontSize}
                    fill={c.hex}
                    letterSpacing="0.2"
                >
                    {line}
                </text>
            ))}

            {/* "CERTIFIED" on ribbon */}
            <text
                x="50" y="82"
                textAnchor="middle"
                fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
                fontWeight="900"
                fontSize="7"
                fill="#FFFFFF"
                letterSpacing="2"
            >
                CERTIFIED
            </text>

            {/* Year */}
            <text
                x="50" y="94"
                textAnchor="middle"
                fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
                fontWeight="700"
                fontSize="5.5"
                fill="rgba(255,255,255,0.85)"
                letterSpacing="0.5"
            >
                {year}
            </text>

            {/* SMAART INSTITUTE below hex */}
            <text
                x="50" y="122"
                textAnchor="middle"
                fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
                fontWeight="800"
                fontSize="5"
                fill={c.hex}
                letterSpacing="1.5"
            >
                SMAART INSTITUTE
            </text>
        </svg>
    );
};

/* ────────────────────────────────────────────────
   BadgeCard  —  the full card shown in the grid
──────────────────────────────────────────────── */
const BadgeCard = ({ badge, onClick }) => {
    const colors = resolveColors(badge.category);
    const year   = badge.earnedDate
        ? new Date(badge.earnedDate).getFullYear()
        : new Date().getFullYear();

    const shortTitle = (badge.title || '').replace(/ Master$/i, '').trim();

    const moduleLabel = (badge.category || 'Learning')
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={() => onClick?.(badge)}
            className="group relative flex flex-col items-center cursor-pointer
                       rounded-2xl border border-[#d8e6f7] bg-white
                       px-4 pt-6 pb-4 shadow-sm
                       hover:shadow-[0_8px_32px_rgba(26,56,132,0.14)]
                       hover:border-[#1a3884]/30
                       dark:border-[#1a3884]/20 dark:bg-[#001630]
                       transition-all duration-300 overflow-hidden"
            style={{ minHeight: 290 }}
        >
            {/* Subtle radial glow on hover */}
            <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
                           transition-opacity duration-500 rounded-2xl"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${colors.glow}22 0%, transparent 70%)`,
                }}
            />

            {/* Hexagonal badge SVG */}
            <div className="relative z-10 mb-3">
                <HexBadgeSVG
                    colors={colors}
                    badgeId={badge.id || badge.badgeId}
                    courseName={shortTitle}
                    year={year}
                    size={150}
                />
            </div>

            {/* Course name below badge */}
            <h4
                className="relative z-10 text-center text-[13px] font-extrabold leading-snug
                           text-[#0d1f4e] dark:text-white
                           group-hover:text-[#1a3884] dark:group-hover:text-blue-300
                           transition-colors duration-200 px-1 mb-1"
            >
                {shortTitle}
            </h4>

            {/* Module tag pill */}
            <span
                className="relative z-10 mb-3 inline-block rounded-full px-2.5 py-0.5
                           text-[8.5px] font-black uppercase tracking-[0.18em]"
                style={{
                    background: `${colors.hex}18`,
                    color: colors.hex,
                    border: `1px solid ${colors.hex}30`,
                }}
            >
                {moduleLabel}
            </span>

            {/* Footer: Verified */}
            <div className="relative z-10 mt-auto flex w-full items-center justify-center
                            border-t border-[#d8e6f7] dark:border-[#1a3884]/20 pt-2.5">
                <span className="flex items-center gap-1.5 text-[9px] font-extrabold
                                 uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Verified
                </span>
            </div>
        </motion.div>
    );
};

export default BadgeCard;
