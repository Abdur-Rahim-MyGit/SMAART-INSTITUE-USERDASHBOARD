import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react';
import { FaLinkedin, FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/* ── Inline hex badge for modal (mirrors BadgeCard logic) ── */
const MODULE_PALETTE = {
    capacity:   { hex: '#1a3884', ribbon: '#0d2059', tick: '#7aa3f0' },
    capability: { hex: '#1750b3', ribbon: '#0f3d8c', tick: '#6fa4f5' },
    leadership: { hex: '#14337a', ribbon: '#0b2057', tick: '#6690e0' },
    piq:        { hex: '#0e5a8c', ribbon: '#09415f', tick: '#5bbde0' },
    aiq:        { hex: '#1b5fa6', ribbon: '#114080', tick: '#68aef2' },
    sq:         { hex: '#1e3a5f', ribbon: '#112338', tick: '#5a8ec2' },
    default:    { hex: '#1a3884', ribbon: '#0d2059', tick: '#7aa3f0' },
};
const resolveColors = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('capacity'))   return MODULE_PALETTE.capacity;
    if (c.includes('capability')) return MODULE_PALETTE.capability;
    if (c.includes('leadership')) return MODULE_PALETTE.leadership;
    if (c.includes('piq'))        return MODULE_PALETTE.piq;
    if (c.includes('aiq'))        return MODULE_PALETTE.aiq;
    if (c.includes('sq'))         return MODULE_PALETTE.sq;
    return MODULE_PALETTE.default;
};
const HEX_PATH = 'M50 5 L95 27.5 L95 87.5 L50 110 L5 87.5 L5 27.5 Z';
const splitLines = (text = '', maxLen = 12) => {
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
        if (test.length <= maxLen) { current = test; }
        else { if (current) lines.push(current.trim()); current = tok; }
    }
    if (current) lines.push(current.trim());
    return lines.slice(0, 3);
};
const ModalHexBadge = ({ badge }) => {
    const c = resolveColors(badge.category);
    const uid = (badge.id || badge.badgeId || 'b').replace(/[^a-zA-Z0-9]/g, '');
    const year = badge.earnedDate ? new Date(badge.earnedDate).getFullYear() : new Date().getFullYear();
    const displayName = (badge.title || '').replace(/ Master$/i, '').trim();
    const lines = splitLines(displayName, 12);

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
        <svg viewBox="0 0 100 130" width={140} height={140} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`mo-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.hex} />
                    <stop offset="100%" stopColor={c.ribbon} />
                </linearGradient>
                <linearGradient id={`mi-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#eef3ff" />
                </linearGradient>
                <clipPath id={`mc-${uid}`}><rect x="0" y="70" width="100" height="30" /></clipPath>
            </defs>
            <path d={HEX_PATH} fill={`url(#mo-${uid})`} />
            <path d="M50 12 L88 32 L88 83 L50 103 L12 83 L12 32 Z" fill={`url(#mi-${uid})`} />
            <g clipPath={`url(#mc-${uid})`}>
                <path d="M0 72 L100 72 L100 90 L0 90 Z" fill={c.hex} />
                <polygon points="0,90 50,98 100,90 100,93 50,101 0,93" fill={c.ribbon} />
                <polygon points="0,72 50,64 100,72 100,69 50,61 0,69" fill={c.hex} />
            </g>
            {/* Perfectly centred text block */}
            {lines.map((line, i) => (
                <text
                    key={i}
                    x="50"
                    y={startY + i * lineHeight}
                    textAnchor="middle"
                    fontFamily="Inter,'Segoe UI',Arial,sans-serif"
                    fontWeight="800"
                    fontSize={fontSize}
                    fill={c.hex}
                    letterSpacing="0.2"
                >
                    {line}
                </text>
            ))}
            <text x="50" y="82" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="900" fontSize="7" fill="#fff" letterSpacing="2">CERTIFIED</text>
            <text x="50" y="94" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="5.5" fill="rgba(255,255,255,0.85)" letterSpacing="0.5">{year}</text>
            <text x="50" y="122" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="800" fontSize="5" fill={c.hex} letterSpacing="1.5">SMAART INSTITUTE</text>
        </svg>
    );
};

