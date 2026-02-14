import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award, Calendar, User, Hash, TrendingUp, ScanLine, ArrowLeft, Download, Share2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import apiCall from '@/services/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

const VerifyCertificate = () => {
    const { certificateId: urlCertId } = useParams();
    const navigate = useNavigate();
    const [certificateId, setCertificateId] = useState(urlCertId || '');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let scanner = null;
        if (isScanning) {
            scanner = new Html5QrcodeScanner('reader-page', {
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
                // Ignore errors during scan
            });
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error("Error clearing scanner", err));
            }
        };
    }, [isScanning]);

    useEffect(() => {
        if (urlCertId) {
            verifyCertificate(urlCertId);
        }
    }, [urlCertId]);

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
                    toast.success('Certificate Authenticated Successfully!');
                } else {
                    toast.warning(response.message);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            if (err.response?.status === 404) {
                setError('Certificate not found. Please check the ID and try again.');
            } else {
                setError(err.response?.data?.message || 'Authentication failed. Please try again.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyCertificate();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#000F24] transition-colors duration-500 font-sans relative overflow-x-hidden">
            <Navbar showLinks={true} />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]"></div>
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#1a3884]/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#daa520]/5 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <main className="relative z-10 container mx-auto px-4 py-8 pt-28 max-w-5xl">

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
                        Certificate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] to-[#2a4d9e] dark:from-[#daa520] dark:to-[#f0e68c]">Verification</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
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
                        <div className="bg-white dark:bg-[#001835]/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">

                            {/* Toggle Switch */}
                            <div className="flex bg-gray-100 dark:bg-[#000F24] p-1.5 rounded-xl mb-8 border border-gray-200 dark:border-white/5">
                                <button
                                    onClick={() => setIsScanning(false)}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${!isScanning
                                        ? 'bg-white dark:bg-[#1a3884] text-[#1a3884] dark:text-white shadow-md'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <Hash className="w-4 h-4" />
                                    Manual ID
                                </button>
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isScanning
                                        ? 'bg-white dark:bg-[#1a3884] text-[#1a3884] dark:text-white shadow-md'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
                                        <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-[#daa520]/50 bg-black/5 dark:bg-black/40 h-72 w-full shadow-inner mb-4">
                                            <div id="reader-page" className="w-full h-full"></div>
                                            {/* Scanning Overlay */}
                                            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10 dark:border-[#000F24]/50 z-10"></div>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                                            Position QR code within frame
                                        </p>
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
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                                Certificate Identifier
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-[#daa520]/20 to-[#1a3884]/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    value={certificateId}
                                                    onChange={(e) => setCertificateId(e.target.value)}
                                                    placeholder="e.g. SMAART-CAP-2025-ABC12"
                                                    className="relative w-full px-5 py-4 pl-12 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#daa520] focus:border-transparent transition-all font-mono shadow-inner"
                                                />
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isVerifying || !certificateId.trim()}
                                            className="w-full bg-gradient-to-r from-[#1a3884] to-[#0d1f4d] hover:from-[#2a4d9e] hover:to-[#1a3884] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#1a3884]/30 hover:shadow-[#1a3884]/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group border border-white/5"
                                        >
                                            {isVerifying ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin text-[#daa520]" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-5 h-5 text-[#daa520] group-hover:scale-110 transition-transform" />
                                                    Authenticate Now
                                                </>
                                            )}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
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
                                        className="px-6 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-semibold"
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
                                            ? 'bg-white dark:bg-[#001835]/90 border-[#daa520]/30 shadow-[#daa520]/10'
                                            : 'bg-white dark:bg-[#001835]/90 border-yellow-500/30'
                                        }`}
                                >
                                    {/* Ornamental Header */}
                                    <div className={`h-2 w-full ${verificationResult.verified ? 'bg-gradient-to-r from-[#1a3884] via-[#daa520] to-[#1a3884]' : 'bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600'}`} />

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
                                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                                    {verificationResult.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Certificate Details */}
                                        {verificationResult.verified && verificationResult.certificate && (
                                            <div className="space-y-8">
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Awarded To</label>
                                                        <p className="text-2xl font-bold text-[#1a3884] dark:text-[#daa520] mt-1 font-heading">
                                                            {verificationResult.certificate.fullName}
                                                        </p>
                                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-mono">
                                                            ID: {verificationResult.certificate.studentId}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">Credential</label>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                                            {verificationResult.certificate.certificateTitle}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active Status</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 dark:bg-[#000F24]/50 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span className="text-xs font-semibold uppercase">Date</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                                                <TrendingUp className="w-4 h-4" />
                                                                <span className="text-xs font-semibold uppercase">Band</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {verificationResult.certificate.readinessBand}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                                                <Award className="w-4 h-4" />
                                                                <span className="text-xs font-semibold uppercase">Type</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {verificationResult.certificate.certificateType}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
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
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold mb-3 block">Validated Competencies</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {verificationResult.certificate.validatedSkills.map((skill, index) => (
                                                                <span key={index} className="px-3 py-1.5 rounded-lg bg-[#1a3884]/5 dark:bg-[#1a3884]/20 border border-[#1a3884]/10 dark:border-[#1a3884]/30 text-[#1a3884] dark:text-[#7ba0ff] text-xs font-bold flex items-center gap-1.5">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    {skill.label || skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-6 border-t border-gray-100 dark:border-white/10 flex flex-wrap justify-between gap-4">
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 max-w-sm">
                                                        This digital credential is cryptographically secured. Altering this result page is technically impossible without the private keys.
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors">
                                                            <Download className="w-4 h-4" /> Print Record
                                                        </button>
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
                                    className="bg-white dark:bg-[#001835]/80 backdrop-blur-xl rounded-3xl p-10 border border-gray-200 dark:border-white/10 shadow-xl h-full flex flex-col justify-center items-center text-center text-gray-500 dark:text-gray-400"
                                >
                                    <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
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
        </div>
    );
};

export default VerifyCertificate;
