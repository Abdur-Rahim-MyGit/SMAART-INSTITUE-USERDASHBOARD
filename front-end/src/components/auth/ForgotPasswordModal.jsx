import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, KeyRound, CheckCircle, Eye, EyeOff, Info, CheckCircle2, Building2, Search, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_BASE_URL, apiCall } from "@/services/api";
import logoWhite from "@/assets/white.png";
import blueLogo from "@/assets/blue.png";

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
            setEmail("");
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
    }, [isOpen]);

    // Resend cooldown countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (collegeSearch.trim() && (!selectedCollege || collegeSearch !== selectedCollege.name)) {
                fetchColleges(collegeSearch);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [collegeSearch]);

    const fetchColleges = async (search) => {
        setIsSearchingColleges(true);
        try {
            const data = await apiCall(`/colleges?search=${encodeURIComponent(search)}&limit=5`);
            if (data.success) {
                setColleges(data.data || []);
                setShowCollegeDropdown(true);
            }
        } catch (error) {
            console.error("Colleges fetch error:", error);
        } finally {
            setIsSearchingColleges(false);
        }
    };

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
                setResendCooldown(60); // 60-second cooldown before resend
                setStep(2);
            }
        } catch (error) {
            console.error("Forgot password detail error:", error);
            toast.error(error.message || "An error occurred");
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
                setResendCooldown(60);
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
                    className="relative w-full max-w-[420px] bg-[#002147] overflow-visible my-8"
                    style={{
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
                        borderRadius: "24px",
                        overflow: "visible",
                    }}
                >
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors z-30"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="bg-[#00152e]/40 px-8 pt-8 pb-6 flex flex-col items-center justify-center border-b border-white/5 relative rounded-t-[24px]">
                            <div className="relative mb-3 z-10 p-3 bg-[#002A5C] rounded-2xl shadow-sm border border-white/10 w-14 h-14 flex items-center justify-center">
                                <KeyRound className="w-6 h-6 text-[#1a3884]" />
                            </div>
                            <h2 className="text-white text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-90 pt-3 px-6 text-center z-10">
                                {step === 4 ? "Success!" : step === 3 ? "Reset Password" : step === 2 ? "Enter OTP" : "Forgot Password"}
                            </h2>
                            {/* Step progress dots */}
                            {step < 4 && (
                                <div className="flex items-center gap-2 mt-4">
                                    {[1, 2, 3].map((s) => (
                                        <div
                                            key={s}
                                            className="transition-all duration-300"
                                            style={{
                                                width: step === s ? "20px" : "6px",
                                                height: "6px",
                                                borderRadius: "999px",
                                                background: step >= s ? "#1a3884" : "rgba(255,255,255,0.1)",
                                            }}
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
                                    <div className="bg-white/5 p-4 rounded-2xl flex items-start gap-3 border border-white/10 shadow-sm">
                                        <div className="bg-white/5 p-2 rounded-xl shadow-sm border border-white/10 flex-shrink-0">
                                            <Mail className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[13px] text-blue-100 leading-tight font-bold">Verification Needed</p>
                                            <p className="text-[11px] text-slate-400 leading-normal font-medium">
                                                Enter your registered email address to receive a 6-digit verification code.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        {/* College Selection */}
                                        <div className="space-y-1.5 relative">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Institution</label>
                                            <div 
                                                className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#002A5C] border border-white/10"
                                                onFocusCapture={(e) => {
                                                    e.currentTarget.style.border = "1.5px solid #1a3884";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.2)";
                                                }}
                                                onBlurCapture={(e) => {
                                                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shadow-sm border border-white/10 group-focus-within:border-[#1a3884]/30 transition-all">
                                                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={collegeSearch}
                                                    onChange={(e) => {
                                                        setCollegeSearch(e.target.value);
                                                        if (selectedCollege && e.target.value !== selectedCollege.name) {
                                                            setSelectedCollege(null);
                                                        }
                                                    }}
                                                    placeholder="Search University/College..."
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-slate-500 text-white"
                                                />
                                                {isSearchingColleges && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-[#1a3884]" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dropdown for colleges */}
                                            {showCollegeDropdown && colleges.length > 0 && !selectedCollege && (
                                                <div className="absolute top-full left-0 right-0 z-[100] bg-[#002A5C] border border-white/10 shadow-2xl rounded-xl max-h-48 overflow-y-auto mt-1 custom-scrollbar overflow-hidden">
                                                    {colleges.map((college, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedCollege({
                                                                    name: college.collegeName,
                                                                    code: college.collegeCode
                                                                });
                                                                setCollegeSearch(college.collegeName);
                                                                setShowCollegeDropdown(false);
                                                            }}
                                                            className="p-3 text-sm hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors"
                                                        >
                                                            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-blue-400">
                                                                <Building2 className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="truncate font-semibold text-white">{college.collegeName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
                                            <div 
                                                className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#002A5C] border border-white/10"
                                                onFocusCapture={(e) => {
                                                    e.currentTarget.style.border = "1.5px solid #1a3884";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.2)";
                                                }}
                                                onBlurCapture={(e) => {
                                                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shadow-sm border border-white/10 group-focus-within:border-[#1a3884]/30 transition-all">
                                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-slate-500 text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRequestReset}
                                        disabled={isLoading || !email || !selectedCollege}
                                        className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-black/20 mt-6 disabled:opacity-50 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                                        style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
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
                                    <div className="text-center py-2">
                                        <p className="text-[13px] text-slate-400 mb-6">
                                            We've sent a code to <br/><span className="font-bold text-blue-100 text-[15px]">{email}</span>
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
                                                    className="w-10 h-14 text-center text-xl font-bold bg-[#002A5C] border border-white/10 rounded-xl focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 focus:bg-[#002A5C] outline-none transition-all shadow-sm text-white"
                                                />
                                            ))}
                                        </div>
                                        {/* Resend OTP */}
                                        <div className="mt-5 flex items-center justify-center gap-1.5">
                                            <span className="text-[12px] text-slate-500">Didn't receive it?</span>
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || isLoading}
                                                className="text-[12px] font-bold text-blue-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleVerifyOtp}
                                        disabled={otp.join("").length !== 6}
                                        className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-black/20 mt-2 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                                        style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
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
                                    className="space-y-4"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                            <div 
                                                className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#002A5C] border border-white/10"
                                                onFocusCapture={(e) => {
                                                    e.currentTarget.style.border = "1.5px solid #1a3884";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.2)";
                                                }}
                                                onBlurCapture={(e) => {
                                                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shadow-sm border border-white/10 group-focus-within:border-[#1a3884]/30 transition-all">
                                                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-slate-500 text-white"
                                                    placeholder="Enter new password"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] p-1">
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                            <div 
                                                className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#002A5C] border border-white/10"
                                                onFocusCapture={(e) => {
                                                    e.currentTarget.style.border = "1.5px solid #1a3884";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.2)";
                                                }}
                                                onBlurCapture={(e) => {
                                                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                                                    e.currentTarget.style.background = "#002A5C";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shadow-sm border border-white/10 group-focus-within:border-[#1a3884]/30 transition-all">
                                                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                                                </div>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-slate-500 text-white"
                                                    placeholder="Confirm new password"
                                                />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] p-1">
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 border-y border-white/5 mt-2">
                                            <RequirementItem label="Min 8 characters" met={passwordChecks.length} />
                                            <RequirementItem label="At least 1 number" met={passwordChecks.number} />
                                            <RequirementItem label="Uppercase letter" met={passwordChecks.uppercase} />
                                            <RequirementItem label="Special character" met={passwordChecks.special} />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isLoading || !Object.values(passwordChecks).every(Boolean)}
                                            className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-black/20 mt-6 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                                            style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                                        </Button>
                                    </div>
                                </motion.form>
                            )}

                            {step === 4 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-sm relative">
                                        <div className="absolute inset-0 bg-[#1a3884]/20 rounded-full animate-ping opacity-20" />
                                        <CheckCircle className="w-10 h-10 text-blue-400 relative z-10" />
                                    </div>
                                    <h3 className="text-[20px] font-extrabold text-white mb-2">Reset Successful</h3>
                                    <p className="text-[13px] text-slate-400 mb-8 px-4 leading-relaxed">
                                        Your security credentials have been updated. You can now access your account with the new password.
                                    </p>
                                    <Button
                                        onClick={onClose}
                                        className="w-full h-12 rounded-xl text-sm font-bold transition-all shadow-lg shadow-black/20 text-white hover:-translate-y-1 active:translate-y-0"
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
    <div className="flex items-center gap-1.5">
      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-[#1a3884]' : 'bg-white/5 border border-white/10'}`}>
        <CheckCircle2 className={`w-3 h-3 ${met ? 'text-white' : 'text-slate-500'}`} />
      </div>
      <span className={`text-[11px] ${met ? 'text-white font-medium' : 'text-slate-400'}`}>{label}</span>
    </div>
  );

export default ForgotPasswordModal;
