import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award, Calendar, User, Hash, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VerifyCertificate = () => {
    const { certificateId: urlCertId } = useParams();
    const navigate = useNavigate();
    const [certificateId, setCertificateId] = useState(urlCertId || '');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState(null);

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
            const response = await axios.get(`${API_URL}/api/certificates/verify/${certId.trim()}`);

            if (response.data.success) {
                setVerificationResult(response.data);
                if (response.data.verified) {
                    toast.success('Certificate verified successfully!');
                } else {
                    toast.warning(response.data.message);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            if (err.response?.status === 404) {
                setError('Certificate not found. Please check the certificate ID and try again.');
            } else {
                setError(err.response?.data?.message || 'Failed to verify certificate. Please try again.');
            }
            toast.error('Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyCertificate();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e8ecef] via-[#f5f7fa] to-[#e8ecef] dark:from-[#001229] dark:via-[#001a3d] dark:to-[#001229] py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#daa520] to-[#b8860b] flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <ShieldCheck className="w-10 h-10 text-[#002147]" />
                    </div>
                    <h1 className="text-4xl font-bold text-[#002147] dark:text-white mb-3 tracking-tight">
                        Certificate Verification
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Verify the authenticity of SMAART Institute certificates. Enter the certificate ID or scan the QR code.
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Certificate ID
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={certificateId}
                                    onChange={(e) => setCertificateId(e.target.value)}
                                    placeholder="e.g., SMAART-CAP-2025-ABC12"
                                    className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#30919D] focus:border-transparent transition-all"
                                />
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isVerifying || !certificateId.trim()}
                            className="w-full bg-gradient-to-r from-[#002147] to-[#0d1b2a] hover:from-[#0d1b2a] hover:to-[#002147] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Verify Certificate
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8">
                        <div className="flex items-start gap-4">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-1">
                                    Verification Failed
                                </h3>
                                <p className="text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Result */}
                {verificationResult && (
                    <div className={`rounded-2xl shadow-xl border p-8 ${verificationResult.verified
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}>
                        {/* Status Header */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-green-200 dark:border-green-800">
                            {verificationResult.verified ? (
                                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center">
                                    <AlertTriangle className="w-10 h-10 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className={`text-2xl font-bold ${verificationResult.verified
                                        ? 'text-green-900 dark:text-green-200'
                                        : 'text-yellow-900 dark:text-yellow-200'
                                    }`}>
                                    {verificationResult.verified ? 'Certificate Verified' : 'Certificate Invalid'}
                                </h2>
                                <p className={`${verificationResult.verified
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-yellow-700 dark:text-yellow-300'
                                    }`}>
                                    {verificationResult.message}
                                </p>
                            </div>
                        </div>

                        {/* Certificate Details */}
                        {verificationResult.verified && verificationResult.certificate && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Recipient</span>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {verificationResult.certificate.fullName}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            ID: {verificationResult.certificate.studentId}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Certificate Type</span>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {verificationResult.certificate.certificateTitle}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Issue Date</span>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {new Date(verificationResult.certificate.issueDate).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Readiness Band</span>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {verificationResult.certificate.readinessBand}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Hash className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Certificate Details</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Certificate ID:</span>
                                            <p className="font-mono font-bold text-slate-900 dark:text-white">
                                                {verificationResult.certificate.certificateId}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Assessment Window:</span>
                                            <p className="font-mono font-bold text-slate-900 dark:text-white">
                                                {verificationResult.certificate.assessmentWindow}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Issuing Authority:</span>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {verificationResult.certificate.issuingAuthority}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">Verification Count:</span>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {verificationResult.certificate.verificationCount} times
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Validated Skills */}
                                {verificationResult.certificate.validatedSkills && verificationResult.certificate.validatedSkills.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                                            Validated Skills
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-2">
                                            {verificationResult.certificate.validatedSkills.map((skill, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                                                    <span className="text-slate-900 dark:text-white">{skill.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Info Section */}
                {!verificationResult && !error && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-3">
                            How to Verify
                        </h3>
                        <ul className="space-y-2 text-blue-800 dark:text-blue-300">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>Enter the certificate ID found on the certificate document</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>Or scan the QR code on the certificate using your phone camera</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>Instant verification with complete certificate details</span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyCertificate;
