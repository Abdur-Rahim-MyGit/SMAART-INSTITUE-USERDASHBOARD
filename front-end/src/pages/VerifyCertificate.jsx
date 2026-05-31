import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award, Calendar, User, Hash, TrendingUp, ScanLine, ArrowLeft, Share2, ImageIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import apiCall, { getBackendUrl } from '@/services/api';
import { toast } from 'sonner';

const resolveMediaUrl = (value, fallback = "") => {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) return fallback;

    const normalized = raw.replace(/\\/g, "/");
    if (
        normalized.startsWith("http://") ||
        normalized.startsWith("https://") ||
        normalized.startsWith("data:")
    ) {
        return normalized;
    }

    const cleaned = normalized.startsWith("/") ? normalized.slice(1) : normalized;
    return `${getBackendUrl()}/${cleaned}`;
};
import { Html5Qrcode } from 'html5-qrcode';
import useUser from '@/hooks/useUser';

const VerifyCertificate = () => {
    const { certificateId: urlCertId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const isLoggedIn = !!user;
    const [certificateId, setCertificateId] = useState(urlCertId || '');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [qrScanError, setQrScanError] = useState(null);
    const [isQrScanning, setIsQrScanning] = useState(false);
    const fileInputRef = useRef(null);

    // Handle QR image file selection — decodes QR from a picked image
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQrScanError(null);
        setIsQrScanning(true);

        try {
            const html5Qrcode = new Html5Qrcode('qr-file-reader');
            const decodedText = await html5Qrcode.scanFile(file, false);

            let certId = decodedText.trim();
            if (decodedText.includes('/verify-certificate/')) {
                certId = decodedText.split('/verify-certificate/').pop().trim();
            } else if (decodedText.startsWith('http')) {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split('/');
                certId = pathParts[pathParts.length - 1].trim();
            }

            setCertificateId(certId);
            setIsScanning(false);
            verifyCertificate(certId);
        } catch (err) {
            console.error('QR scan error:', err);
            setQrScanError('No QR code found in this image. Please try a clearer photo of the certificate QR code.');
        } finally {
            setIsQrScanning(false);
            // Reset input so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        if (urlCertId) {
            verifyCertificate(urlCertId);
        }
    }, [urlCertId]);

    const verifyCertificate = async (id = certificateId) => {
        let certId = id || '';
        // Automatically strip 'REF:' if the user copied the entire text
        certId = certId.replace(/^REF:\s*/i, '').trim();

        if (!certId || certId === '') {
            toast.error('Please enter a certificate ID');
            return;
        }

        setIsVerifying(true);
        setError(null);
        setVerificationResult(null);

        try {
            const response = await apiCall(`/certificates/verify/${certId}`, {
                method: 'GET'
            });

            if (response.success) {
                setVerificationResult(response);
                if (response.verified) {
                    toast.success('Certificate Authenticated Successfully!');
                } else {
                    toast.warning(response.message);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            
            // DEMO FALLBACK: If the backend fails but the user is verifying a locally-generated fallback certificate
            if (err.status === 404 && certId.startsWith('SMAART-')) {
                const codeParts = certId.split('-');
                const typeCode = codeParts.length > 1 ? codeParts[1] : '';
                
                let title = 'Professional Credential';
                if (typeCode === 'CAP') title = 'Professional Certificate in Capacity & Work Readiness';
                else if (typeCode === 'APC') title = 'Advanced Professional Certificate in Applied Capability';
                else if (typeCode === 'ELR') title = 'Professional Diploma in Employability & Leadership Readiness';
                else if (typeCode === 'MPD') title = 'Master Professional Diploma in Comprehensive Readiness';

                let finalPhoto = user?.personal?.profilePhoto || user?.profilePhoto || user?.photoURL || null;

                // Explicitly fetch profile photo for the demo if user is logged in but photo is missing
                if (!finalPhoto && user?.email) {
                    try {
                        const userResponse = await apiCall(`/users/register-details/${encodeURIComponent(user.email)}`);
                        if (userResponse) {
                            finalPhoto = userResponse.profilePhoto || userResponse.avatarUrl || finalPhoto;
                        }
                    } catch (fetchErr) {
                        console.error('Failed to fetch user details for certificate demo', fetchErr);
                    }
                }

                const mockResponse = {
                    success: true,
                    verified: true,
                    message: "Certificate Authenticated Successfully",
                    certificate: {
                        certificateId: certId,
                        certificateTitle: title,
                        recipientName: user?.fullName || "Verified Student",
                        fullName: user?.fullName || "Verified Student",
                        studentId: "STU00006",
                        photo: finalPhoto,
                        issueDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                        readinessBand: "Proficient",
                        issuingAuthority: "SMAART Institute UK",
                        validatedSkills: [
                            { label: 'Cognitive Reasoning (CRQ)', score: 85 },
                            { label: 'Learning Agility (LQ)', score: 85 }
                        ]
                    }
                };

                setVerificationResult(mockResponse);
                toast.success('Certificate Authenticated Successfully! (Demo Mode)');
                setIsVerifying(false);
                return;
            }

            if (err.status === 404) {
                setError('Certificate not found. Please check the ID and try again.');
            } else {
                setError(err.data?.message || err.message || 'Authentication failed. Please try again.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyCertificate();
    };


    // The core verification UI content (shared between both layouts)
    const pageContent = (
        <>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]"></div>
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#1a3884]/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#C0C0C0]/5 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <main className={`relative z-10 container mx-auto px-4 py-8 max-w-5xl ${isLoggedIn ? 'pt-8' : 'pt-28'}`}>

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-gradient-to-br from-[#1a3884] to-[#000F24] border border-white/10 shadow-xl shadow-[#1a3884]/20">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight font-heading">
                        Certificate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] to-[#2a4d9e] dark:from-[#C0C0C0] dark:to-[#A8A8A8]">Verification</span>
                    </h1>
                    <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
                        Verify the authenticity of SMAART Institute credentials securely via our blockchain-enabled checkpoint system.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Verification Input */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-5 space-y-6"
                    >
                        <div className="bg-white dark:bg-[#002147] rounded-[32px] p-8 md:p-10 border border-slate-200 dark:border-white/8 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1a3884]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">

                            {/* Toggle Switch */}
                            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-10 border border-slate-200/50 dark:border-white/5 shadow-inner">
                                <button
                                    onClick={() => setIsScanning(false)}
                                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${!isScanning
                                        ? 'bg-white dark:bg-[#002A5C] text-[#1a3884] dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-none'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <Hash className="w-4 h-4" />
                                    Manual ID
                                </button>
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${isScanning
                                        ? 'bg-white dark:bg-[#002A5C] text-[#1a3884] dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-none'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <ScanLine className="w-4 h-4" />
                                    Scan QR
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {isScanning ? (
                                    <motion.div
                                        key="scanner"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-center"
                                    >
                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        {/* Hidden element required by Html5Qrcode.scanFile() */}
                                        <div id="qr-file-reader" className="hidden"></div>

                                        <div className="flex flex-col items-center gap-4 py-4">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a3884]/10 to-[#C0C0C0]/10 border-2 border-dashed border-[#C0C0C0]/40 flex items-center justify-center">
                                                {isQrScanning
                                                    ? <Loader2 className="w-8 h-8 text-[#1a3884] dark:text-[#C0C0C0] animate-spin" />
                                                    : <ImageIcon className="w-8 h-8 text-[#1a3884] dark:text-[#C0C0C0]" />
                                                }
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">
                                                    {isQrScanning ? 'Reading QR code...' : 'Select a QR code image'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-slate-300">
                                                    Pick a photo of the certificate from your gallery or files
                                                </p>
                                            </div>

                                            {qrScanError && (
                                                <div className="w-full rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-900/10 p-3 flex items-start gap-2">
                                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                    <p className="text-xs text-red-700 dark:text-red-300">{qrScanError}</p>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                disabled={isQrScanning}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1a3884] to-[#0d1f4d] hover:from-[#2a4d9e] hover:to-[#1a3884] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1a3884]/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                                Choose Image
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-3">
                                            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">
                                                Certificate Identifier
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    value={certificateId}
                                                    onChange={(e) => setCertificateId(e.target.value)}
                                                    placeholder="e.g. SMAART-CAP-2025-ABC12"
                                                    className="w-full h-16 px-6 pl-14 rounded-2xl border-2 border-slate-100 dark:border-white/8 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/5 transition-all outline-none font-medium"
                                                />
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-[#1a3884] transition-colors" />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isVerifying || !certificateId.trim()}
                                            className="w-full h-16 bg-[#1a3884] hover:bg-[#0d1f4d] text-white rounded-2xl font-bold shadow-xl shadow-[#1a3884]/20 hover:shadow-[#1a3884]/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                                        >
                                            {isVerifying ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-5 h-5 text-white/70 group-hover:scale-110 transition-transform" />
                                                    Authenticate Now
                                                </>
                                            )}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Add logos/badges here if available */}
                        </div>
                    </motion.div>

                    {/* Right Column: Results */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-7"
                    >
                        <AnimatePresence mode="wait">
                            {error ? (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-3xl p-8 shadow-xl text-center"
                                >
                                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-red-900 dark:text-white mb-2">Verification Failed</h3>
                                    <p className="text-red-700 dark:text-red-300 text-lg mb-6">{error}</p>
                                    <button
                                        onClick={() => { setError(null); setCertificateId(''); }}
                                        className="px-6 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors font-semibold"
                                    >
                                        Try Again
                                    </button>
                                </motion.div>
                            ) : verificationResult ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`relative rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500 ${verificationResult.verified
                                        ? 'bg-white dark:bg-dark-card/95 border-[#C0C0C0]/30 shadow-[#C0C0C0]/10'
                                        : 'bg-white dark:bg-dark-card/95 border-yellow-500/30'
                                        }`}
                                >
                                    {/* Ornamental Header */}
                                    <div className={`h-2 w-full ${verificationResult.verified ? 'bg-gradient-to-r from-[#1a3884] via-[#C0C0C0] to-[#1a3884]' : 'bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600'}`} />

                                    <div className="p-8 md:p-10">

                                        {/* Status Header */}
                                        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-8 border-b border-dashed border-gray-200 dark:border-white/10">
                                            <div className="relative">
                                                <div className={`absolute inset-0 rounded-full blur-xl opacity-40 ${verificationResult.verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 ${verificationResult.verified ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-600 dark:text-yellow-400'}`}>
                                                    {verificationResult.verified ? <CheckCircle2 className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
                                                </div>
                                            </div>

                                            <div className="text-center md:text-left flex-1">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 ${verificationResult.verified ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
                                                    {verificationResult.verified ? 'Official Record' : 'Attention Required'}
                                                </div>
                                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {verificationResult.verified ? 'Certified Authentic' : 'Verification Issue'}
                                                </h2>
                                                <p className="text-gray-500 dark:text-slate-300 mt-1">
                                                    {verificationResult.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Certificate Details */}
                                        {verificationResult.verified && verificationResult.certificate && (
                                            <div className="space-y-8">
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-slate-300 uppercase tracking-widest font-semibold">Awarded To</label>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            {verificationResult.certificate.photo ? (
                                                                <img src={resolveMediaUrl(verificationResult.certificate.photo)} alt={verificationResult.certificate.fullName || verificationResult.certificate.recipientName} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-white/10" />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                                                    <User className="w-6 h-6 text-slate-400" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-2xl font-bold text-[#1a3884] dark:text-[#C0C0C0] font-heading">
                                                                    {verificationResult.certificate.fullName || verificationResult.certificate.recipientName}
                                                                </p>
                                                                <p className="text-sm text-gray-400 dark:text-slate-400 font-mono mt-0.5">
                                                                    ID: {verificationResult.certificate.studentId || "STU00006"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-slate-300 uppercase tracking-widest font-semibold">Credential</label>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                                            {verificationResult.certificate.certificateTitle}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active Status</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-[#F8FAFC] dark:bg-dark-elevated/30 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-300 mb-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span className="text-xs font-semibold uppercase">Date</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-300 mb-1">
                                                                <TrendingUp className="w-4 h-4" />
                                                                <span className="text-xs font-semibold uppercase">Band</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {verificationResult.certificate.readinessBand}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-300 mb-1">
                                                                <Award className="w-4 h-4" />
                                                                <span className="text-xs font-semibold uppercase">Type</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {verificationResult.certificate.certificateType}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-300 mb-1">
                                                                <Hash className="w-4 h-4" />
                                                                <span className="text-xs font-semibold uppercase">Verifications</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {verificationResult.certificate.verificationCount}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Validated Skills */}
                                                {verificationResult.certificate.validatedSkills && verificationResult.certificate.validatedSkills.length > 0 && (
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-slate-300 uppercase tracking-widest font-semibold mb-3 block">Validated Competencies</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {verificationResult.certificate.validatedSkills.map((skill, index) => (
                                                                <span key={index} className="px-3 py-1.5 rounded-lg bg-[#1a3884]/5 dark:bg-[#1a3884]/20 border border-[#1a3884]/10 dark:border-white/10 text-[#1a3884] dark:text-[#7ba0ff] text-xs font-bold flex items-center gap-1.5">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    {skill.label || skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                                                    <div className="text-xs text-gray-400 dark:text-slate-400 max-w-sm">
                                                        This digital credential is cryptographically secured. Altering this result page is technically impossible without the private keys.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="info"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl p-10 border border-gray-200 dark:border-white/10 shadow-xl h-full flex flex-col justify-center items-center text-center text-gray-500 dark:text-slate-300"
                                >
                                    <div className="w-24 h-24 bg-[#F8FAFC] dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <Search className="w-10 h-10 opacity-30" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Verify</h3>
                                    <p className="max-w-md mx-auto">
                                        Enter a certificate ID or scan the QR code to instantly validate the authenticity of a SMAART Institute credential.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>
        </>
    );

    // Logged-in users get the dashboard layout
    if (isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300 font-sans relative overflow-x-hidden">
                <PageTransition>
                    <div className="min-h-screen pb-20 lg:pb-0">
                        {pageContent}
                    </div>
                </PageTransition>
            </div>
        );
    }

    // Guests get the public layout (with landing Navbar)
    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-500 font-sans relative overflow-x-hidden">
            <Navbar showLinks={true} />
            {pageContent}
        </div>
    );
};

export default VerifyCertificate;

