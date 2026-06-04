import { useRef, useState, useEffect } from 'react';
import { Download, Award, CheckCircle2, ShieldCheck, Brain, Activity, Target, Users, Zap, Cpu, Scale, Trophy, Medal, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import apiCall from '@/services/api';
import { BadgeGallery } from "@/components/badges";
import useUser from "@/hooks/useUser";
import blueLogo from '@/assets/blue.png';
import './Certificate.css';

const certificateTypes = [
    {
        id: 'capacity',
        title: 'Professional Certificate in Capacity & Work Readiness',
        shortTitle: 'Certificate\nin Capacity & Work Readiness',
        subtitle: 'Capacity & Work Readiness',
        code: 'CAP'
    },
    {
        id: 'capability',
        title: 'Advanced Professional Certificate in Applied Capability',
        shortTitle: 'Advanced Certificate\nin Applied Capability',
        subtitle: 'Applied Capability',
        code: 'APC'
    },
    {
        id: 'leadership',
        title: 'Professional Diploma in Employability & Leadership Readiness',
        shortTitle: 'Professional Diploma\nin Employability & Leadership Readiness',
        subtitle: 'Employability & Leadership Readiness',
        code: 'ELR'
    },
    {
        id: 'combined',
        title: 'Master Professional Diploma in Comprehensive Readiness',
        shortTitle: 'Master Professional Diploma\nin Comprehensive Readiness',
        subtitle: 'Acknowledging Capacity, Capability & Leadership',
        code: 'MPD'
    }
];

const skills = [
    { label: 'Cognitive Reasoning (CRQ)', icon: Brain },
    { label: 'Self-Regulation & Drive (SRQ)', icon: Activity },
    { label: 'Learning Agility (LQ)', icon: Target },
    { label: 'Social Interaction (SIQ)', icon: Users },
    { label: 'Professional Execution (PEQ)', icon: Zap },
    { label: 'Digital & AI Literacy (DAQ)', icon: Cpu, accent: true },
    { label: 'Ethical & Sustainability Judgement (SEQ)', icon: Scale, accent: true }
];

const Certificate = () => {
    const navigate = useNavigate();
    const certificateRef = useRef(null);
    const { user, refreshUser } = useUser();
    const [selectedType, setSelectedType] = useState(null);
    const [activeTab, setActiveTab] = useState('certificates'); // 'certificates' or 'badges'
    const [userData, setUserData] = useState({ fullName: 'Ms. Rehana Ameer', gender: 'Female' });
    const [issueDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    const [certId, setCertId] = useState('');
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.fullName) {
                const prefix = user.gender?.toLowerCase() === 'female' ? 'Ms. ' : (user.gender?.toLowerCase() === 'male' ? 'Mr. ' : '');
                setUserData({
                    fullName: `${prefix}${user.fullName}`,
                    gender: user.gender
                });
            }
        }
    }, [user]);

    useEffect(() => {
        // Refresh user data when entering badges tab to catch new badges
        if (activeTab === 'badges') {
            refreshUser();
        }
    }, [activeTab, refreshUser]);

    // Generate certificate and QR code when type is selected
    useEffect(() => {
        if (selectedType) {
            generateCertificate();
        }
    }, [selectedType]);

    const generateCertificate = async () => {
        setIsGenerating(true);
        try {
            // Issue certificate through backend
            const response = await apiCall('/certificates/issue', {
                method: 'POST',
                body: JSON.stringify({
                    certificateType: selectedType.id,
                    certificateTitle: selectedType.title,
                    validatedSkills: skills.map(s => ({ label: s.label, score: 85 })),
                    readinessBand: 'Proficient',
                    assessmentWindow: `TST-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
                })
            });

            if (response.success) {
                const { certificateId } = response.certificate;
                setCertId(certificateId);

                // Always use dynamic local origin so scanning the QR in dev points to localhost
                const dynamicUrl = `${window.location.origin}/verify-certificate/${certificateId}`;

                // Generate QR code with verification URL
                const qrDataUrl = await QRCode.toDataURL(dynamicUrl, {
                    width: 150,
                    margin: 1,
                    color: {
                        dark: '#002147',
                        light: '#FFFFFF'
                    }
                });
                setQrCodeDataUrl(qrDataUrl);

                toast.success('Certificate generated successfully!');
            }
        } catch (error) {
            console.error('Error generating certificate:', error);
            toast.error('Failed to generate certificate. Please try again.');

            // Fallback to local generation if backend fails
            const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
            const year = new Date().getFullYear();
            const fallbackId = `SMAART-${selectedType.code}-${year}-${randomStr}`;
            setCertId(fallbackId);

            const fallbackUrl = `${window.location.origin}/verify-certificate/${fallbackId}`;
            const qrDataUrl = await QRCode.toDataURL(fallbackUrl, {
                width: 150,
                margin: 1,
                color: {
                    dark: '#002147',
                    light: '#FFFFFF'
                }
            });
            setQrCodeDataUrl(qrDataUrl);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        const element = certificateRef.current;
        if (!element) return;

        const toastId = toast.loading('Generating secure certificate PDF...');

        try {
            // Wait for final layout stabilizes
            await new Promise(r => setTimeout(r, 1000));

            // Standard A4 dimensions in pixels at 96 DPI
            const TARGET_WIDTH = 794;
            const TARGET_HEIGHT = 1123;

            // Reset scroll to top to prevent coordinate offsets during capture
            const originalScrollPos = window.scrollY;
            window.scrollTo(0, 0);

            const canvas = await html2canvas(element, {
                scale: 4, // Higher scale for better clarity
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('certificate-to-print');
                    if (clonedElement) {
                        clonedElement.classList.add('capturing-pdf');
                        // Reset all positioning and margins to ensure full bleed capture
                        clonedElement.style.margin = '0';
                        clonedElement.style.padding = '0';
                        clonedElement.style.boxShadow = 'none';
                        clonedElement.style.border = 'none';
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'fixed'; // Fixed to ensure it stays at top-left
                        clonedElement.style.top = '0';
                        clonedElement.style.left = '0';
                        // Explicitly set A4 dimensions
                        clonedElement.style.width = '210mm';
                        clonedElement.style.height = '297mm';
                        clonedElement.style.maxWidth = 'none';
                        clonedElement.style.maxHeight = 'none';
                        // Force background to be white
                        clonedElement.style.backgroundColor = '#ffffff';
                    }
                }
            });

            // Restore original scroll
            window.scrollTo(0, originalScrollPos);

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                hotfixes: ["px_scaling"]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'SLOW');
            pdf.save(`${userData.fullName.replace(/\s+/g, '_')}_SMAART_Certificate_${certId}.pdf`);

            toast.success('Certificate secured and downloaded!', { id: toastId });
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Security handshake failed. Please try again.', { id: toastId });
        }
    };

    // --- RENDER SELECTION SCREEN ---
    if (!selectedType) {
        return (
            <div className="space-y-6">
                {/* ── Back button ── */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    onClick={() => navigate("/dashboard/skills-vault")}
                    className="group flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a3884]/70 transition-all hover:text-[#1a3884] dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e6f7] bg-white shadow-sm transition-all duration-200 group-hover:-translate-x-0.5 group-hover:shadow-md dark:border-[#1a3884]/30 dark:bg-[#001a3d]">
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </div>
                    Back to Skills Vault
                </motion.button>

                {/* ── Hero Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
                >
                    <div className="relative z-10">
                        {/* Badge pill */}
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#1a3884]/15 bg-[#eef4ff] px-2.5 py-0.5 dark:border-[#1a3884]/40 dark:bg-[#1a3884]/20">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1a3884] dark:bg-blue-400" />
                            <span className="text-[9px] font-black tracking-wider text-[#1a3884] dark:text-blue-400">
                                SECURE LEDGER
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3884] to-[#2656c8] text-white shadow-md">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-[20px] font-extrabold tracking-tight text-[#0d1f4e] sm:text-[24px] dark:text-white">
                                    Credentials & Certificates
                                </h1>
                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                    Access, manage, and download your verified SMAART Institute certifications.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative bg element */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#1a3884]/5 blur-[32px] dark:bg-blue-500/10" />
                </motion.div>

                {/* Main Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border border-[#d8e6f7] bg-white p-6 shadow-[0_2px_8px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001630]"
                >
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                            {certificateTypes.map((cert) => (
                                <button
                                    key={cert.id}
                                    onClick={() => setSelectedType(cert)}
                                    className="group flex flex-col items-start gap-4 rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] p-5 text-left transition-all hover:border-[#1a3884]/50 hover:bg-white hover:shadow-[0_4px_20px_rgba(26,56,132,0.08)] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:hover:border-[#1a3884]/50 dark:hover:bg-[#001630]"
                                >
                                    <div className="flex w-full items-start justify-between gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] border border-blue-200/60 dark:bg-[#1a3884]/15 dark:border-blue-500/20 transition-transform group-hover:scale-105">
                                            <Award className="h-6 w-6 text-[#1a3884] dark:text-blue-400" />
                                        </div>
                                        <div className="flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400">
                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                            Verified
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        <h3 className="mb-2 text-[15px] font-extrabold leading-tight text-[#0d1f4e] transition-colors group-hover:text-[#1a3884] dark:text-white dark:group-hover:text-blue-400">
                                            {cert.title}
                                        </h3>
                                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Level 1 Professional Credential</p>
                                    </div>

                                    <div className="mt-2 flex w-full items-center justify-between border-t border-[#d8e6f7] pt-4 dark:border-[#1a3884]/20">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a3884] dark:text-blue-400">
                                            View Secure Document
                                        </span>
                                        <span className="text-lg text-[#1a3884] transition-transform group-hover:translate-x-1 dark:text-blue-400">→</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Verify Actions */}
                        <div className="flex flex-col items-center justify-center rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] p-8 text-center dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4ff] text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-400">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h4 className="mb-2 text-[16px] font-extrabold text-[#0d1f4e] dark:text-white">Credential Verification Engine</h4>
                            <p className="mb-6 max-w-sm text-[13px] font-medium text-slate-500 dark:text-slate-400">Have a certificate ID? Verify its authenticity instantly on our secure ledger.</p>
                            <a
                                href="/verify-certificate"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#1a3884] px-8 py-3 text-[13.5px] font-bold text-white shadow-md transition-all hover:bg-[#132c6b] active:scale-95"
                            >
                                Launch Verifier
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- RENDER CERTIFICATE VIEW ---
    const verificationUrl = qrCodeDataUrl ? `${window.location.origin}/verify-certificate/${certId}` : '';

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300">
            <main className="w-full relative py-8 px-4 flex flex-col items-center">

                {/* Controls */}
                <div className="z-[30] flex w-full max-w-[794px] items-center justify-between mb-8 no-print bg-white dark:bg-[#002147] p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <button
                        onClick={() => setSelectedType(null)}
                        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#00152e] dark:hover:bg-[#001a38] text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl transition-all font-semibold text-sm border border-slate-200 dark:border-white/5"
                    >
                        ← Back
                    </button>
                    
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex items-center gap-2 bg-[#1a3884] hover:bg-[#132c6b] text-white px-6 py-2.5 rounded-xl shadow-md transition-all font-bold text-sm disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {isGenerating ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>

                {/* Certificate Paper - A4 Portrait */}
                <div className="transform scale-[0.6] sm:scale-[0.8] lg:scale-[0.9] origin-top shadow-2xl">
                    <div className="certificate-paper" ref={certificateRef} id="certificate-to-print">
                        {/* Security Watermark Backdrop */}
                        <div className={`cert-watermark-overlay ${selectedType.id === 'combined' ? 'combined-watermark' : ''}`}>{certId}</div>

                        <div className={`cert-content ${selectedType.id === 'combined' ? 'combined-content' : ''}`}>
                            <header className="cert-header">
                                <div className="cert-logo-container">
                                    <img src={blueLogo} alt="SMAART INSTITUTE Logo" className="cert-logo" />
                                </div>
                                <div className="cert-title-container">
                                    <h1 className="cert-org-name">SMAART INSTITUTE</h1>
                                    <div className="credential-label">PROFESSIONAL CREDENTIAL</div>
                                </div>
                            </header>

                            <div className="cert-body">
                                <section className="cert-main-title">
                                    <h1 style={{ whiteSpace: 'pre-line' }} className={selectedType.id === 'combined' ? 'combined-title' : ''}>
                                        {selectedType.shortTitle}
                                    </h1>
                                    <div className="subtitle">{selectedType.subtitle}</div>
                                </section>

                                <section className="recipient-block">
                                    <div className="this-certifies">This certifies that</div>
                                    <div className={`recipient-name ${selectedType.id === 'combined' ? 'combined-recipient' : ''}`}>
                                        {userData.fullName.toUpperCase()}
                                    </div>
                                </section>

                                {selectedType.id === 'combined' ? (
                                    <div className="combined-cert-details">
                                        <p className="cert-statement">
                                            has successfully verified mastery across the complete spectrum of professional readiness,
                                            demonstrating specific excellence in the following accredited domains:
                                        </p>
                                        <div className="included-certs-list">
                                            <div className="included-cert-item red-theme">
                                                <div className="cert-bullet"></div>
                                                <span>Professional Certificate in Capacity & Work Readiness</span>
                                            </div>
                                            <div className="included-cert-item blue-theme">
                                                <div className="cert-bullet"></div>
                                                <span>Advanced Professional Certificate in Applied Capability</span>
                                            </div>
                                            <div className="included-cert-item gold-theme">
                                                <div className="cert-bullet"></div>
                                                <span>Professional Diploma in Employability & Leadership Readiness</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="cert-statement">
                                        has successfully completed the SMAART Institute professional learning and assessment programme demonstrating verified readiness across defined professional competencies.
                                    </p>
                                )}

                                <section className="skills-panel">
                                    <div className="skills-column">
                                        <h2 className="panel-title">Validated Skill Quotients</h2>
                                        <ul className="skills-list">
                                            {skills.map((skill, i) => (
                                                <li key={i} className={skill.accent ? 'teal-accent' : ''}>
                                                    <span>{skill.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="readiness-column">
                                        <h2 className="panel-title">Readiness Profile</h2>
                                        <div className="readiness-content">
                                            <div className="readiness-stat">
                                                <span className="stat-label">Readiness Band</span>
                                                <span className="stat-value band">Proficient</span>
                                            </div>
                                            <div className="readiness-stat">
                                                <span className="stat-label">Assessment Window</span>
                                                <span className="stat-value">TST-2025-003</span>
                                            </div>
                                            <div className="readiness-stat">
                                                <span className="stat-label">Issuing Authority</span>
                                                <span className="stat-value uppercase">SMAART UK</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <footer className="cert-footer">
                                <div className="signature-zone">
                                    <div className="signature-line"></div>
                                    <div className="signature-name">Ms. Rehana Banu Ameer</div>
                                    <div className="signature-title">Director of Academic Quality</div>
                                    <div className="signature-org">SMAART Institute (UK)</div>
                                    <div className="issue-date">Issued this day: {issueDate}</div>
                                </div>

                                <div className="verification-zone">
                                    {qrCodeDataUrl && (
                                        <img src={qrCodeDataUrl} alt="Verify QR Code" className="qr-code" />
                                    )}
                                    <div className="verify-info">
                                        <span className="verify-label">Verify this credential at:</span>
                                        <span className="verify-url">{typeof window !== "undefined" ? `${window.location.host}/verify-certificate` : 'https://verify.smaart.in'}</span>
                                        <span className="cert-id-tag">REF: {certId}</span>
                                    </div>
                                </div>
                            </footer>

                            {selectedType.id !== 'combined' && (
                                <div className="legal-disclaimer">
                                    This credential is an industry-recognized professional qualification and does not confer
                                    academic degree or government-regulated diploma equivalence within the UK education framework.
                                    &copy; {new Date().getFullYear()} SMAART Institute London.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Certificate;
