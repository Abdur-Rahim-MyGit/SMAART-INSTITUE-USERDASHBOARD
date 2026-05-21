import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award, Lock, Zap, Shield, Hash, ScanLine, Database, QrCode, ImageIcon } from 'lucide-react';
import apiCall from '@/services/api';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

const CertificateVerification = () => {
    const [certificateId, setCertificateId] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [activeTab, setActiveTab] = useState('id'); // 'id' or 'scan'
    const [error, setError] = useState(null);
    const [isQrScanning, setIsQrScanning] = useState(false);
    const [qrScanError, setQrScanError] = useState(null);
    const fileInputRef = useRef(null);
    const scannerRef = useRef(null);

    // Handle QR image file selection
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQrScanError(null);
        setIsQrScanning(true);

        try {
            // We need a hidden element for Html5Qrcode to work with scanFile
            const html5Qrcode = new Html5Qrcode("reader-landing-hidden");
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
            verifyCertificate(certId);
        } catch (err) {
            console.error('QR scan error:', err);
            setQrScanError('No QR code found in this image. Please try a clearer photo.');
        } finally {
            setIsQrScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleScanSuccess = (decodedText, scannerInstance) => {
        try {
            let certId = decodedText;
            // Handle various URL formats if strictly needed, or just extract ID
            if (decodedText.includes('/verify-certificate/')) {
                certId = decodedText.split('/verify-certificate/').pop();
            } else if (decodedText.startsWith('http')) {
                try {
                    const url = new URL(decodedText);
                    const pathParts = url.pathname.split('/');
                    certId = pathParts[pathParts.length - 1];
                } catch (e) {
                    // fallback if URL parsing fails
                    console.warn("Could not parse URL", e);
                }
            }

            // Setup for verification
            if (scannerInstance) {
                scannerInstance.clear().catch(e => console.error("Failed to clear", e));
            }
            setActiveTab('id'); // Switch back to ID view to show result
            setCertificateId(certId);
            verifyCertificate(certId);

        } catch (e) {
            console.error("Scan Error", e);
            toast.error("Invalid QR code format");
        }
    };

    const verifyCertificate = async (certId = certificateId) => {
        if (!certId || certId.trim() === '') {
            toast.error('Please enter a certificate ID');
            return;
        }

        setIsVerifying(true);
        setError(null);
        setVerificationResult(null);

        try {
            const response = await apiCall(`/certificates/verify/${certId.trim()}`, { method: 'GET' });

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
            if (err.status === 404) {
                setError('Certificate not found. Please check the ID and try again.');
            } else {
                setError(err.data?.message || err.message || 'Authentication failed.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyCertificate();
    };

    return (
        <section id="verify-certificate" className="py-24 bg-gray-50 dark:bg-[#000F24] relative overflow-hidden transition-colors duration-500">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#1a3884]/5 dark:bg-[#1a3884]/10 rounded-none blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C0C0C0]/5 dark:bg-[#C0C0C0]/10 rounded-none blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-stretch">

                        {/* Left Column: Info & Features */}
                        <div className="lg:col-span-5 flex flex-col justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-[#1a3884]/10 dark:bg-[#C0C0C0]/10 border border-[#1a3884]/20 dark:border-[#C0C0C0]/20 text-[#1a3884] dark:text-[#C0C0C0] text-xs font-bold uppercase tracking-widest mb-8">
                                    Official Records
                                </div>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#002147] dark:text-white mb-6 font-heading leading-tight tracking-tight">
                                    Certificate <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] via-[#2a4d9e] to-[#C0C0C0] dark:from-blue-300 dark:via-blue-100 dark:to-yellow-300">
                                        Verification
                                    </span>
                                </h2>
                                <p className="text-gray-600 dark:text-slate-200 text-base mb-10 leading-relaxed max-w-md font-light">
                                    Verify the authenticity of SMAART Institute credentials instantly. Our secure blockchain-backed verification system ensures trust and credibility.
                                </p>

                                <div className="space-y-6">
                                    {[
                                        { icon: Shield, title: "Tamper Proof", info: "Blockchain Secured", sub: "Immutable verification records" },
                                        { icon: Zap, title: "Instant Check", info: "Real-time Validation", sub: "Verify in seconds" },
                                        { icon: Database, title: "Global Access", info: "Centralized Registry", sub: "Access anywhere, anytime" }
                                    ].map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 + idx * 0.1 }}
                                            className="flex items-center gap-5 p-4 rounded-none bg-white dark:bg-[#001835]/80 border border-gray-100 dark:border-white/10 hover:border-[#C0C0C0]/50 dark:hover:border-[#C0C0C0]/50 shadow-sm transition-all duration-300 group backdrop-blur-sm"
                                        >
                                            <div className="w-12 h-12 rounded-none bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center group-hover:bg-[#1a3884] dark:group-hover:bg-[#C0C0C0] group-hover:text-white dark:group-hover:text-[#002147] transition-all duration-300 shadow-inner">
                                                <item.icon className="w-5 h-5 text-[#1a3884] dark:text-[#C0C0C0] group-hover:text-white dark:group-hover:text-[#002147] transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="text-gray-400 dark:text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-0.5">{item.title}</h4>
                                                <p className="text-[#002147] dark:text-white font-bold text-base leading-none mb-0.5">{item.info}</p>
                                                <p className="text-gray-500 dark:text-slate-300 text-[11px] font-light tracking-wide">{item.sub}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column: Verification Card */}
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="h-full"
                            >
                                <div className="bg-white dark:bg-[#001835]/90 border border-gray-100 dark:border-white/10 rounded-none p-1 shadow-2xl relative overflow-hidden h-full flex flex-col backdrop-blur-xl group">

                                    {/* Inner Container */}
                                    <div className="bg-white/50 dark:bg-dark-bg/50 rounded-none flex flex-col h-full overflow-hidden relative border border-gray-50 dark:border-white/5">

                                        {/* Top Decoration */}
                                        <div className="h-32 bg-gradient-to-r from-[#1a3884] to-[#0d1f4d] relative overflow-hidden flex-shrink-0">
                                            <div className="absolute inset-0 bg-[#C0C0C0]/10 pattern-dots" />
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C0C0C0]/20 rounded-none blur-3xl" />
                                            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-none blur-xl" />

                                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white dark:from-[#001835] to-transparent opacity-20" />

                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white pb-4">
                                                <ShieldCheck className="w-10 h-10 mb-2 text-[#C0C0C0]" />
                                                <h3 className="text-xl text-white font-bold font-heading tracking-wide">Credential Check</h3>
                                            </div>
                                        </div>

                                        <div className="px-6 md:px-10 pb-10 pt-6 flex-grow flex flex-col -mt-6">
                                            {/* Tab Switcher */}
                                            <div className="flex mt-10 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-10 border border-slate-200/50 dark:border-white/5 shadow-inner max-w-sm mx-auto relative z-10 w-full">
                                                <button
                                                    onClick={() => { setActiveTab('id'); setVerificationResult(null); setError(null); }}
                                                    className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 ${activeTab === 'id'
                                                        ? 'bg-white dark:bg-[#002A5C] text-[#1a3884] dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-none'
                                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                                >
                                                    <Hash className="w-3.5 h-3.5" />
                                                    Manual ID
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('scan'); setVerificationResult(null); setError(null); }}
                                                    className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 ${activeTab === 'scan'
                                                        ? 'bg-white dark:bg-[#002A5C] text-[#1a3884] dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-none'
                                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                                >
                                                    <QrCode className="w-3.5 h-3.5" />
                                                    Scan QR
                                                </button>
                                            </div>

                                            <div className="flex-grow flex flex-col justify-center">
                                                <AnimatePresence mode="wait">
                                                    {activeTab === 'scan' ? (
                                                        <motion.div
                                                            key="scanner"
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="w-full text-center py-6"
                                                        >
                                                            {/* Hidden elements for scanner */}
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={handleFileSelect}
                                                            />
                                                            <div id="reader-landing-hidden" className="hidden"></div>

                                                            <div className="flex flex-col items-center gap-6">
                                                                <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-[#002147] border-2 border-dashed border-slate-200 dark:border-white/8 flex items-center justify-center group-hover:border-[#1a3884] transition-colors">
                                                                    {isQrScanning ? (
                                                                        <Loader2 className="w-10 h-10 text-[#1a3884] animate-spin" />
                                                                    ) : (
                                                                        <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                                                    )}
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">Select a QR code image</h4>
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto">
                                                                        Pick a photo of the certificate from your gallery or files
                                                                    </p>
                                                                </div>

                                                                {qrScanError && (
                                                                    <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                                                                        {qrScanError}
                                                                    </div>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    disabled={isQrScanning}
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="w-full max-w-sm h-14 bg-[#1a3884] hover:bg-[#0d1f4d] text-white rounded-2xl font-bold shadow-xl shadow-[#1a3884]/20 hover:shadow-[#1a3884]/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                                                                >
                                                                    <ImageIcon className="w-5 h-5 text-white/70" />
                                                                    Choose Image
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.form
                                                            key="form"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            onSubmit={handleSubmit}
                                                            className="space-y-6 w-full max-w-sm mx-auto"
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
                                                                        className="w-full h-16 px-6 pl-14 rounded-2xl border-2 border-slate-100 dark:border-white/8 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/5 transition-all outline-none font-medium"
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
                                                                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
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

                                                {/* Verification Results Overlay */}
                                                <AnimatePresence>
                                                    {(verificationResult || error) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 50 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 50 }}
                                                            className="absolute inset-0 bg-white dark:bg-[#001835] z-50 flex flex-col p-6 rounded-none"
                                                        >
                                                            <button
                                                                onClick={() => { setVerificationResult(null); setError(null); }}
                                                                className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-white/10 rounded-none hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                                            >
                                                                <XCircle className="w-5 h-5 text-gray-500" />
                                                            </button>

                                                            <div className="flex-grow flex flex-col items-center justify-center text-center">
                                                                {error ? (
                                                                    <div className="space-y-4">
                                                                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-none flex items-center justify-center mx-auto mb-4">
                                                                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                                                                        </div>
                                                                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Verification Failed</h3>
                                                                        <p className="text-gray-600 dark:text-slate-200">{error}</p>
                                                                        <button
                                                                            onClick={() => { setVerificationResult(null); setError(null); }}
                                                                            className="mt-4 px-6 py-2 bg-gray-100 dark:bg-white/10 rounded-none text-sm font-bold"
                                                                        >
                                                                            Try Again
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full space-y-6">
                                                                        <div className={`w-20 h-20 rounded-none flex items-center justify-center mx-auto shadow-lg ${verificationResult.verified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                                            {verificationResult.verified ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                                                                        </div>

                                                                        <div>
                                                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                                                {verificationResult.verified ? 'Valid Certificate' : 'Issue Detected'}
                                                                            </h3>
                                                                            <p className="text-sm text-gray-500 dark:text-slate-300">
                                                                                {verificationResult.message}
                                                                            </p>
                                                                        </div>

                                                                        {verificationResult.verified && verificationResult.certificate && (
                                                                            <div className="bg-gray-50 dark:bg-[#000F24] p-6 rounded-none border border-gray-100 dark:border-white/5 text-left space-y-4 shadow-inner">
                                                                                <div>
                                                                                    <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Recipient</label>
                                                                                    <p className="text-lg font-bold text-[#1a3884] dark:text-[#C0C0C0]">{verificationResult.certificate.fullName}</p>
                                                                                </div>
                                                                                <div className="h-px bg-gray-200 dark:bg-white/10" />
                                                                                <div>
                                                                                    <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Credential</label>
                                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{verificationResult.certificate.certificateTitle}</p>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                    <div>
                                                                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Issued</label>
                                                                                        <p className="text-sm font-mono text-gray-700 dark:text-slate-200">{new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Band</label>
                                                                                        <p className="text-sm font-mono text-gray-700 dark:text-slate-200">{verificationResult.certificate.readinessBand}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CertificateVerification;

