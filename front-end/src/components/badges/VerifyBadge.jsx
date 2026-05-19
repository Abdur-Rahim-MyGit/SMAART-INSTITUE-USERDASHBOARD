import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaStar, FaCheckCircle, FaTimesCircle, FaLinkedin, FaFacebook, FaTwitter, FaDownload, FaTrophy, FaMedal, FaCrown } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import apiCall from '@/services/api';
import useUser from '@/hooks/useUser';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageTransition from '@/components/PageTransition';
import Navbar from '@/components/Navbar';

const tierConfig = {
    bronze: {
        gradient: 'from-amber-600 via-amber-500 to-yellow-600',
        bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
        textColor: 'text-amber-700 dark:text-amber-400',
        borderColor: 'border-amber-400',
        stars: 1,
        icon: FaMedal,
    },
    silver: {
        gradient: 'from-slate-400 via-gray-300 to-slate-500',
        bgGradient: 'from-slate-50 to-gray-100 dark:from-slate-900/40 dark:to-gray-900/40',
        textColor: 'text-slate-600 dark:text-slate-300',
        borderColor: 'border-slate-400',
        stars: 2,
        icon: FaTrophy,
    },
    gold: {
        gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
        bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        borderColor: 'border-yellow-400',
        stars: 3,
        icon: FaCrown,
    },
};

// Real function to verify badge using the backend API
const verifyBadgeApi = async (badgeId) => {
    try {
        const response = await apiCall(`/users/verify-badge/${badgeId}`, {
            method: 'GET'
        });

        if (response.success) {
            return {
                ...response.badge,
                earnedBy: response.owner.fullName,
                issuedBy: response.issuedBy,
                isValid: true
            };
        }
        return null;
    } catch (error) {
        console.error('API Verification error:', error);
        return null;
    }
};

