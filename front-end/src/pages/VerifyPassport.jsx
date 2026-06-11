import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertTriangle, Search, Loader2, User, Hash, ScanLine, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import useUser from '@/hooks/useUser';
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

const VerifyPassport = () => {
    const { passportId: urlPassportId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const isLoggedIn = !!user;
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const qrName = queryParams.get('name') || "Verified Student";
    const qrPhoto = queryParams.get('photo') || null;
    const qrInstitution = queryParams.get('institution') || "SMAART Institute";
    
    const [passportId, setPassportId] = useState(urlPassportId || '');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (urlPassportId) {
            verifyPassport(urlPassportId);
        }
    }, [urlPassportId]);

    const verifyPassport = async (id = passportId) => {
        if (!id || id.trim() === '') {
            toast.error('Please enter a Skills Passport ID');
            return;
        }

        setIsVerifying(true);
        setError(null);
        setVerificationResult(null);

        try {
            // SECURITY: verification MUST come from the server. The previous code
            // fabricated a "verified: true" result for any id starting with "SM-"
            // and pulled the displayed name/photo from URL query params / localStorage
            // — anyone could forge an "Authenticated" passport screen for any name.
            // We now render strictly from the backend response and never synthesise
            // a verified state on the client.
            // NOTE (team): the backend route GET /api/passports/verify/:id does not
            // exist yet. Until it is implemented, this page will correctly report
            // "verification unavailable" instead of lying. Build that endpoint to
            // make the feature functional.
            const response = await apiCall(`/passports/verify/${encodeURIComponent(id.trim())}`, {
                method: 'GET'
            });

            if (response && response.success && response.verified) {
                // Render ONLY fields the server returned — not query/localStorage values.
                setVerificationResult(response);
                toast.success('Passport Authenticated Successfully!');
            } else {
                setError((response && response.message) || 'Passport not found. Please check the ID and try again.');
            }

        } catch (err) {
            console.error('Verification error:', err);
            if (err.status === 404) {
                setError('Passport not found. Please check the ID and try again.');
            } else {
                setError('Passport verification is currently unavailable. Please try again later.');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyPassport();
    };

    const pageContent = (
        <>
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
                        Passport <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a3884] to-[#2a4d9e] dark:from-[#C0C0C0] dark:to-[#A8A8A8]">Verification</span>
                    </h1>
                    <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
                        Verify the authenticity of a SMAART Institute Digital Skills Passport securely.
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
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                >
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">
                                            Skills Passport ID
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={passportId}
                                                onChange={(e) => setPassportId(e.target.value)}
                                                placeholder="e.g. SM-STU00006"
                                                className="w-full h-16 px-6 pl-14 rounded-2xl border-2 border-slate-100 dark:border-white/8 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/5 transition-all outline-none font-medium"
                                            />
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-[#1a3884] transition-colors" />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isVerifying || !passportId.trim()}
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
                            </div>
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
                                        <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-red-900 dark:text-white mb-2">Verification Failed</h3>
                                    <p className="text-red-700 dark:text-red-300 text-lg mb-6">{error}</p>
                                    <button
                                        onClick={() => { setError(null); setPassportId(''); }}
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
                                    <div className={`h-2 w-full ${verificationResult.verified ? 'bg-gradient-to-r from-[#1a3884] via-[#C0C0C0] to-[#1a3884]' : 'bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600'}`} />

                                    <div className="p-8 md:p-10">
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
                                                    {verificationResult.verified ? 'Passport Authentic' : 'Verification Issue'}
                                                </h2>
                                                <p className="text-gray-500 dark:text-slate-300 mt-1">
                                                    {verificationResult.message}
                                                </p>
                                            </div>
                                        </div>

                                        {verificationResult.verified && verificationResult.passport && (
                                            <div className="space-y-8">
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-slate-300 uppercase tracking-widest font-semibold">Student Name</label>
                                                        <div className="flex items-center gap-4 mt-3">
                                                            {verificationResult.passport.photo ? (
                                                                <img src={resolveMediaUrl(verificationResult.passport.photo)} alt={verificationResult.passport.fullName} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-white/10" />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                                                    <User className="w-6 h-6 text-slate-400" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-2xl font-bold text-[#1a3884] dark:text-[#C0C0C0] font-heading leading-tight">
                                                                    {verificationResult.passport.fullName}
                                                                </p>
                                                                <p className="text-sm text-gray-400 dark:text-slate-400 mt-0.5 font-mono">
                                                                    ID: {verificationResult.passport.studentId}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-slate-300 uppercase tracking-widest font-semibold">Institution</label>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                                            {verificationResult.passport.institution}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">{verificationResult.passport.status} Record</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                                                    <div className="text-xs text-gray-400 dark:text-slate-400 max-w-sm">
                                                        This digital passport is securely verified. Altering this result page is technically impossible.
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
                                        Enter a Skills Passport ID to instantly validate its authenticity.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>
        </>
    );

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

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-500 font-sans relative overflow-x-hidden">
            <Navbar showLinks={true} />
            {pageContent}
        </div>
    );
};

export default VerifyPassport;
