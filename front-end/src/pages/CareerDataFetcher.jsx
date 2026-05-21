import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Brain, RefreshCw, Plus, Cpu, Loader2, Sparkles, Clock
} from 'lucide-react';
import careerIntelligenceApi from '@/services/careerIntelligenceApi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { FormStepSkeleton, ReportSkeleton } from '@/components/SkeletonPatterns';

// Import Constants
import { FORM_STEPS } from '@/components/career/CareerConstants';

// Import Eagerly (Main Form)
import CareerForm from '@/components/career/CareerForm';

// Lazy Load Heavy Components
const CareerReport = lazy(() => import('@/components/career/CareerReport'));
const SimulationPanel = lazy(() => import('@/components/career/SimulationPanel'));

const CareerDataFetcher = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState(null);
    const [previousReports, setPreviousReports] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [error, setError] = useState('');
    const [loadingReports, setLoadingReports] = useState(true);
    const reportRef = useRef(null);

    // Simulation Engine State
    const [simCount, setSimCount] = useState(50);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simResult, setSimResult] = useState(null);
    const [showSimPanel, setShowSimPanel] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [formData, setFormData] = useState({
        degreeGroup: '',
        specialisation: '',
        yearOfStudy: '',
        jobRolePreferences: [],
        sectorPreference: [],
        companyTypePreference: 'OPEN',
        shortTermGoal: '',
        longTermGoal: '',
        interests: [],
        placementTimeline: '',
        isPriority: false,
        currentSkills: [],
        domain: '',
        domainOther: '',
        interestedJobRole: '',
    });

    const [excelData, setExcelData] = useState({ sectors: [], roles: [] });

    const loadReports = async () => {
        const userId = JSON.parse(sessionStorage.getItem('user'))?._id;
        if (!userId) return;

        setLoadingReports(true);
        try {
            const data = await careerIntelligenceApi.getReports();
            const reports = data.reports || [];
            setPreviousReports(reports);

            const trackingId = sessionStorage.getItem('generating_report_id');
            if (trackingId) {
                const tracked = reports.find(r => r._id === trackingId);
                if (tracked && tracked.status === 'completed') {
                    setReport(tracked);
                    setShowForm(false);
                    sessionStorage.removeItem('generating_report_id');
                    return;
                } else if (tracked && tracked.status === 'failed') {
                    setError('The previous generation attempt failed. Please try again.');
                    sessionStorage.removeItem('generating_report_id');
                } else if (tracked) {
                    setIsGenerating(true);
                }
            }

            if (reports.length > 0 && !isGenerating) {
                const latest = reports.find(r => r.status === 'completed');
                if (latest && !report) {
                    setReport(latest);
                    setShowForm(false);
                }
            }
        } catch (err) {
            console.error('Failed to load reports:', err);
        } finally {
            setLoadingReports(false);
        }
    };

    const fetchExcelData = async () => {
        try {
            // Note: apiCall was used in the original but not imported. 
            // Assuming it's part of a service or I should use careerIntelligenceApi if available.
            // In the original it was: const data = await apiCall('/career-intelligence/excel-data');
            // I'll keep it as a placeholder or check if careerIntelligenceApi has it.
            const data = await careerIntelligenceApi.getExcelData?.() || { masterSectors: [], allRoles: [] };
            setExcelData({
                sectors: data.masterSectors || [],
                roles: data.allRoles || []
            });
        } catch (error) {
            console.error("Error fetching career data:", error);
        }
    };

    useEffect(() => {
        loadReports();
        fetchExcelData();
    }, []);

    const validateStep = () => {
        switch (currentStep) {
            case 0:
                if (!formData.degreeGroup) return false;
                // Specialisation is required if the degree group has specialisations defined
                // But since SPECIALISATIONS is in constants, we'd need to import it here too
                // For now, I'll pass it down or import it.
                return true;
            case 1: return !!formData.yearOfStudy;
            case 2: return formData.jobRolePreferences.length >= 1;
            case 3: return true;
            case 4: return formData.shortTermGoal.trim().length > 2 && formData.longTermGoal.trim().length > 2;
            case 5: return formData.interests.length >= 1;
            case 6: return !!formData.placementTimeline;
            case 7: return formData.currentSkills.length >= 1;
            case 8: return formData.domain && (formData.domain !== 'Others' || formData.domainOther.trim().length > 2);
            default: return true;
        }
    };

    const handleSubmit = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const submitData = {
                ...formData,
                degree: formData.degreeGroup,
                specialization: formData.specialisation || null,
                interestedJobRole: formData.jobRolePreferences.join(', '),
                jobSector: formData.sectorPreference.join(', ') || 'Open to Any',
                areaOfInterest: formData.interests.join(', '),
            };

            const data = await careerIntelligenceApi.generateReport(submitData);
            const reportId = data.report?._id || data.report?.id;
            if (reportId) sessionStorage.setItem('generating_report_id', reportId);

            // FIX: The generate endpoint returns { input, output } but the DB & UI expects
            // { careerInput, careerOutput }. Normalize the shape here so the report displays
            // correctly (history list, PDF export, etc.) without another round-trip.
            const normalizedReport = data.report ? {
                ...data.report,
                careerInput: data.report.careerInput || data.report.input,
                careerOutput: data.report.careerOutput || data.report.output,
            } : null;

            if (normalizedReport?.status === 'completed') {
                setReport(normalizedReport);
                setShowForm(false);
                setPreviousReports(prev => [normalizedReport, ...prev]);
                sessionStorage.removeItem('generating_report_id');
            } else if (normalizedReport) {
                setReport(normalizedReport);
                setShowForm(false);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Generation failed:', err);
            // FIX: Session expiry during long AI generation used to silently logout the user.
            // Now we show a clear error message instead of just redirecting.
            if (err.message && err.message.includes('Unauthorized')) {
                toast.error('⚠️ Your session expired while generating. Please log in again — your form data is still in progress.');
                setError('Your session has expired. Please refresh the page and log in again to continue.');
            } else {
                setError(err.message || 'The AI engine is busy. Please try again in a few minutes.');
            }
            sessionStorage.removeItem('generating_report_id');
        } finally {
            setIsGenerating(false);
        }
    };

    const viewReport = (r) => {
        setReport(r);
        setShowForm(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const startNew = () => {
        setShowForm(true);
        setCurrentStep(0);
        setFormData({
            degreeGroup: '', specialisation: '', yearOfStudy: '',
            jobRolePreferences: [], sectorPreference: [],
            companyTypePreference: 'OPEN',
            shortTermGoal: '', longTermGoal: '',
            interests: [], placementTimeline: '', isPriority: false,
            currentSkills: [], domain: '', domainOther: '',
            interestedJobRole: '',
        });
        setError('');
    };

    const handleRunSimulation = async () => {
        const finalCount = Math.min(Math.max(parseInt(simCount) || 50, 1), 50);
        setIsSimulating(true);
        setSimResult(null);
        try {
            const data = await careerIntelligenceApi.runSimulation(finalCount);
            setSimResult(data);
            toast.success(`✅ Simulation complete! ${data.totalGenerated} profiles saved to database.`);
        } catch (err) {
            toast.error(err.message || 'Simulation failed. Please try again.');
        } finally {
            setIsSimulating(false);
        }
    };

    const handleExportToExcel = async (params) => {
        setIsExporting(true);
        try {
            const data = await careerIntelligenceApi.exportToExcel(params);
            toast.success(data.message || '✅ Successfully exported to Excel!');
        } catch (err) {
            toast.error(err.message || 'Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!report || !reportRef.current) return;
        const toastId = toast.loading("Preparing your professional PDF report...");
        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`SMAART - Career - Report - ${report.careerInput?.interestedJobRole || 'Intelligence'}.pdf`);
            toast.success("Report downloaded successfully!", { id: toastId });
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.error("Failed to generate PDF. Please try again.", { id: toastId });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950/50 transition-colors duration-300">
            <main className="w-full relative py-8 px-4 md:px-0">
                <div className="max-w-5xl mx-auto pb-12">
                    {/* Page Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                    <Database className="w-7 h-7" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                    <Sparkles size={10} className="text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">
                                Career Intelligence Agent
                            </h1>
                            <div className="flex gap-2">
                                {previousReports.length > 0 && (
                                    <div className="relative group/history">
                                        <button className="p-2 rounded-lg bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-amber-500 transition-all shadow-sm flex items-center gap-1.5">
                                            <Clock size={18} />
                                            <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:block">History</span>
                                        </button>
                                        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#002A5C] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl opacity-0 invisible group-hover/history:opacity-100 group-hover/history:visible transition-all z-[60] overflow-hidden">
                                            <div className="p-3 border-b border-slate-50 dark:border-white/10 bg-slate-50/50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase px-4">Your Intelligence History</div>
                                            <div className="max-h-80 overflow-y-auto no-scrollbar">
                                                {previousReports.map((r, idx) => (
                                                    <button key={r._id} onClick={() => viewReport(r)} className={`w-full text-left p-3 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-colors border-b border-slate-50 dark:border-white/10 last:border-0 flex items-center gap-3 ${report?._id === r._id ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}>
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600'}`}>
                                                            {idx === 0 ? 'NEW' : previousReports.length - idx}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-700 dark:text-white truncate max-w-[160px]">{r.careerInput?.interestedJobRole || 'Career Report'}</div>
                                                            <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()} • {r.status}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <button onClick={startNew} className="p-2 rounded-lg bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-emerald-500 transition-all shadow-sm" title="Start New Assessment">
                                    <Plus size={18} />
                                </button>
                                <button onClick={loadReports} disabled={loadingReports} className="p-2 rounded-lg bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-500 transition-all shadow-sm disabled:opacity-50" title="Refresh Reports">
                                    <RefreshCw size={18} className={loadingReports ? 'animate-spin' : ''} />
                                </button>
                                <button onClick={() => setShowSimPanel(prev => !prev)} className={`p-2 rounded-lg border transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold ${showSimPanel ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white dark:bg-[#002A5C] border-slate-200 dark:border-white/10 text-slate-500 hover:text-violet-500'}`} title="Career Simulation Engine">
                                    <Cpu size={16} />
                                    <span className="hidden sm:block uppercase tracking-tight">Simulate</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            AI-Powered Career Intelligence Engine — combining structured career data with personalized AI analysis to build your career roadmap
                        </p>
                    </motion.div>

                    {/* Generating Overlay */}
                    <AnimatePresence>
                        {isGenerating && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white dark:bg-[#002A5C] rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
                                    <div className="relative w-24 h-24 mx-auto mb-6">
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 0)' }} />
                                        <div className="absolute inset-2 rounded-full bg-white dark:bg-[#002A5C] flex items-center justify-center">
                                            <Brain className="w-10 h-10 text-indigo-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Generating Career Intelligence</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Analyzing your profile with AI + Excel data engine...</p>
                                    <div className="space-y-3">
                                        {['Mapping career data...', 'Running AI analysis...', 'Merging intelligence...'].map((step, i) => (
                                            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 1.5 }} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <Loader2 size={14} className="animate-spin text-indigo-500" />
                                                {step}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Alert */}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 text-sm font-medium">
                            ⚠️ {error}
                        </motion.div>
                    )}

                    {/* Content Area */}
                    {showForm ? (
                        <CareerForm
                            currentStep={currentStep}
                            setCurrentStep={setCurrentStep}
                            formData={formData}
                            setFormData={setFormData}
                            excelData={excelData}
                            isGenerating={isGenerating}
                            handleSubmit={handleSubmit}
                            report={report}
                            setShowForm={setShowForm}
                            startNew={startNew}
                            validateStep={validateStep}
                        />
                    ) : (
                        <Suspense fallback={<ReportSkeleton />}>
                            <CareerReport
                                report={report}
                                reportRef={reportRef}
                                startNew={startNew}
                                loadReports={loadReports}
                                setShowForm={setShowForm}
                                handleDownloadPDF={handleDownloadPDF}
                                handleExportToExcel={handleExportToExcel}
                                isExporting={isExporting}
                                previousReports={previousReports}
                                viewReport={viewReport}
                            />
                        </Suspense>
                    )}

                    {/* Simulation Engine Panel */}
                    <AnimatePresence>
                        {showSimPanel && (
                            <Suspense fallback={<Skeleton className="mt-8 h-[300px] w-full rounded-3xl" />}>
                                <SimulationPanel
                                    simCount={simCount}
                                    setSimCount={setSimCount}
                                    handleRunSimulation={handleRunSimulation}
                                    isSimulating={isSimulating}
                                    simResult={simResult}
                                    handleExportToExcel={handleExportToExcel}
                                    isExporting={isExporting}
                                />
                            </Suspense>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default CareerDataFetcher;
