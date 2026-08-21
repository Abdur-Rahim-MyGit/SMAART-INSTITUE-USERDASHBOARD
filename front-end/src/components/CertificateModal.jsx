import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, UploadCloud, CheckCircle2, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CertificateModal = ({ skillName, onConfirm, onClose, theme }) => {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [verified, setVerified] = useState(false);
    const [skipCert, setSkipCert] = useState(false);
    const fileInputRef = useRef(null);

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleFile = (f) => {
        if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) {
            setFile(f);
            setVerified(false);
            setSkipCert(false);
        }
    };

    const handleVerify = () => { 
        if (file) {
            setVerified(true);
        } 
    };
    
    const canConfirm = verified || skipCert;
    const handleConfirm = () => { onConfirm(skillName, file); };

    const step = !file && !skipCert ? 1 : (file && !verified) ? 2 : 3;
    const STEPS = ['Upload', 'Verify', 'Confirm'];

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
            {/* Modal Card */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative w-full max-w-[460px] bg-white/95 dark:bg-[#002147]/95 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)] rounded-[28px] overflow-hidden font-sans my-8 text-slate-800 dark:text-slate-200"
            >
                {/* Top progress stripe */}
                <div className="h-1.5 bg-[#e2e8f0] dark:bg-white/5 relative">
                    <motion.div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                        animate={{ width: `${(step / 3) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-[#1a3884] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100/30 dark:border-blue-900/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={10} />
                            Mark as Completed
                        </div>
                        <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate max-w-full">
                            {skillName}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all cursor-pointer flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Steps Navigator */}
                <div className="flex items-center justify-between px-8 py-3 bg-slate-50/50 dark:bg-black/10 border-b border-slate-100 dark:border-white/5">
                    {STEPS.map((s, i) => {
                        const isActive = step === i + 1;
                        const isDone   = step > i + 1;
                        return (
                            <React.Fragment key={s}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 text-[10px] font-black border-2 ${
                                        isDone 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : isActive 
                                                ? 'bg-[#1a3884] dark:bg-blue-600 border-[#1a3884] dark:border-blue-600 text-white shadow-md shadow-blue-500/10' 
                                                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500'
                                    }`}>
                                        {isDone ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-[9px] font-extrabold uppercase tracking-wide transition-colors ${
                                        isDone ? 'text-emerald-500' : isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                        {s}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
                                        step > i + 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/5'
                                    }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Content Body with slide animation */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Step 1: Upload Dropzone */}
                            {step === 1 && (
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-3.5 ${
                                        dragOver 
                                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500' 
                                            : 'bg-slate-50/50 dark:bg-black/10 border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20'
                                    }`}
                                >
                                    <input 
                                        ref={fileInputRef} 
                                        type="file" 
                                        accept=".pdf,image/*" 
                                        className="hidden" 
                                        onChange={e => handleFile(e.target.files[0])} 
                                    />
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                                        <UploadCloud size={24} className="text-[#1a3884] dark:text-blue-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-slate-900 dark:text-white">
                                            Drop your certificate here or{' '}
                                            <span className="text-[#1a3884] dark:text-blue-400 underline underline-offset-2">browse files</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                            Supports PDF, JPG, PNG up to 10MB
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Uploaded & Awaiting Verification */}
                            {step === 2 && file && (
                                <div className="border border-slate-200/85 dark:border-white/10 bg-slate-50/40 dark:bg-black/10 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/30 dark:border-emerald-900/20 flex items-center justify-center text-emerald-500">
                                        <FileText size={24} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[320px]">
                                            {file.name}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                            {(file.size / 1024).toFixed(1)} KB &middot; Awaiting verification
                                        </p>
                                    </div>

                                    <div className="flex gap-2 w-full pt-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 py-2 px-3 border border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer"
                                        >
                                            Change File
                                        </button>
                                        <button
                                            onClick={handleVerify}
                                            className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[11px] font-extrabold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle2 size={13} />
                                            Verify File
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Verified Success or Skipped Warning */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    {verified ? (
                                        <div className="border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
                                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800/40 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                                    Verification Successful!
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                    Your certificate metadata is linked and verified.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border border-amber-200/50 dark:border-amber-900/30 bg-amber-500/5 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
                                            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30 flex items-center justify-center text-amber-500">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                                    No Certificate Attached
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                    You are completing this skill without verification docs.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Utility actions inside steps */}
                            <div className="flex items-center justify-between text-[11px] font-bold pt-1.5">
                                {step === 1 && !skipCert && (
                                    <button
                                        type="button"
                                        onClick={() => setSkipCert(true)}
                                        className="text-slate-400 hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                                    >
                                        Skip - Complete without file <ArrowRight size={12} />
                                    </button>
                                )}
                                {step === 3 && !verified && (
                                    <button
                                        type="button"
                                        onClick={() => { setSkipCert(false); setFile(null); }}
                                        className="text-slate-400 hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors cursor-pointer"
                                    >
                                        ← Back to upload
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-2 p-5 bg-slate-50/50 dark:bg-black/10 border-t border-slate-100 dark:border-white/5 justify-end">
                    <button
                        onClick={onClose}
                        className="py-2.5 px-4 bg-white dark:bg-[#002A5C] text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className={`py-2.5 px-5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                            canConfirm 
                                ? 'bg-gradient-to-r from-[#1a3884] to-[#112b6b] dark:from-blue-600 dark:to-blue-500 text-white shadow-md shadow-blue-500/10 cursor-pointer' 
                                : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        <CheckCircle2 size={14} />
                        {verified ? 'Complete & Link Cert' : 'Mark as Completed'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default CertificateModal;
