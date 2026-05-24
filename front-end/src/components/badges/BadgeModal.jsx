import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, X, Linkedin, Facebook, Download, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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

    const verificationUrl = `${window.location.origin}/verify-badge/${badge._id || badge.id}`;
    const tier = badge.tier?.toLowerCase() || 'standard';
    const style = tierStyles[tier] || tierStyles.standard;

    // Pick dynamic icons based on tier
    const isGoldOrTrophy = tier === 'gold' || badge.title?.toLowerCase().includes('gold') || badge.title?.toLowerCase().includes('conqueror');
    const BadgeIcon = isGoldOrTrophy ? Trophy : Award;

    const handleShare = async (platform) => {
        setIsSharing(true);
        const shareText = `🏆 I just earned the "${badge.title}" badge at SMAART Institute! ${badge.xp ? `+${badge.xp} XP` : ''} #SMAARTInstitute #Achievement`;
        const shareUrl = verificationUrl;

        const shareUrls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
            toast.success(`Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)} to share your achievement!`);
        }
        setIsSharing(false);
    };

    const handleDownloadCertificate = async () => {
        const toastId = toast.loading('Generating badge certificate...');

        try {
            const element = document.getElementById('badge-certificate-content');
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a5',
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 210, 148);
            pdf.save(`${badge.title.replace(/\s+/g, '_')}_Badge_Certificate.pdf`);

            toast.success('Badge certificate downloaded!', { id: toastId });
        } catch (error) {
            console.error('Error generating certificate:', error);
            toast.error('Failed to generate certificate', { id: toastId });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        className="relative w-full max-w-xl max-h-[96vh] overflow-y-auto bg-white dark:bg-[#002147] rounded-[24px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-white/8 scrollbar-thin"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 transition-all shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Certificate Content for PDF */}
                        <div id="badge-certificate-content" className="bg-white dark:bg-slate-900/30 relative overflow-hidden py-5 px-4 sm:px-6 border-b border-slate-50 dark:border-white/5">
                            <div className="flex flex-col items-center">
                                {/* Clean Square-Rounded Icon Container - scaled down */}
                                <div className={`w-12 h-12 rounded-xl ${style.bg} ${style.color} flex items-center justify-center mb-3 mt-1 shadow-sm`}>
                                    <BadgeIcon className="w-6 h-6" />
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
                                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-2">
                                        <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                                            {t('badge_gallery.xp_credit')}
                                        </span>
                                        <span className="font-black text-[#1a3884] dark:text-blue-400 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            +{badge.xp || 0} XP
                                        </span>
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

                                {/* QR Code & Verification Section - tighter padding */}
                                <div className="flex items-center gap-3.5 p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm max-w-sm w-full">
                                    <QRCodeSVG
                                        value={verificationUrl}
                                        size={52}
                                        level="H"
                                        includeMargin={false}
                                        bgColor="transparent"
                                        fgColor="#1a3884"
                                    />
                                    <div className="text-left min-w-0 flex-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                            {t('badge_gallery.verification_code')}
                                        </p>
                                        <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 break-all">
                                            {badge._id || badge.id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer - reduced padding and tighter button grids */}
                        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/10 rounded-b-[24px]">
                            {/* Share Options */}
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center mb-2">
                                {t('badge_gallery.share_credential')}
                            </p>
                            <div className="flex justify-center flex-wrap gap-2 mb-4">
                                <button
                                    onClick={() => handleShare('linkedin')}
                                    disabled={isSharing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5] hover:bg-[#006699] text-white rounded-lg transition-all font-bold text-[9px] uppercase tracking-wider shadow-sm"
                                >
                                    <Linkedin className="w-3 h-3" />
                                    LinkedIn
                                </button>
                                <button
                                    onClick={() => handleShare('facebook')}
                                    disabled={isSharing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg transition-all font-bold text-[9px] uppercase tracking-wider shadow-sm"
                                >
                                    <Facebook className="w-3 h-3" />
                                    Facebook
                                </button>
                                <button
                                    onClick={() => handleShare('twitter')}
                                    disabled={isSharing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f1419] hover:bg-[#181d22] text-white rounded-lg transition-all font-bold text-[9px] uppercase tracking-wider shadow-sm"
                                >
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    X
                                </button>
                            </div>

                            {/* Download & Verification Actions - condensed grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-sm mx-auto w-full">
                                <button
                                    onClick={handleDownloadCertificate}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#1a3884] to-[#002147] text-white text-[11px] font-black uppercase tracking-widest hover:shadow-sm transform active:scale-95 transition-all w-full text-center"
                                >
                                    <Download className="w-3.5 h-3.5" /> {t('badge_gallery.download_certificate')}
                                </button>
                                <a
                                    href={verificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-[#002147] dark:text-white text-[11px] font-black uppercase tracking-widest hover:shadow-sm hover:border-[#1a3884] dark:hover:border-blue-500 transform active:scale-95 transition-all w-full text-center"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> {t('badge_gallery.verify_badge')}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BadgeModal;