const VerifyBadge = () => {
    const { badgeId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const isLoggedIn = !!user;

    const [badge, setBadge] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [manualId, setManualId] = useState('');

    useEffect(() => {
        if (badgeId) {
            handleVerification(badgeId);
        } else {
            setIsLoading(false);
        }
    }, [badgeId]);

    const handleVerification = async (id) => {
        setIsLoading(true);
        try {
            const result = await verifyBadgeApi(id);
            if (result) {
                setBadge(result);
                setIsValid(true);
            } else {
                setBadge(null);
                setIsValid(false);
            }
        } catch (error) {
            console.error('Verification error:', error);
            setIsValid(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualVerify = (e) => {
        e.preventDefault();
        if (manualId.trim()) {
            handleVerification(manualId.trim());
        }
    };

    const handleDownloadCertificate = async () => {
        const toastId = toast.loading('Generating verification certificate...');

        try {
            const element = document.getElementById('verification-certificate');
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
            pdf.save(`Badge_Verification_${badge.id}.pdf`);

            toast.success('Verification certificate downloaded!', { id: toastId });
        } catch (error) {
            console.error('Error generating certificate:', error);
            toast.error('Failed to generate certificate', { id: toastId });
        }
    };

    const handleShare = (platform) => {
        const shareText = `✅ Verified Badge: "${badge?.title}" earned by ${badge?.earnedBy} at SMAART Institute`;
        const shareUrl = window.location.href;

        const shareUrls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    };

    const tier = badge ? tierConfig[badge.tier] || tierConfig.bronze : tierConfig.bronze;
    const TierIcon = tier.icon;

    const pageContent = (
        <main className={`w-full py-12 px-4 md:px-6 flex flex-col items-center ${isLoggedIn ? '' : 'pt-28'}`}>
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1a3884] to-[#287a84] flex items-center justify-center shadow-lg">
                        <FaShieldAlt className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#002147] dark:text-white mb-2">
                        Badge Verification
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Verify the authenticity of SMAART Institute badges
                    </p>
                </div>

                {/* Manual Verification Form */}
                {!badgeId && !badge && (
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleManualVerify}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-8"
                    >
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Enter Badge ID
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                placeholder="e.g., BADGE-CRQ-2026-001"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#1a3884] focus:border-transparent outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!manualId.trim() || isLoading}
                                className="px-6 py-3 bg-[#002147] hover:bg-[#001a38] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                            >
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* Loading State */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#1a3884] border-t-transparent animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400">Verifying badge...</p>
                    </motion.div>
                )}

                {/* Invalid Badge */}
                {!isLoading && !isValid && badgeId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <FaTimesCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                            Badge Not Found
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            The badge ID "{badgeId}" could not be verified. It may be invalid or expired.
                        </p>
                        <button
                            onClick={() => navigate('/verify-badge')}
                            className="px-6 py-3 bg-[#002147] hover:bg-[#001a38] text-white rounded-xl font-medium transition-colors"
                        >
                            Try Another ID
                        </button>
                    </motion.div>
                )}

                {/* Valid Badge - Certificate Style */}
                {!isLoading && isValid && badge && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Verification Success Banner */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3">
                            <FaCheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                            <div>
                                <p className="font-semibold text-green-800 dark:text-green-300">
                                    ✓ Verified Authentic
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    This badge is a valid SMAART Institute credential
                                </p>
                            </div>
                        </div>

                        {/* Certificate */}
                        <div
                            id="verification-certificate"
                            className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-200"
                        >
                            {/* Header */}
                            <div className={`bg-gradient-to-r ${tier.gradient} p-6 text-center`}>
                                <p className="text-white/80 text-sm font-medium tracking-wider uppercase mb-1">
                                    SMAART Institute
                                </p>
                                <h2 className="text-2xl font-bold text-white">
                                    Badge Verification Certificate
                                </h2>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <div className="flex flex-col items-center">
                                    {/* Badge Icon */}
                                    <div className={`
                                        relative w-28 h-28 flex items-center justify-center
                                        bg-gradient-to-br ${tier.gradient}
                                        rounded-full shadow-xl mb-6
                                    `}>
                                        <FaShieldAlt className="w-16 h-16 text-white drop-shadow-lg" />
                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                                            <TierIcon className={`w-5 h-5 ${tier.textColor}`} />
                                        </div>
                                    </div>

                                    {/* Stars */}
                                    <div className="flex gap-1.5 mb-4">
                                        {[...Array(3)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={`w-5 h-5 ${i < tier.stars
                                                        ? tier.textColor
                                                        : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Badge Title */}
                                    <h3 className={`text-2xl font-bold ${tier.textColor} text-center mb-2`}>
                                        {badge.title}
                                    </h3>

                                    {/* Tier */}
                                    <span className={`
                                        px-4 py-1 rounded-full text-sm font-bold uppercase
                                        bg-gradient-to-r ${tier.gradient} text-white
                                        shadow-md mb-4
                                    `}>
                                        {badge.tier} Tier
                                    </span>

                                    {/* Description */}
                                    <p className="text-slate-600 text-center max-w-md mb-6">
                                        {badge.description}
                                    </p>

                                    {/* Details Grid */}
                                    <div className="w-full max-w-md space-y-3 mb-6">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Earned By</span>
                                            <span className="font-semibold text-slate-800">{badge.earnedBy}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Date Earned</span>
                                            <span className="font-semibold text-slate-800">
                                                {new Date(badge.earnedDate).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">XP Awarded</span>
                                            <span className="font-semibold text-slate-800">+{badge.xp} XP</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Percentile</span>
                                            <span className="font-semibold text-slate-800">Top {badge.percentile}%</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500">Issued By</span>
                                            <span className="font-semibold text-slate-800">{badge.issuedBy}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-slate-500">Badge ID</span>
                                            <span className="font-mono text-xs text-slate-600">{badge.id}</span>
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                        <QRCodeSVG
                                            value={window.location.href}
                                            size={80}
                                            level="H"
                                            includeMargin={true}
                                            bgColor="#f8fafc"
                                            fgColor="#002147"
                                        />
                                        <div className="text-left">
                                            <p className="text-xs text-slate-500 mb-1">Scan to verify</p>
                                            <p className="text-xs font-mono text-slate-600 break-all max-w-[180px]">
                                                {window.location.href}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
                                <p className="text-xs text-slate-500 text-center">
                                    This certificate verifies the authenticity of the above badge credential.
                                    Issued by SMAART Institute © {new Date().getFullYear()}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center gap-3">
                            <button
                                onClick={handleDownloadCertificate}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#002147] hover:bg-[#001a38] text-white rounded-xl font-medium transition-colors"
                            >
                                <FaDownload className="w-4 h-4" />
                                Download PDF
                            </button>
                            <button
                                onClick={() => handleShare('linkedin')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#0077b5] hover:bg-[#006699] text-white rounded-xl font-medium transition-colors"
                            >
                                <FaLinkedin className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleShare('facebook')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl font-medium transition-colors"
                            >
                                <FaFacebook className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleShare('twitter')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1da1f2] hover:bg-[#1a8cd8] text-white rounded-xl font-medium transition-colors"
                            >
                                <FaTwitter className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );

    // Logged-in users get the dashboard layout
    if (isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#e8ecef] dark:bg-dark-bg transition-colors duration-300">
                <DashboardSidebar />
                <PageTransition>
                    <div className="min-h-screen pb-20 lg:pb-0">
                        {pageContent}
                    </div>
                </PageTransition>
            </div>
        );
    }

    // Guests get the public Navbar layout
    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-dark-bg transition-colors duration-300">
            <Navbar showLinks={true} />
            {pageContent}
        </div>
    );
};

export default VerifyBadge;

