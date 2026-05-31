import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Loader2, ShieldCheck } from 'lucide-react';
import resumeApi from '@/services/resumeApi';

const VerifyResume = () => {
    const { resumeId = '' } = useParams();
    const [searchParams] = useSearchParams();
    const expectedHash = (searchParams.get('h') || '').trim();

    const [loading, setLoading] = useState(true);
    const [verification, setVerification] = useState({
        status: 'loading',
        title: 'Verifying resume…',
        message: 'Checking SMAART Institute records.',
        record: null,
    });

    useEffect(() => {
        let cancelled = false;

        const runVerification = async () => {
            if (!resumeId) {
                setVerification({
                    status: 'missing',
                    title: 'Resume ID required',
                    message: 'Use a valid SMAART verification link or scan the QR code on the PDF.',
                    record: null,
                });
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await resumeApi.verifyResume(resumeId, expectedHash);
                if (cancelled) return;

                if (response?.verified && response?.data) {
                    setVerification({
                        status: 'verified',
                        title: 'Verified SMAART resume',
                        message: response.message || 'This resume is registered with SMAART Institute.',
                        record: response.data,
                    });
                } else {
                    setVerification({
                        status: 'unknown',
                        title: 'Could not verify',
                        message: response?.message || 'No matching verification record was found.',
                        record: response?.data || null,
                    });
                }
            } catch (error) {
                if (cancelled) return;
                const message = error.message || 'Verification lookup failed';
                const isMismatch = message.toLowerCase().includes('fingerprint');

                setVerification({
                    status: isMismatch ? 'mismatch' : 'unknown',
                    title: isMismatch ? 'Verification mismatch' : 'Resume not verified',
                    message,
                    record: null,
                });
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        runVerification();
        return () => {
            cancelled = true;
        };
    }, [resumeId, expectedHash]);

    const isVerified = verification.status === 'verified';
    const Icon = loading ? Loader2 : isVerified ? CheckCircle2 : AlertTriangle;

    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                loading
                                    ? 'bg-slate-500/15 text-slate-300'
                                    : isVerified
                                      ? 'bg-emerald-500/15 text-emerald-300'
                                      : 'bg-amber-500/15 text-amber-300'
                            }`}
                        >
                            <Icon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">
                                SMAART Institute
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                {verification.title}
                            </h1>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-bold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Home
                    </Link>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    <div
                        className={`rounded-2xl border p-5 ${
                            isVerified
                                ? 'border-emerald-400/30 bg-emerald-400/10'
                                : 'border-amber-400/30 bg-amber-400/10'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <ShieldCheck
                                className={`w-5 h-5 mt-0.5 shrink-0 ${
                                    isVerified ? 'text-emerald-300' : 'text-amber-300'
                                }`}
                            />
                            <p className="text-sm leading-6 text-slate-100">{verification.message}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">
                                Resume ID
                            </p>
                            <p className="mt-2 font-black text-xl break-all">{resumeId || 'Not provided'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">
                                Fingerprint
                            </p>
                            <p className="mt-2 font-black text-xl break-all">
                                {expectedHash ||
                                    verification.record?.fingerprint ||
                                    'Unavailable'}
                            </p>
                        </div>
                    </div>

                    {verification.record && (
                        <section className="rounded-2xl bg-white text-slate-950 p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-blue-700" />
                                <h2 className="font-black text-lg">Issued resume details</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                                        Holder
                                    </p>
                                    <p className="font-bold">{verification.record.holderName}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                                        Target role
                                    </p>
                                    <p className="font-bold">
                                        {verification.record.targetRole || 'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                                        Issued
                                    </p>
                                    <p className="font-bold">
                                        {verification.record.issuedAt
                                            ? new Date(verification.record.issuedAt).toLocaleString()
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">
                                        Organization
                                    </p>
                                    <p className="font-bold">
                                        {verification.record.organization || 'SMAART Institute'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
};

export default VerifyResume;
