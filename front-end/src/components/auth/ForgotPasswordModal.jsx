import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, KeyRound, CheckCircle, Eye, EyeOff, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_BASE_URL, apiCall } from "@/services/api";
import logoWhite from "@/assets/white.png";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: success
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            const storedInstitution = sessionStorage.getItem("selectedInstitution");
            let collegeCode = null;
            if (storedInstitution) {
                try {
                    const institution = JSON.parse(storedInstitution);
                    collegeCode = institution.code || institution.name;
                } catch (e) {}
            }

            const data = await apiCall('/auth/forgot-password', {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    collegeCode: collegeCode
                }),
            });

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

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            toast.error("Password does not meet complexity requirements");
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

    const passwordChecks = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        match: newPassword === confirmPassword && confirmPassword.length > 0
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-[500px] bg-[#FDFBF7] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden p-6 md:p-8"
                >
                    {/* Vintage Border Layer */}
                    <div className="absolute inset-4 md:inset-6 border-t-[1.5px] border-x-[1.5px] border-[#BC9B6A] rounded-t-2xl pointer-events-none">
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#BC9B6A] rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#BC9B6A] rounded-tr-lg" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute -top-2 -right-2 text-gray-400 hover:text-[#BC9B6A] transition-colors z-20"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Header */}
                        {/* Header */}
                        <div className="bg-[#002B5B] mx-[-32px] mt-[-32px] mb-4 p-6 shadow-lg flex flex-col items-center justify-center rounded-t-3xl border-b border-[#BC9B6A]/30">
                            <img src={logoWhite} alt="Smaart Institute" className="h-16 w-auto mb-2" />
                            <h2 className="text-white text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-80">
                                {step === 4 ? "Success!" : step === 3 ? "Reset Password" : step === 2 ? "Enter Code" : "Forgot Password"}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="mt-2">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-gray-50/80 p-3 rounded-2xl flex items-start gap-3 border border-gray-100">
                                        <div className="bg-[#002B5B] p-1.5 rounded-full">
                                            <Mail className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed font-sans">
                                            Enter your email address to receive a recovery code.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your registered email"
                                                className="bg-[#F1F3F4] focus:bg-white border-gray-200 focus:border-[#BC9B6A] h-11 rounded-xl transition-all"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRequestReset}
                                        disabled={isLoading || !email}
                                        className="w-full bg-[#006064] hover:bg-[#004D4F] text-white h-11 rounded-xl text-base font-bold transition-all shadow-lg mt-2"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Code"}
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-3">
                                            Code sent to <span className="font-bold text-[#002B5B]">{email}</span>
                                        </p>
                                        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
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
                                                    className="w-10 h-12 text-center text-lg font-bold bg-[#F1F3F4] border-gray-200 rounded-xl focus:border-[#BC9B6A] outline-none"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setStep(3)}
                                        disabled={otp.join("").length !== 6}
                                        className="w-full bg-[#006064] hover:bg-[#004D4F] text-white h-11 rounded-xl text-base font-bold transition-all shadow-lg active:scale-[0.98]"
                                    >
                                        Verify & Continue
                                    </Button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.form
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onSubmit={handleResetPassword}
                                    className="space-y-3"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">New Password</label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="bg-[#F1F3F4] focus:bg-white border-gray-200 focus:border-[#BC9B6A] h-11 rounded-xl transition-all"
                                                placeholder="Minimum 8 characters"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BC9B6A]">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="bg-[#F1F3F4] focus:bg-white border-gray-200 focus:border-[#BC9B6A] h-11 rounded-xl transition-all"
                                                placeholder="Confirm new password"
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BC9B6A]">
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
                                        <RequirementItem label="8+ chars" met={passwordChecks.length} />
                                        <RequirementItem label="Number" met={passwordChecks.number} />
                                        <RequirementItem label="Uppercase" met={passwordChecks.uppercase} />
                                        <RequirementItem label="Special char" met={passwordChecks.special} />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || !Object.values(passwordChecks).every(Boolean)}
                                        className="w-full bg-[#006064] hover:bg-[#004D4F] text-white h-11 rounded-xl text-base font-bold transition-all shadow-lg mt-2"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                                    </Button>
                                </motion.form>
                            )}

                            {step === 4 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-2"
                                >
                                    <div className="w-16 h-16 bg-[#006064]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-10 h-10 text-[#006064]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Reset Successful</h3>
                                    <p className="text-sm text-gray-600 mb-6 px-4">You can now use your new password to sign in.</p>
                                    <Button
                                        onClick={onClose}
                                        className="w-full bg-[#002B5B] hover:bg-[#001D3D] text-white h-11 rounded-xl text-base font-bold transition-all shadow-lg"
                                    >
                                        Return to Login
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const RequirementItem = ({ label, met }) => (
    <div className="flex items-center gap-2">
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${met ? 'bg-[#006064]' : 'bg-gray-200'}`}>
        <CheckCircle2 className={`w-3.5 h-3.5 ${met ? 'text-white' : 'text-gray-400'}`} />
      </div>
      <span className={`text-[12px] ${met ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
    </div>
  );

export default ForgotPasswordModal;
