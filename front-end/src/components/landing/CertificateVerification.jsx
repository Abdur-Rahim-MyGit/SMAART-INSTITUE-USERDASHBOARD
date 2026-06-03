import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Shield, Hash, Database, Zap, ImageIcon, QrCode } from 'lucide-react';
import apiCall from '@/services/api';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from "react-i18next";

const CertificateVerification = ({ isDashboard = false }) => {
    const { t } = useTranslation();
    const [certificateId, setCertificateId] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [activeTab, setActiveTab] = useState('id'); // 'id' or 'scan'
    const [error, setError] = useState(null);
    const [isQrScanning, setIsQrScanning] = useState(false);
    const [qrScanError, setQrScanError] = useState(null);
    const fileInputRef = useRef(null);

    // Handle QR image file selection
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQrScanError(null);
        setIsQrScanning(true);

        try {
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
            setQrScanError(t("landing.verify.qr_error") || 'No QR code found in this image. Please try a clearer photo.');
        } finally {
            setIsQrScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const verifyCertificate = async (certId = certificateId) => {
        if (!certId || certId.trim() === '') {
            toast.error(t("landing.verify.toast_enter_id") || 'Please enter a certificate ID');
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
                    toast.success(t("landing.verify.toast_success") || 'Certificate Authenticated Successfully!');
                } else {
                    toast.warning(response.message);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            if (err.status === 404) {
                setError(t("landing.verify.error_not_found") || 'Certificate not found. Please check the ID and try again.');
            } else {
                setError(err.data?.message || err.message || t("landing.verify.error_failed") || 'Authentication failed.');
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
        <section id="verify-certificate" className={`${isDashboard ? 'py-4' : 'py-16'} relative overflow-hidden transition-colors duration-500`}>
            {/* Background decoration (only visible heavily on landing page) */}
            {!isDashboard && (
                <>
                    <div className="absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-[#1a3884]/5 blur-[120px] pointer-events-none dark:bg-[#1a3884]/10" />
                    <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-400/5 blur-[100px] pointer-events-none dark:bg-blue-400/10" />
                </>
            )}

            <div className={`mx-auto px-4 relative z-10 ${isDashboard ? 'max-w-full' : 'container sm:px-10 md:px-16 lg:px-24'}`}>
                <div className="mx-auto max-w-7xl">
                    <div className={`grid items-stretch gap-8 lg:grid-cols-12 ${isDashboard ? 'lg:gap-10' : 'lg:gap-16'}`}>

                        {/* Left Column: Info & Features */}
                        <div className="flex flex-col justify-center lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1a3884]/15 bg-[#eef4ff] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3884] dark:border-[#1a3884]/30 dark:bg-[#1a3884]/20 dark:text-blue-400">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {t("landing.verify.badge") || "OFFICIAL RECORDS"}
                                </div>
                                <h2 className={`font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white ${isDashboard ? 'text-[22px] sm:text-[26px] mb-3' : 'text-3xl md:text-4xl lg:text-[40px] mb-5'}`}>
                                    {t("landing.verify.title")} <br />
                                    <span className="text-[#1a3884] dark:text-blue-400">
                                        {t("landing.verify.title_highlight")}
                                    </span>
                                </h2>
                                <p className={`font-medium leading-relaxed text-slate-500 dark:text-slate-400 ${isDashboard ? 'text-[13px] mb-6' : 'text-[15px] mb-8 max-w-md'}`}>
                                    {t("landing.verify.desc")}
                                </p>

                                <div className="space-y-3">
                                    {[
                                        { icon: Shield, title: t("landing.verify.f1_title") || "TAMPER PROOF", info: t("landing.verify.f1_info") || "Blockchain Secured", sub: t("landing.verify.f1_sub") || "Immutable verification records" },
                                        { icon: Zap, title: t("landing.verify.f2_title") || "INSTANT", info: t("landing.verify.f2_info") || "Real-time Verification", sub: t("landing.verify.f2_sub") || "Zero wait time validation" },
                                    ].map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.1 + idx * 0.1 }}
                                            className={`group flex items-center gap-4 rounded-xl border border-[#d8e6f7] bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-[#1a3884]/30 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:hover:border-[#1a3884]/50 ${isDashboard ? '' : 'p-4'}`}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8e6f7] bg-[#f5f8ff] transition-transform group-hover:scale-105 dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                                <item.icon className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="mb-0.5 text-[14px] font-bold leading-none text-[#0d1f4e] dark:text-white">{item.info}</p>
                                                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{item.sub}</p>
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
                                transition={{ duration: 0.6 }}
                                className="h-full"
                            >
                                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-xl shadow-[#1a3884]/5 dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                    
                                    {/* Top Decoration */}
                                    <div className="relative flex h-24 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-r from-[#1a3884] to-[#112b6b]">
                                        <div className="absolute inset-0 bg-black/10" />
                                        <div className="relative z-10 flex items-center gap-3">
                                            <ShieldCheck className="h-6 w-6 text-blue-300" />
                                            <h3 className="text-[16px] font-extrabold tracking-wide text-white">
                                                {t("landing.verify.card_title") || "Credential Check"}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex flex-grow flex-col px-5 pb-8 pt-5 sm:px-8">
                                        {/* Tab Switcher */}
                                        <div className="relative z-10 mx-auto mb-6 flex w-full max-w-sm rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] p-1 shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                                            <button
                                                onClick={() => { setActiveTab('id'); setVerificationResult(null); setError(null); }}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'id'
                                                    ? 'bg-white text-[#1a3884] shadow-sm dark:bg-[#002A5C] dark:text-white'
                                                    : 'text-slate-500 hover:text-[#0d1f4e] dark:text-slate-400 dark:hover:text-white'}`}
                                            >
                                                <Hash className="h-3.5 w-3.5" />
                                                {t("landing.verify.tab_manual") || "MANUAL ID"}
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('scan'); setVerificationResult(null); setError(null); }}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'scan'
                                                    ? 'bg-white text-[#1a3884] shadow-sm dark:bg-[#002A5C] dark:text-white'
                                                    : 'text-slate-500 hover:text-[#0d1f4e] dark:text-slate-400 dark:hover:text-white'}`}
                                            >
                                                <QrCode className="h-3.5 w-3.5" />
                                                {t("landing.verify.tab_scan") || "SCAN QR"}
                                            </button>
                                        </div>

                                        <div className="flex flex-grow flex-col justify-center">
                                            <AnimatePresence mode="wait">
                                                {activeTab === 'scan' ? (
                                                    <motion.div
                                                        key="scanner"
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="w-full text-center"
                                                    >
                                                        {/* Hidden elements for scanner */}
                                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                                        <div id="reader-landing-hidden" className="hidden"></div>

                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-[#d8e6f7] bg-[#f5f8ff] transition-colors dark:border-[#1a3884]/30 dark:bg-[#001a3d]">
                                                                {isQrScanning ? (
                                                                    <Loader2 className="h-8 w-8 animate-spin text-[#1a3884]" />
                                                                ) : (
                                                                    <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                                )}
                                                            </div>

                                                            <div>
                                                                <h4 className="text-[15px] font-bold text-[#0d1f4e] dark:text-white">
                                                                    {t("landing.verify.scan_title") || "Upload QR Code"}
                                                                </h4>
                                                                <p className="mx-auto mt-1 max-w-[240px] text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
                                                                    {t("landing.verify.scan_desc") || "Select an image containing the certificate QR code."}
                                                                </p>
                                                            </div>

                                                            {qrScanError && (
                                                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-bold text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                                                                    {qrScanError}
                                                                </div>
                                                            )}

                                                            <button
                                                                type="button"
                                                                disabled={isQrScanning}
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="mt-2 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#1a3884] px-6 text-[12px] font-bold text-white shadow-md transition-all hover:bg-[#132c6b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <ImageIcon className="h-4 w-4" />
                                                                {t("landing.verify.btn_choose") || "Choose Image"}
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.form
                                                        key="form"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        onSubmit={handleSubmit}
                                                        className="mx-auto w-full max-w-xs space-y-5"
                                                    >
                                                        <div>
                                                            <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                                {t("landing.verify.input_label") || "Certificate Identifier"}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={certificateId}
                                                                    onChange={(e) => setCertificateId(e.target.value)}
                                                                    placeholder={t("landing.verify.placeholder") || "e.g. SMAART-CAP-2025-ABC12"}
                                                                    className="h-12 w-full rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] px-4 pl-11 text-[13px] font-bold text-[#0d1f4e] outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/10 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white dark:placeholder:text-slate-600"
                                                                />
                                                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="submit"
                                                            disabled={isVerifying || !certificateId.trim()}
                                                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1a3884] px-6 text-[12px] font-bold text-white shadow-md transition-all hover:bg-[#132c6b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isVerifying ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                                                            ) : (
                                                                <>
                                                                    <ShieldCheck className="h-4 w-4 text-white/80" />
                                                                    {t("landing.verify.btn_auth") || "Authenticate"}
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
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 p-6 backdrop-blur-sm dark:bg-[#001630]/95"
                                                    >
                                                        <button
                                                            onClick={() => { setVerificationResult(null); setError(null); }}
                                                            className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1a3884]/20 dark:hover:text-slate-300"
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </button>

                                                        <div className="w-full max-w-sm text-center">
                                                            {error ? (
                                                                <div className="space-y-3">
                                                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100 dark:border-red-900/30 dark:bg-red-900/10">
                                                                        <XCircle className="h-8 w-8 text-red-500" />
                                                                    </div>
                                                                    <h3 className="text-[16px] font-extrabold text-red-600 dark:text-red-400">
                                                                        {t("landing.verify.failed_title") || "Verification Failed"}
                                                                    </h3>
                                                                    <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{error}</p>
                                                                    <button
                                                                        onClick={() => { setVerificationResult(null); setError(null); }}
                                                                        className="mt-4 rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] px-6 py-2 text-[12px] font-bold text-[#0d1f4e] transition-colors hover:border-[#1a3884]/30 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white dark:hover:border-blue-500/30"
                                                                    >
                                                                        {t("landing.verify.btn_try") || "Try Again"}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-5">
                                                                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${verificationResult.verified ? 'border-green-200 bg-green-50 text-green-500 dark:border-green-900/30 dark:bg-green-900/10' : 'border-yellow-200 bg-yellow-50 text-yellow-500 dark:border-yellow-900/30 dark:bg-yellow-900/10'}`}>
                                                                        {verificationResult.verified ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                                                                    </div>

                                                                    <div>
                                                                        <h3 className="text-[16px] font-extrabold text-[#0d1f4e] dark:text-white">
                                                                            {verificationResult.verified ? (t("landing.verify.valid_title") || "Valid Credential") : (t("landing.verify.issue_title") || "Invalid Credential")}
                                                                        </h3>
                                                                        <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                                                            {verificationResult.message}
                                                                        </p>
                                                                    </div>

                                                                    {verificationResult.verified && verificationResult.certificate && (
                                                                        <div className="rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] p-4 text-left shadow-inner dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                                                                            <div className="mb-3">
                                                                                <label className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                                                    {t("landing.verify.recipient") || "Issued To"}
                                                                                </label>
                                                                                <p className="text-[14px] font-extrabold text-[#1a3884] dark:text-blue-400">
                                                                                    {verificationResult.certificate.fullName}
                                                                                </p>
                                                                            </div>
                                                                            <div className="mb-3 h-px bg-[#d8e6f7] dark:bg-[#1a3884]/20" />
                                                                            <div className="mb-3">
                                                                                <label className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                                                    {t("landing.verify.credential") || "Credential Name"}
                                                                                </label>
                                                                                <p className="text-[13px] font-bold text-[#0d1f4e] dark:text-white">
                                                                                    {verificationResult.certificate.certificateTitle}
                                                                                </p>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                                                        {t("landing.verify.issued") || "Issue Date"}
                                                                                    </label>
                                                                                    <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                                                                                        {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="mb-0.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                                                        {t("landing.verify.band") || "Band"}
                                                                                    </label>
                                                                                    <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                                                                                        {verificationResult.certificate.readinessBand}
                                                                                    </p>
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
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CertificateVerification;
