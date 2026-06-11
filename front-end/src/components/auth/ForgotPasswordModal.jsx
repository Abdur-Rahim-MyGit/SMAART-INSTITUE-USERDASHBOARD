import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, KeyRound, CheckCircle, Eye, EyeOff, Info, CheckCircle2, Building2, Search, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_BASE_URL, apiCall } from "@/services/api";
import logoWhite from "@/assets/white.png";
import blueLogo from "@/assets/blue.png";

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail }) => {
    const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: success
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [collegeSearch, setCollegeSearch] = useState("");
    const [colleges, setColleges] = useState([]);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [isSearchingColleges, setIsSearchingColleges] = useState(false);
    const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining before can resend
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setEmail(initialEmail || "");
            setResetToken("");
            setOtp(["", "", "", "", "", ""]);
            setNewPassword("");
            setConfirmPassword("");
            setResendCooldown(0);
            
            // Try to pre-fill from session if available
            const stored = sessionStorage.getItem("selectedInstitution");
            if (stored) {
                try {
                    const inst = JSON.parse(stored);
                    setSelectedCollege(inst);
                    setCollegeSearch(inst.name);
                } catch (e) {}
            }
        }
    }, [isOpen, initialEmail]);

    // Resend cooldown countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);



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

        if (!selectedCollege) {
            toast.error("Please select your institution");
            return;
        }

        setIsLoading(true);
        try {
            const data = await apiCall('/auth/forgot-password', {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    collegeCode: selectedCollege.code || selectedCollege.name
                }),
            });

            if (data.wrongCollege) {
                toast.error("Email not found in the selected institution. Please check your details.");
            } else {
                toast.success("Reset code sent to your email");
                setResetToken(data.resetToken);
                setResendCooldown(20); // 20-second cooldown before resend
                setStep(2);
            }
        } catch (error) {
            console.error("Forgot password detail error:", error);
            // Check if the error response has the isFirstTimeUser flag
            if (error.data?.isFirstTimeUser) {
                toast.error("You haven't set up your account yet. Please log in with the default password provided by your institution first.", { duration: 6000 });
            } else {
                toast.error(error.message || "An error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP (server-side)
    const handleVerifyOtp = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            toast.error("Please enter the complete 6-digit code");
            return;
        }
        
        setIsLoading(true);
        try {
            const data = await apiCall('/auth/verify-reset-otp', {
                method: "POST",
                body: JSON.stringify({
                    resetToken,
                    otp: otpString,
                }),
            });

            if (data.success) {
                setStep(3);
            } else {
                toast.error(data.message || "Invalid OTP");
            }
        } catch (error) {
            console.error("Verify OTP error detail:", error);
            toast.error(error.message || "Invalid OTP or an error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        try {
            const data = await apiCall('/auth/forgot-password', {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    collegeCode: selectedCollege?.code || selectedCollege?.name
                }),
            });
            if (data.resetToken) {
                setResetToken(data.resetToken);
                setOtp(["", "", "", "", "", ""]);
                setResendCooldown(20); // 20-second cooldown before resend
                toast.success("New code sent to your email!");
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }
        } catch (error) {
            toast.error(error.message || "Failed to resend code");
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
                className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-[420px] bg-white dark:bg-[#002A5C] border border-black/5 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.1),_0_1px_3px_rgba(0,0,0,0.05)] rounded-[24px] overflow-visible my-8"
                >
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors z-30"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="bg-[#F8FAFC] dark:bg-[#00152e]/40 px-8 pt-8 pb-6 flex flex-col items-center justify-center border-b border-gray-100 dark:border-white/5 relative rounded-t-[24px]">
                            <div className="relative mb-3 z-10 p-3 bg-white dark:bg-[#002A5C] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 w-14 h-14 flex items-center justify-center">
                                <KeyRound className="w-6 h-6 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <h2 className="text-[#112b6b] dark:text-white text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-90 pt-3 px-6 text-center z-10">
                                {step === 4 ? "Success!" : step === 3 ? "Reset Password" : step === 2 ? "Enter OTP" : "Forgot Password"}
                            </h2>
                            {/* Step progress dots */}
                            {step < 4 && (
                                <div className="flex items-center gap-2 mt-4">
                                    {[1, 2, 3].map((s) => (
                                        <div
                                            key={s}
                                            className={`transition-all duration-300 h-1.5 rounded-full ${
                                                step === s ? "w-5" : "w-1.5"
                                            } ${
                                                step >= s ? "bg-[#1a3884] dark:bg-blue-400" : "bg-gray-200 dark:bg-white/10"
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content — scrollable on mobile */}
                        <div className="px-8 py-8 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-[#F8FAFC] dark:bg-white/5 p-4 rounded-2xl flex items-start gap-3 border border-gray-100 dark:border-white/10 shadow-sm">
                                        <div className="bg-white dark:bg-white/5 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex-shrink-0">
                                            <Mail className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[13px] text-[#112b6b] dark:text-blue-100 leading-tight font-bold">Verification Needed</p>
                                            <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-normal font-medium">
                                                Confirm your details below to receive a 6-digit verification code.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        {/* College Selection */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Your Institution</label>
                                            <div className="relative flex items-center gap-2.5 px-3.5 rounded-xl h-11 bg-gray-100/60 dark:bg-[#001D3D]/60 border border-gray-200 dark:border-white/5 cursor-not-allowed">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                                    <Building2 className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={collegeSearch}
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold text-gray-500 dark:text-slate-300 cursor-not-allowed"
                                                />
                                                <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                            </div>
                                        </div>

                                        {/* Account Email */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
                                            <div className="relative flex items-center gap-2.5 px-3.5 rounded-xl h-11 bg-gray-100/60 dark:bg-[#001D3D]/60 border border-gray-200 dark:border-white/5 cursor-not-allowed">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                                    <Mail className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    readOnly
                                                    value={email}
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold text-gray-500 dark:text-slate-300 cursor-not-allowed"
                                                />
                                                <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRequestReset}
                                        disabled={isLoading || !email || !selectedCollege}
                                        className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-black/10 mt-6 disabled:opacity-50 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                                        style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Code"}
                                    </Button>

                                    <div className="text-center mt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="text-[12px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="text-center py-2">
                                        <p className="text-[13px] text-gray-500 dark:text-slate-400 mb-6">
                                            We've sent a code to <br/><span className="font-bold text-[#112b6b] dark:text-blue-100 text-[15px]">{email}</span>
                                        </p>
                                        <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
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
                                                    className="w-10 h-14 text-center text-xl font-bold bg-[#F8FAFC] dark:bg-[#002A5C] border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#1a3884] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:ring-blue-500/20 outline-none transition-all shadow-sm text-[#112b6b] dark:text-white"
                                                />
                                            ))}
                                        </div>
                                        {/* Resend OTP */}
                                        <div className="mt-5 flex items-center justify-center gap-1.5">
                                            <span className="text-[12px] text-gray-400">Didn't receive it?</span>
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || isLoading}
                                                className="text-[12px] font-bold text-[#1a3884] dark:text-blue-400 disabled:text-gray-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleVerifyOtp}
                                        disabled={otp.join("").length !== 6}
                                        className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-black/10 mt-2 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                                        style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                                    >
                                        Verify & Continue
                                    </Button>

                                    <div className="text-center mt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="text-[12px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.form
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onSubmit={handleResetPassword}
                                    className="space-y-4"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                            <div className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group relative overflow-hidden border border-gray-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#002A5C] focus-within:border-[#1a3884] dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-[#003366] focus-within:ring-4 focus-within:ring-[#1a3884]/10 dark:focus-within:ring-blue-400/20">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10 group-focus-within:border-[#1a3884]/30 dark:group-focus-within:border-blue-400/30 transition-all">
                                                    <Lock className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400" />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b] dark:text-white"
                                                    placeholder="Enter new password"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] dark:hover:text-blue-400 p-1">
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                            <div className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group relative overflow-hidden border border-gray-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#002A5C] focus-within:border-[#1a3884] dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-[#003366] focus-within:ring-4 focus-within:ring-[#1a3884]/10 dark:focus-within:ring-blue-400/20">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/10 group-focus-within:border-[#1a3884]/30 dark:group-focus-within:border-blue-400/30 transition-all">
                                                    <Lock className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400" />
                                                </div>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b] dark:text-white"
                                                    placeholder="Confirm new password"
                                                />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] dark:hover:text-blue-400 p-1">
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 border-y border-gray-100 dark:border-white/5 mt-2">
                                            <RequirementItem label="Min 8 characters" met={passwordChecks.length} />
                                            <RequirementItem label="At least 1 number" met={passwordChecks.number} />
                                            <RequirementItem label="Uppercase letter" met={passwordChecks.uppercase} />
                                            <RequirementItem label="Lowercase letter" met={passwordChecks.lowercase} />
                                            <RequirementItem label="Special character" met={passwordChecks.special} />
                                            <RequirementItem label="Passwords match" met={passwordChecks.match} />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isLoading || !Object.values(passwordChecks).every(Boolean)}
                                            className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-black/10 mt-6 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                                            style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                                        </Button>

                                        <div className="text-center mt-4">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="text-[12px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                                            >
                                                Back to Login
                                            </button>
                                        </div>
                                    </div>
                                </motion.form>
                            )}

                            {step === 4 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-white/10 shadow-sm relative">
                                        <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping opacity-25" />
                                        <CheckCircle className="w-10 h-10 text-[#1a3884] dark:text-blue-400 relative z-10" />
                                    </div>
                                    <h3 className="text-[20px] font-extrabold text-[#112b6b] dark:text-white mb-2">Reset Successful</h3>
                                    <p className="text-[13px] text-gray-500 dark:text-slate-400 mb-8 px-4 leading-relaxed">
                                        Your security credentials have been updated. You can now access your account with the new password.
                                    </p>
                                    <Button
                                        onClick={onClose}
                                        className="w-full h-12 rounded-xl text-sm font-bold transition-all shadow-lg shadow-black/10 text-white hover:-translate-y-1 active:translate-y-0"
                                        style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
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
      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all ${met ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10'}`}>
        <CheckCircle2 className={`w-3 h-3 ${met ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`} />
      </div>
      <span className={`text-[11px] transition-colors duration-200 ${met ? 'text-gray-900 dark:text-slate-200 font-semibold' : 'text-gray-400 dark:text-slate-400'}`}>{label}</span>
    </div>
  );

export default ForgotPasswordModal;
