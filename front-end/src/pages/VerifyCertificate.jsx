import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award, Calendar, User, Hash, TrendingUp } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import apiCall from '@/services/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

const VerifyCertificate = () => {
    const { certificateId: urlCertId } = useParams();
    const navigate = useNavigate();
    const [certificateId, setCertificateId] = useState(urlCertId || '');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let scanner = null;
        if (isScanning) {
            scanner = new Html5QrcodeScanner('reader', {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            });

            scanner.render((decodedText) => {
                // Success callback
                try {
                    // Try to extract ID from URL if it's a URL
                    let certId = decodedText;
                    if (decodedText.includes('/verify-certificate/')) {
                        certId = decodedText.split('/verify-certificate/').pop();
                    } else if (decodedText.startsWith('http')) {
                        const url = new URL(decodedText);
                        const pathParts = url.pathname.split('/');
                        certId = pathParts[pathParts.length - 1];
                    }
                    
                    setCertificateId(certId);
                    setIsScanning(false);
                    scanner.clear();
                    verifyCertificate(certId);
                } catch (e) {
                    toast.error("Invalid QR code format");
                }
            }, (error) => {
                // Ignore errors during scan
            });
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error("Error clearing scanner", err));
            }
        };
    }, [isScanning]);

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
            const response = await apiCall(`/certificates/verify/${certId.trim()}`, {
                method: 'GET'
            });

            if (response.success) {
                setVerificationResult(response);
                if (response.verified) {
                    toast.success('Certificate verified successfully!');
                } else {
                    toast.warning(response.message);
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

    const toggleScanner = () => {
        setIsScanning(!isScanning);
        setVerificationResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardSidebar />
            
            <div className="min-h-screen transition-all duration-300">
                <DashboardHeader />

                <main className="container mx-auto px-3 py-4 max-w-6xl">
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#daa520] to-[#b8860b] flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <ShieldCheck className="w-7 h-7 text-[#002147]" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Certificate Verification</h1>
                                    <p className="text-sm text-gray-500">
                                        Verify the authenticity of SMAART Institute certificates
                                    </p>
                                </div>
                            </div>

                            {/* Verification Modes */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setIsScanning(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isScanning
                                        ? 'bg-[#002147] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Manual Entry
                                </button>
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isScanning
                                        ? 'bg-[#002147] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Scan QR Code
                                </button>
                            </div>
                        </div>
                    </motion.div>

                {/* QR Scanner Section */}
                {isScanning && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm text-center"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Scanner Ready</h3>
                        <div id="reader" className="mx-auto rounded-xl overflow-hidden max-w-sm border-2 border-dashed border-[#30919D]/30"></div>
                        <p className="mt-4 text-sm text-gray-500 font-medium">
                            Position the certificate's QR code within the square to scan automatically
                        </p>
                    </motion.div>
                )}

                {/* Search Form */}
                {!isScanning && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm"
                    >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Certificate ID
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={certificateId}
                                    onChange={(e) => setCertificateId(e.target.value)}
                                    placeholder="e.g., SMAART-CAP-2025-ABC12"
                                    className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#30919D] focus:border-transparent transition-all"
                                />
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isVerifying || !certificateId.trim()}
                            className="w-full bg-gradient-to-r from-[#002147] to-[#30919D] hover:from-[#30919D] hover:to-[#002147] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    </motion.div>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4 shadow-sm"
                    >
                        <div className="flex items-start gap-4">
                            <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-bold text-red-900 mb-1">
                                    Verification Failed
                                </h3>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Verification Result */}
                {verificationResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border p-6 mb-4 shadow-sm ${verificationResult.verified
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                    >
                        {/* Status Header */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-green-200">
                            {verificationResult.verified ? (
                                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-yellow-500 flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className={`text-xl font-bold ${verificationResult.verified
                                        ? 'text-green-900'
                                        : 'text-yellow-900'
                                    }`}>
                                    {verificationResult.verified ? 'Certificate Verified' : 'Certificate Invalid'}
                                </h2>
                                <p className={`text-sm ${verificationResult.verified
                                        ? 'text-green-700'
                                        : 'text-yellow-700'
                                    }`}>
                                    {verificationResult.message}
                                </p>
                            </div>
                        </div>

                        {/* Certificate Details */}
                        {verificationResult.verified && verificationResult.certificate && (
                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl p-4 border border-green-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <User className="w-5 h-5 text-green-600" />
                                            <span className="text-sm font-semibold text-gray-600">Recipient</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {verificationResult.certificate.fullName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            ID: {verificationResult.certificate.studentId}
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-xl p-4 border border-green-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Award className="w-5 h-5 text-green-600" />
                                            <span className="text-sm font-semibold text-gray-600">Certificate Type</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {verificationResult.certificate.certificateTitle}
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-xl p-4 border border-green-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-5 h-5 text-green-600" />
                                            <span className="text-sm font-semibold text-gray-600">Issue Date</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {new Date(verificationResult.certificate.issueDate).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-xl p-4 border border-green-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            <span className="text-sm font-semibold text-gray-600">Readiness Band</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {verificationResult.certificate.readinessBand}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="bg-white rounded-xl p-4 border border-green-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Hash className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-semibold text-gray-600">Certificate Details</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Certificate ID:</span>
                                            <p className="font-mono font-bold text-gray-900">
                                                {verificationResult.certificate.certificateId}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Assessment Window:</span>
                                            <p className="font-mono font-bold text-gray-900">
                                                {verificationResult.certificate.assessmentWindow}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Issuing Authority:</span>
                                            <p className="font-bold text-gray-900">
                                                {verificationResult.certificate.issuingAuthority}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Verification Count:</span>
                                            <p className="font-bold text-gray-900">
                                                {verificationResult.certificate.verificationCount} times
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Validated Skills */}
                                {verificationResult.certificate.validatedSkills && verificationResult.certificate.validatedSkills.length > 0 && (
                                    <div className="bg-white rounded-xl p-4 border border-green-200">
                                        <h3 className="text-sm font-semibold text-gray-600 mb-3">
                                            Validated Skills
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-2">
                                            {verificationResult.certificate.validatedSkills.map((skill, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                                    <span className="text-gray-900">{skill.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Info Section */}
                {!verificationResult && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm"
                    >
                        <h3 className="text-lg font-bold text-blue-900 mb-3">
                            How to Verify
                        </h3>
                        <ul className="space-y-2 text-blue-800">
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
                    </motion.div>
                )}
                </main>
            </div>
        </div>
    );
};

export default VerifyCertificate;
