import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award, Calendar, User, Hash, TrendingUp, QrCode } from 'lucide-react';
import apiCall from '@/services/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

const CertificateVerification = () => {
    const [certificateId, setCertificateId] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let scanner = null;
        if (isScanning) {
            scanner = new Html5QrcodeScanner('reader-landing', {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            });

            scanner.render((decodedText) => {
                try {
                    let certId = decodedText;
                    if (decodedText.includes('/verify-certificate/')) {
                        certId = decodedText.split('/verify-certificate/').pop();
                    } else if (decodedText.startsWith('http')) {
                        const url = new URL(decodedText);
                        const pathParts = url.pathname.split('/');
                        certId = pathParts[pathParts.length - 1];
                    }
                    
                    setCertificateId(certId);
                    setIsScanning(false);
                    scanner.clear();
                    verifyCertificate(certId);
                } catch (e) {
                    toast.error("Invalid QR code format");
                }
            }, (error) => {
                // Ignore scan errors
            });
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error("Error clearing scanner", err));
            }
        };
    }, [isScanning]);

    const verifyCertificate = async (certId = certificateId) => {
        if (!certId || certId.trim() === '') {
            toast.error('Please enter a certificate ID');
            return;
        }

        setIsVerifying(true);
        setError(null);
        setVerificationResult(null);

        try {
            const response = await apiCall(`/certificates/verify/${certId.trim()}`, {
                method: 'GET'
            });

            if (response.success) {
                setVerificationResult(response);
                if (response.verified) {
                    toast.success('Certificate verified successfully!');
                } else {
                    toast.warning(response.message);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            if (err.response?.status === 404) {
                setError('Certificate not found. Please check the certificate ID and try again.');
            } else {
                setError(err.response?.data?.message || 'Failed to verify certificate. Please try again.');
            }
            toast.error('Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyCertificate();
    };

    return (
        <section id="verify-certificate" className="py-20 sm:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-[#001229] dark:to-[#002147] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#30919D]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#daa520]/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#daa520] to-[#b8860b] mb-6 shadow-lg shadow-amber-500/20">
                        <ShieldCheck className="w-8 h-8 text-[#002147]" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Verify Certificate
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Instantly verify the authenticity of SMAART Institute certificates
                    </p>
                </motion.div>

                {/* Verification Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-white dark:bg-[#002147]/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl">
                        {/* Mode Toggle */}
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => { setIsScanning(false); setVerificationResult(null); setError(null); }}
                                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${!isScanning
                                    ? 'bg-[#002147] dark:bg-[#30919D] text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <Hash className="w-4 h-4 inline mr-2" />
                                Manual Entry
                            </button>
                            <button
                                onClick={() => { setIsScanning(true); setVerificationResult(null); setError(null); }}
                                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isScanning
                                    ? 'bg-[#002147] dark:bg-[#30919D] text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <QrCode className="w-4 h-4 inline mr-2" />
                                Scan QR Code
                            </button>
                        </div>

                        {/* QR Scanner */}
                        {isScanning && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                <div id="reader-landing" className="mx-auto rounded-xl overflow-hidden border-2 border-dashed border-[#30919D]/30"></div>
                                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
                                    Position the certificate's QR code within the square
                                </p>
                            </motion.div>
                        )}

                        {/* Manual Entry Form */}
                        {!isScanning && (
                            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={certificateId}
                                        onChange={(e) => setCertificateId(e.target.value)}
                                        placeholder="e.g., SMAART-CAP-2025-ABC12"
                                        className="w-full px-5 py-4 pl-12 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#30919D] focus:border-transparent transition-all text-base"
                                    />
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isVerifying || !certificateId.trim()}
                                    className="w-full bg-gradient-to-r from-[#002147] to-[#30919D] hover:from-[#30919D] hover:to-[#002147] text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                                >
                                    {isVerifying ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            Verify Certificate
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 mb-6"
                                >
                                    <div className="flex items-start gap-3">
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">Verification Failed</h4>
                                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Verification Result */}
                        <AnimatePresence>
                            {verificationResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className={`rounded-xl border p-6 ${verificationResult.verified
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30'
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30'
                                    }`}
                                >
                                    {/* Status Header */}
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-green-200 dark:border-green-500/30">
                                        {verificationResult.verified ? (
                                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-7 h-7 text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                                                <AlertTriangle className="w-7 h-7 text-white" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className={`text-xl font-bold ${verificationResult.verified ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                                                {verificationResult.verified ? 'Certificate Verified' : 'Certificate Invalid'}
                                            </h3>
                                            <p className={`text-sm ${verificationResult.verified ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                                {verificationResult.message}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Certificate Details */}
                                    {verificationResult.verified && verificationResult.certificate && (
                                        <div className="space-y-4">
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-green-200 dark:border-green-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Recipient</span>
                                                    </div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{verificationResult.certificate.fullName}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">ID: {verificationResult.certificate.studentId}</p>
                                                </div>

                                                <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-green-200 dark:border-green-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Certificate Type</span>
                                                    </div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{verificationResult.certificate.certificateTitle}</p>
                                                </div>

                                                <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-green-200 dark:border-green-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Issue Date</span>
                                                    </div>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {new Date(verificationResult.certificate.issueDate).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>

                                                <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-green-200 dark:border-green-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Readiness Band</span>
                                                    </div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{verificationResult.certificate.readinessBand}</p>
                                                </div>
                                            </div>

                                            {/* Validated Skills */}
                                            {verificationResult.certificate.validatedSkills && verificationResult.certificate.validatedSkills.length > 0 && (
                                                <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-green-200 dark:border-green-500/20">
                                                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Validated Skills</h4>
                                                    <div className="grid sm:grid-cols-2 gap-2">
                                                        {verificationResult.certificate.validatedSkills.map((skill, index) => (
                                                            <div key={index} className="flex items-center gap-2 text-sm">
                                                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                                                                <span className="text-gray-900 dark:text-white">{skill.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CertificateVerification;
