import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaTimes, FaLinkedin, FaFacebook, FaTwitter, FaDownload, FaExternalLinkAlt, FaCheckCircle, FaAward } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const unifiedStyle = {
    gradient: 'from-[#30919D] via-[#287a84] to-[#002147]',
    bgGradient: 'from-teal-50 to-blue-50 dark:from-teal-950/20 dark:to-blue-950/20',
    textColor: 'text-[#002147] dark:text-teal-300',
    borderColor: 'border-[#30919D]',
    icon: FaShieldAlt,
};

const BadgeModal = ({ badge, isOpen, onClose, userName = 'Student' }) => {
    const [isSharing, setIsSharing] = useState(false);
    
    if (!badge) return null;
    
    const verificationUrl = `${window.location.origin}/verify-badge/${badge._id || badge.id}`;

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
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FaTimes className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* Certificate Content for PDF */}
                        <div id="badge-certificate-content" className={`bg-gradient-to-br ${unifiedStyle.bgGradient}`}>
                            {/* Header Banner */}
                            <div className={`bg-gradient-to-r ${unifiedStyle.gradient} p-6 text-center`}>
                                <h2 className="text-2xl font-bold text-white mb-1">Achievement Unlocked!</h2>
                                <p className="text-white/80 text-sm">SMAART Institute Badge Credential</p>
                            </div>

                            {/* Badge Display */}
                            <div className="p-8">
                                <div className="flex flex-col items-center">
                                    {/* Badge Icon */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', delay: 0.2, damping: 15 }}
                                        className={`
                                            relative w-32 h-32 flex items-center justify-center
                                            bg-gradient-to-br ${unifiedStyle.gradient}
                                            rounded-full shadow-2xl mb-6
                                        `}
                                    >
                                        <FaShieldAlt className="w-20 h-20 text-white drop-shadow-lg" />
                                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg">
                                            <FaAward className={`w-6 h-6 ${unifiedStyle.textColor}`} />
                                        </div>
                                        
                                        {/* Shine Effect */}
                                        <motion.div
                                            initial={{ x: '-100%', opacity: 0.5 }}
                                            animate={{ x: '200%', opacity: 0 }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12 rounded-full"
                                        />
                                    </motion.div>

                                    {/* Badge Title */}
                                    <h3 className={`text-2xl font-bold ${unifiedStyle.textColor} text-center mb-2`}>
                                        {badge.title}
                                    </h3>

                                    {/* Category Label */}
                                    <span className={`
                                        px-4 py-1 rounded-full text-sm font-bold uppercase
                                        bg-gradient-to-r ${unifiedStyle.gradient} text-white
                                        shadow-md mb-4
                                    `}>
                                        {badge.category || 'Achievement'}
                                    </span>

                                    {/* Description */}
                                    <p className="text-slate-600 dark:text-slate-300 text-center max-w-md mb-6">
                                        {badge.description}
                                    </p>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
                                        <div className={`text-center p-3 rounded-xl ${unifiedStyle.bgGradient} border ${unifiedStyle.borderColor}`}>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                                {badge.xp || 0}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">XP Earned</p>
                                        </div>
                                        <div className={`text-center p-3 rounded-xl ${unifiedStyle.bgGradient} border ${unifiedStyle.borderColor}`}>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                                <FaCheckCircle className="inline w-5 h-5 text-green-500" />
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified</p>
                                        </div>
                                    </div>

                                    {/* Awarded To */}
                                    <div className="text-center mb-6">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Awarded to</p>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white">{userName}</p>
                                        {badge.earnedDate && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {new Date(badge.earnedDate).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </div>

                                    {/* QR Code */}
                                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <QRCodeSVG
                                            value={verificationUrl}
                                            size={80}
                                            level="H"
                                            includeMargin={true}
                                            bgColor="#ffffff"
                                            fgColor="#002147"
                                        />
                                        <div className="text-left">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Verify this badge</p>
                                            <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all max-w-[200px]">
                                                {badge._id || badge.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl">
                            {/* Share Buttons */}
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4 font-medium">
                                Share your achievement
                            </p>
                            <div className="flex justify-center gap-3 mb-4">
                                <button
                                    onClick={() => handleShare('linkedin')}
                                    disabled={isSharing}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#006699] text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    <FaLinkedin className="w-4 h-4" />
                                    LinkedIn
                                </button>
                                <button
                                    onClick={() => handleShare('facebook')}
                                    disabled={isSharing}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    <FaFacebook className="w-4 h-4" />
                                    Facebook
                                </button>
                                <button
                                    onClick={() => handleShare('twitter')}
                                    disabled={isSharing}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1da1f2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    <FaTwitter className="w-4 h-4" />
                                    Twitter
                                </button>
                            </div>

                            {/* Download & Verify Buttons */}
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={handleDownloadCertificate}
                                    className="flex items-center gap-2 px-5 py-2 bg-[#002147] hover:bg-[#001a38] text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    <FaDownload className="w-4 h-4" />
                                    Download Certificate
                                </button>
                                <a
                                    href={verificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2 bg-[#30919D] hover:bg-[#287a84] text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    <FaExternalLinkAlt className="w-4 h-4" />
                                    Verify Badge
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