// Clean category styling matching standard quotient card colors
const tierStyles = {
    gold: {
        bg: 'bg-amber-50 dark:bg-amber-950/25',
        color: 'text-amber-500 dark:text-amber-400',
        textColor: 'text-amber-800 dark:text-amber-400'
    },
    silver: {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        color: 'text-slate-400 dark:text-slate-300',
        textColor: 'text-slate-700 dark:text-slate-300'
    },
    bronze: {
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        color: 'text-orange-600 dark:text-orange-400',
        textColor: 'text-orange-800 dark:text-orange-400'
    },
    standard: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        color: 'text-[#1a3884] dark:text-blue-400',
        textColor: 'text-[#1a3884] dark:text-teal-400'
    }
};

const BadgeModal = ({ badge, isOpen, onClose, userName = 'Student' }) => {
    const { t, i18n } = useTranslation();
    const [isSharing, setIsSharing] = useState(false);

    if (!badge) return null;

    const displayCode = badge.badgeId || badge.id;
    const verificationUrl = `${window.location.origin}/verify-badge/${displayCode}`;
    const tier = badge.tier?.toLowerCase() || 'standard';
    const style = tierStyles[tier] || tierStyles.standard;


    const handleShare = async (platform) => {
        setIsSharing(true);
        const shareText = `🏆 I just earned the "${badge.title}" badge at SMAART Institute! #SMAARTInstitute #Achievement`;
        const shareUrl = verificationUrl;

        if (platform === 'linkedin') {
            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
            window.open(url, '_blank', 'width=600,height=400');
            toast.success('Opening LinkedIn to share your achievement!');
        } else if (platform === 'whatsapp') {
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
            window.open(url, '_blank');
            toast.success('Opening WhatsApp to share your achievement!');
        } else if (platform === 'instagram') {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            toast.success('Link copied! Paste it to share on Instagram.');
            window.open('https://instagram.com', '_blank');
        }
        setIsSharing(false);
    };

    const handleDownloadCertificate = async () => {
        const toastId = toast.loading('Generating badge certificate...');

        try {
            const element = document.getElementById('hidden-pdf-certificate');
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
            pdf.save(`${badge.title.replace(/\s+/g, '_')}_Badge_Certificate.pdf`);

            toast.success('Badge certificate downloaded!', { id: toastId });
        } catch (error) {
            console.error('Error generating certificate:', error);
            toast.error('Failed to generate certificate', { id: toastId });
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                        onClick={onClose}
                    />
                    {/* Positioning wrapper — plain div owns centering, motion.div owns animation only */}
                    <div
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000,
                            width: '90vw',
                            maxWidth: '28rem',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="max-h-[92vh] overflow-y-auto bg-white dark:bg-[#002147] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-slate-100 dark:border-white/10 scrollbar-thin"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 transition-all shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Hidden Landscape Certificate strictly for PDF Export */}
                        <div 
                            id="hidden-pdf-certificate" 
                            className="absolute w-[1122px] h-[794px] bg-white text-slate-900 font-sans flex flex-col justify-between overflow-hidden"
                            style={{ 
                                position: 'absolute',
                                left: '-9999px', 
                                top: '-9999px', 
                                padding: '60px', 
                                pointerEvents: 'none',
                                zIndex: -1
                            }}
                        >
                            {/* Header Stripe */}
                            <div className="absolute top-0 left-0 w-full h-4 bg-[#1a3884]"></div>
                            <div className="absolute top-4 left-0 w-full h-1 bg-[#287a84]"></div>
                            
                            {/* Decorative Elements */}
                            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
                            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>

                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 relative z-10">
                                <div className="mb-10">
                                    <h1 className="text-4xl font-black text-[#1a3884] uppercase tracking-widest mb-2">SMAART Institute</h1>
                                    <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">Badge Verification Certificate</p>
                                </div>

                                <p className="text-2xl text-slate-500 mb-4 font-medium tracking-wide">This formally certifies that</p>
                                <h2 className="text-5xl font-black text-slate-900 mb-10 pb-4 border-b-2 border-slate-200 inline-block px-16">{userName}</h2>
                                
                                <p className="text-xl text-slate-500 mb-8 font-medium tracking-wide">has successfully demonstrated mastery and earned the</p>
                                
                                <div className="flex items-center justify-center gap-8 mb-8 bg-slate-50 py-6 px-12 rounded-[24px] border border-slate-100 shadow-sm">
                                    <div className="w-28 h-28 flex-shrink-0">
                                        <ModalHexBadge badge={badge} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-4xl font-black text-[#1a3884] mb-3 leading-tight">{badge.title}</h3>
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold uppercase tracking-wider">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Verified Credential
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto flex items-end justify-between border-t-2 border-slate-100 pt-8 relative z-10">
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Date of Issue</p>
                                    <p className="text-xl font-black text-slate-800">
                                        {badge.earnedDate ? new Date(badge.earnedDate).toLocaleDateString(i18n.language || 'en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        }) : new Date().toLocaleDateString()}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Verification Code</p>
                                        <p className="text-lg font-mono font-bold text-slate-800 tracking-wider">{displayCode}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                                        <QRCodeSVG
                                            value={verificationUrl}
                                            size={80}
                                            level="H"
                                            includeMargin={false}
                                            fgColor="#1a3884"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Bottom Stripe */}
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-[#1a3884]"></div>
                        </div>

                        {/* Certificate Content for PDF */}
                        <div id="badge-certificate-content" className="bg-white dark:bg-slate-900/30 relative overflow-hidden py-5 px-4 sm:px-6 border-b border-slate-50 dark:border-white/5">
                            <div className="flex flex-col items-center">
                                {/* Hexagonal badge */}
                                <div className="mb-1 mt-1">
                                    <ModalHexBadge badge={badge} />
                                </div>

                                {/* Achievement Badge Title - scaled down */}
                                <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight mb-1.5 text-center px-2">
                                    {badge.title}
                                </h3>

                                {/* Verification checkmark pill - tighter margins */}
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-900/30 mb-3">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    {t('badge_gallery.verified_credential')}
                                </span>

                                {/* Description - tighter margins */}
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium text-center max-w-sm mb-4 leading-relaxed line-clamp-3 px-2">
                                    {badge.description}
                                </p>

                                {/* Award Details Card - tighter spacing and margins */}
                                <div className="w-full max-w-sm p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2.5 mb-4 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                                            {t('badge_gallery.recipient')}
                                        </span>
                                        <span className="font-black text-slate-900 dark:text-white">{userName}</span>
                                    </div>

                                    {badge.earnedDate && (
                                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-2">
                                            <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                                                {t('badge_gallery.earned_date')}
                                            </span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                {new Date(badge.earnedDate).toLocaleDateString(i18n.language || 'en-GB', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* QR Code & Verification Section - clean centered align */}
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm max-w-sm w-full">
                                    <QRCodeSVG
                                        value={verificationUrl}
                                        size={52}
                                        level="H"
                                        includeMargin={false}
                                        bgColor="transparent"
                                        fgColor="#1a3884"
                                    />
                                    <div className="text-right min-w-0">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                            {t('badge_gallery.verification_code')}
                                        </p>
                                        <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 break-all">
                                            {displayCode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer - reduced padding and tighter button grids */}
                        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/10 rounded-b-[24px]">
                            {/* Share Options */}
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center mb-2.5">
                                {t('badge_gallery.share_credential')}
                            </p>
                            <div className="flex justify-center items-center gap-3.5 mb-5">
                                <button
                                    onClick={() => handleShare('linkedin')}
                                    disabled={isSharing}
                                    title="Share on LinkedIn"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0077b5]/10 hover:bg-[#0077b5] text-[#0077b5] hover:text-white transition-all duration-200 border border-[#0077b5]/20 hover:border-transparent active:scale-90"
                                >
                                    <FaLinkedin className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleShare('whatsapp')}
                                    disabled={isSharing}
                                    title="Share on WhatsApp"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25d366]/10 hover:bg-[#25d366] text-[#25d366] hover:text-white transition-all duration-200 border border-[#25d366]/20 hover:border-transparent active:scale-90"
                                >
                                    <FaWhatsapp className="w-4.5 h-4.5" />
                                </button>
                                <button
                                    onClick={() => handleShare('instagram')}
                                    disabled={isSharing}
                                    title="Copy Link for Instagram"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1306c]/10 hover:bg-[#e1306c] text-[#e1306c] hover:text-white transition-all duration-200 border border-[#e1306c]/20 hover:border-transparent active:scale-90"
                                >
                                    <FaInstagram className="w-4.5 h-4.5" />
                                </button>
                            </div>

                            {/* Download & Verification Actions - condensed grid */}
                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
                                <button
                                    onClick={handleDownloadCertificate}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3884] hover:bg-[#132c6b] text-white text-[11px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download Badge
                                </button>
                                <a
                                    href={verificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#1a3884] dark:text-blue-400 text-[11px] font-black uppercase tracking-widest transition-all transform active:scale-95 hover:border-[#1a3884]/30 hover:bg-[#1a3884]/5 dark:hover:bg-[#1a3884]/10 text-center"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Verify Badge
                                </a>
                            </div>
                        </div>
                    </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BadgeModal;
