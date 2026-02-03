import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, KeyRound, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_BASE_URL, apiCall } from "@/services/api";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: success
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setEmail("");
            setResetToken("");
            setOtp(["", "", "", "", "", ""]);
            setNewPassword("");
            setConfirmPassword("");
        }
    }, [isOpen]);

    useEffect(() => {
        if (step === 2 && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [step]);

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split("").forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    };

    // Step 1: Request reset
    const handleRequestReset = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Please enter your email");
            return;
        }

        setIsLoading(true);
        try {
            // Get selected institution from session for college context validation
            const storedInstitution = sessionStorage.getItem("selectedInstitution");
            let collegeCode = null;
            if (storedInstitution) {
                try {
                    const institution = JSON.parse(storedInstitution);
                    collegeCode = institution.code || institution.name;
                } catch (e) {
                    // Ignore parse errors
                }
            }

            const data = await apiCall('/auth/forgot-password', {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    collegeCode: collegeCode // SECURITY FIX: Include college context
                }),
            });

            // Check if this might be a wrong college scenario
            if (data.wrongCollege) {
                toast.error("Invalid user");
            } else {
                toast.success("Reset code sent to your email");
                setResetToken(data.resetToken);
                setStep(2);
            }
        } catch (error) {
            console.error("Forgot password detail error:", error);
            toast.error(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2 & 3: Verify OTP and reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const otpString = otp.join("");

        if (otpString.length !== 6) {
            toast.error("Please enter the complete 6-digit code");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const data = await apiCall('/auth/reset-password', {
                method: "POST",
                body: JSON.stringify({
                    resetToken,
                    otp: otpString,
                    newPassword,
                }),
            });

            if (data.success) {
                setStep(4);
                toast.success("Password reset successful!");
            }
        } catch (error) {
            console.error("Reset password error detail:", error);
            toast.error(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-navy border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* Header */}
                        <div className="p-8 pb-0 text-center relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="w-16 h-16 bg-gradient-to-br from-teal/20 to-teal/5 rounded-2xl border border-teal/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal/10">
                                {step === 4 ? (
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                ) : step === 3 ? (
                                    <KeyRound className="w-8 h-8 text-teal" />
                                ) : (
                                    <Mail className="w-8 h-8 text-teal" />
                                )}
                            </div>
                            <h2 className="text-3xl font-display font-bold text-white mb-2">
                                {step === 4
                                    ? "Password Reset!"
                                    : step === 3
                                        ? "New Password"
                                        : step === 2
                                            ? "Enter Code"
                                            : "Forgot Password"}
                            </h2>
                            <p className="text-white/50">
                                {step === 4
                                    ? "You can now login with your new password"
                                    : step === 3
                                        ? "Create a new secure password"
                                        : step === 2
                                            ? (
                                                <>
                                                    Enter the code sent to<br />
                                                    <span className="text-teal font-medium">{email}</span>
                                                </>
                                            )
                                            : "Enter your email to receive a reset code"}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {/* Step 1: Email */}
                            {step === 1 && (
                                <form onSubmit={handleRequestReset} className="space-y-6">
                                    <div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal focus:ring-2 focus:ring-teal/30 transition-all outline-none"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-bold py-6 rounded-xl"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Send Reset Code <ArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            )}

                            {/* Step 2: OTP Input */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (inputRefs.current[index] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/20 rounded-xl text-white focus:border-teal focus:ring-2 focus:ring-teal/30 transition-all outline-none"
                                            />
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => setStep(3)}
                                        className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-bold py-6 rounded-xl"
                                        disabled={otp.join("").length !== 6}
                                    >
                                        <span className="flex items-center gap-2">
                                            Continue <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </Button>
                                </div>
                            )}

                            {/* Step 3: New Password */}
                            {step === 3 && (
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="New password"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal focus:ring-2 focus:ring-teal/30 transition-all outline-none pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal focus:ring-2 focus:ring-teal/30 transition-all outline-none"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-bold py-6 rounded-xl"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Reset Password <KeyRound className="w-4 h-4" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            )}

                            {/* Step 4: Success */}
                            {step === 4 && (
                                <div className="text-center">
                                    <Button
                                        onClick={onClose}
                                        className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-bold py-6 rounded-xl"
                                    >
                                        <span className="flex items-center gap-2">
                                            Back to Login <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </Button>
                                </div>
                            )}

                            {step < 4 && (
                                <p className="mt-6 text-center text-white/30 text-xs">
                                    {step === 1
                                        ? "We'll send you a 6-digit code"
                                        : "Code expires in 5 minutes"}
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ForgotPasswordModal;
