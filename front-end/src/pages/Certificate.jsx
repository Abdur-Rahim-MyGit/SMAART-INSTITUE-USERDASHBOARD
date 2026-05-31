import { useRef, useState, useEffect } from 'react';
import { Download, Award, CheckCircle2, ShieldCheck, Brain, Activity, Target, Users, Zap, Cpu, Scale, Trophy, Medal } from 'lucide-react';
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
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300">
                <main className="w-full relative py-12 px-4 md:px-6">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#C0C0C0] to-[#A8A8A8] flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <ShieldCheck className="w-10 h-10 text-[#002147]" />
                        </div>
                        <h1 className="text-3xl font-bold text-[#002147] dark:text-white mb-3 tracking-tight">Credentials & Achievements</h1>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Access your verified SMAART Institute certifications and badges</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex bg-white dark:bg-[#002A5C] rounded-2xl p-1.5 shadow-lg border border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setActiveTab('certificates')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'certificates'
                                    ? 'bg-[#002147] text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#002A5C]'
                                    }`}
                            >
                                <Award className="w-5 h-5" />
                                Certificates
                            </button>
                            <button
                                onClick={() => setActiveTab('badges')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'badges'
                                    ? 'bg-[#002147] text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#002A5C]'
                                    }`}
                            >
                                <Trophy className="w-5 h-5" />
                                Badges & Achievements
                            </button>
                        </div>
                    </div>

                    {/* Certificates Tab */}
                    {activeTab === 'certificates' && (
                        <div className="flex flex-col items-center">
                            <div className="grid gap-4 w-full max-w-2xl">
                                {certificateTypes.map((cert) => (
                                    <button
                                        key={cert.id}
                                        onClick={() => setSelectedType(cert)}
                                        className="group relative w-full p-6 rounded-2xl bg-white dark:bg-[#002147] border border-gray-200 dark:border-white/10 hover:border-[#1a3884] dark:hover:border-[#1a3884] transition-all duration-300 text-left hover:shadow-xl dark:shadow-none"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] flex items-center justify-center shrink-0 group-hover:bg-[#1a3884]/10 text-[#1a3884] transition-colors">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-[#002147] dark:text-white">
                                                    {cert.title}
                                                </h3>
                                                <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                    Verified Level 1 Credential
                                                </p>
                                            </div>
                                            <div className="text-[#1a3884] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                VIEW SECURE <span className="text-lg">→</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Verify Certificate Link */}
                            <div className="mt-8 text-center">
                                <a
                                    href="/verify-certificate"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a3884] to-[#2a7a85] hover:from-[#2a7a85] hover:to-[#1a3884] text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    <ShieldCheck className="w-5 h-5" />
                                    Verify a Certificate
                                </a>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">
                                    Have a certificate ID? Verify its authenticity here
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Badges Tab */}
                    {activeTab === 'badges' && (
                        <div className="max-w-6xl mx-auto">
                            <BadgeGallery userName={userData.fullName} badges={user?.badges || []} />

                            {/* Verify Badge Link */}
                            <div className="mt-8 text-center">
                                <a
                                    href="/verify-badge"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a3884] to-[#2a7a85] hover:from-[#2a7a85] hover:to-[#1a3884] text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Medal className="w-5 h-5" />
                                    Verify a Badge
                                </a>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">
                                    Have a badge ID? Verify its authenticity here
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // --- RENDER CERTIFICATE VIEW ---
    const verificationUrl = qrCodeDataUrl ? `${window.location.origin}/verify-certificate/${certId}` : '';

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300">
            <main className="w-full relative py-8 px-4 flex flex-col items-center">

                {/* Controls */}
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[30] flex items-center gap-4 no-print bg-white/80 dark:bg-dark-card/80 backdrop-blur-md p-2 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg">
                    <button
                        onClick={() => setSelectedType(null)}
                        className="flex items-center gap-2 bg-transparent hover:bg-gray-100 dark:hover:bg-[#002A5C] text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl transition-all font-medium text-sm"
                    >
                        ← Back
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex items-center gap-2 bg-[#002147] hover:bg-[#0d1b2a] dark:bg-[#1a3884] dark:hover:bg-[#132c6b] text-white px-5 py-2 rounded-xl shadow-md transition-all font-bold text-sm disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {isGenerating ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>

                {/* Certificate Paper - A4 Portrait */}
                <div className="transform scale-[0.6] sm:scale-[0.8] lg:scale-[0.9] origin-top mt-16 shadow-2xl">
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
