import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award, Lock, Zap, Shield, Hash, ScanLine, Database, QrCode } from 'lucide-react';
import apiCall from '@/services/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

const CertificateVerification = () => {
    const [certificateId, setCertificateId] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [activeTab, setActiveTab] = useState('id'); // 'id' or 'scan'
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);

    // Handle QR Scanner Lifecycle
    useEffect(() => {
        let scanner = null;

        if (activeTab === 'scan') {
            // Include a small delay to ensure the DOM element is mounted by AnimatePresence
            const timer = setTimeout(() => {
                const element = document.getElementById('reader-landing');
                if (element) {
                    try {
                        scanner = new Html5QrcodeScanner('reader-landing', {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                            showTorchButtonIfSupported: true
                        }, false); // verbose=false

                        scanner.render((decodedText) => {
                            handleScanSuccess(decodedText, scanner);
                        }, (error) => {
                            // Ignore scan errors as they happen frequently when no QR is in view
                        });

                        scannerRef.current = scanner;
                    } catch (err) {
                        console.error("Failed to initialize scanner", err);
                        toast.error("Could not start camera. Please ensure permissions are granted.");
                        setActiveTab('id');
                    }
                }
            }, 300); // 300ms delay for animation
            return () => clearTimeout(timer);
        }

        return () => {
            // Cleanup function
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(e => console.error("Error clearing scanner", e));
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
                scannerRef.current = null;
            }
        };
    }, [activeTab]);

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
                                <p className="text-gray-600 dark:text-gray-300 text-base mb-10 leading-relaxed max-w-md font-light">
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
                                                <h4 className="text-gray-400 dark:text-gray-500 font-bold text-[9px] uppercase tracking-widest mb-0.5">{item.title}</h4>
                                                <p className="text-[#002147] dark:text-white font-bold text-base leading-none mb-0.5">{item.info}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-[11px] font-light tracking-wide">{item.sub}</p>
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
                                    <div className="bg-white/50 dark:bg-[#001229]/50 rounded-none flex flex-col h-full overflow-hidden relative border border-gray-50 dark:border-white/5">

                                        {/* Top Decoration */}
                                        <div className="h-32 bg-gradient-to-r from-[#1a3884] to-[#0d1f4d] relative overflow-hidden flex-shrink-0">
                                            <div className="absolute inset-0 bg-[#C0C0C0]/10 pattern-dots" />
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C0C0C0]/20 rounded-none blur-3xl" />
                                            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-none blur-xl" />

                                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white dark:from-[#001835] to-transparent opacity-20" />

                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white pb-4">
                                                <ShieldCheck className="w-10 h-10 mb-2 text-[#C0C0C0]" />
                                                <h3 className="text-xl font-bold font-heading tracking-wide">Credential Check</h3>
                                            </div>
                                        </div>

                                        <div className="px-6 md:px-10 pb-10 pt-6 flex-grow flex flex-col -mt-6">
                                            {/* Tab Switcher */}
                                            <div className="bg-white dark:bg-[#000F24] p-1 rounded-none shadow-lg border border-gray-100 dark:border-white/10 flex mb-8 mx-auto relative z-10 max-w-sm w-full">
                                                <button
                                                    onClick={() => { setActiveTab('id'); setVerificationResult(null); setError(null); }}
                                                    className={`flex-1 py-3 px-4 rounded-none text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'id'
                                                        ? 'bg-[#1a3884] text-white shadow-md'
                                                        : 'text-gray-500 hover:text-[#1a3884] dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                >
                                                    <Hash className="w-3.5 h-3.5" />
                                                    ByID
                                                </button>
                                                <button
                                                    onClick={() => { setActiveTab('scan'); setVerificationResult(null); setError(null); }}
                                                    className={`flex-1 py-3 px-4 rounded-none text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'scan'
                                                        ? 'bg-[#C0C0C0] text-[#002147] shadow-md'
                                                        : 'text-gray-500 hover:text-[#1a3884] dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
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
                                                            className="w-full relative py-4"
                                                        >
                                                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">Point your camera at the certificate QR code</p>
                                                            <div className="rounded-none overflow-hidden border-2 border-[#C0C0C0] bg-black relative aspect-square max-w-[300px] mx-auto shadow-2xl">
                                                                <div id="reader-landing" className="w-full h-full" />
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
                                                            <div className="text-center mb-2">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Enter the unique Certificate ID</p>
                                                            </div>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={certificateId}
                                                                    onChange={(e) => setCertificateId(e.target.value)}
                                                                    placeholder="e.g. SMAART-202X-XXXX"
                                                                    className="w-full h-14 px-4 text-center text-lg font-mono font-bold bg-gray-50 dark:bg-[#000F24] border-2 border-gray-200 dark:border-white/10 rounded-none focus:border-[#C0C0C0] focus:ring-0 transition-colors text-[#1a3884] dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                                                />
                                                            </div>

                                                            <button
                                                                type="submit"
                                                                disabled={isVerifying || !certificateId.trim()}
                                                                className="w-full bg-[#1a3884] hover:bg-[#0d1f4d] text-white h-14 rounded-none font-bold shadow-lg shadow-[#1a3884]/20 hover:shadow-[#1a3884]/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                                                            >
                                                                {isVerifying ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin text-[#C0C0C0]" />
                                                                ) : (
                                                                    <>
                                                                        Verify Now
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
                                                                        <p className="text-gray-600 dark:text-gray-300">{error}</p>
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
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                                                                                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Band</label>
                                                                                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{verificationResult.certificate.readinessBand}</p>
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

