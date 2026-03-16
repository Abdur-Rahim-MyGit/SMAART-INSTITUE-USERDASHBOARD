import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, KeyRound, CheckCircle, Eye, EyeOff, Info, CheckCircle2, Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    const [collegeSearch, setCollegeSearch] = useState("");
    const [colleges, setColleges] = useState([]);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [isSearchingColleges, setIsSearchingColleges] = useState(false);
    const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setEmail("");
            setResetToken("");
            setOtp(["", "", "", "", "", ""]);
            setNewPassword("");
            setConfirmPassword("");
            
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
                    className="relative w-full max-w-[420px] bg-[#FDFBF7] border-2 border-[#BC9B6A] rounded-none shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                    {/* Vintage Decorative Border */}
                    <div className="absolute inset-2 border border-[#BC9B6A]/20 pointer-events-none rounded-none" />
                    <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#BC9B6A]/40 pointer-events-none" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#BC9B6A]/40 pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#BC9B6A]/40 pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#BC9B6A]/40 pointer-events-none" />


                    <div className="relative z-10 flex flex-col h-full">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors z-30"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="bg-[#002B5B] p-8 shadow-xl flex flex-col items-center justify-center rounded-none border-b-2 border-[#BC9B6A]">
                            <div className="relative mb-3">
                                <img src={logoWhite} alt="Smaart Institute" className="h-14 w-auto drop-shadow-md" />
                            </div>
                            <h2 className="text-white text-xs font-bold font-sans tracking-[0.3em] uppercase opacity-90 border-t border-white/20 pt-2 px-4 text-center">
                                {step === 4 ? "Success!" : step === 3 ? "Reset Password" : step === 2 ? "Verify OTP" : "Forgot Password"}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-8">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-gray-50 p-3 rounded-none flex items-start gap-3 border border-gray-100">
                                        <div className="bg-[#002B5B] p-1.5 rounded-full flex-shrink-0">
                                            <Mail className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-[12px] text-gray-600 leading-snug font-sans">
                                            Enter your registered email address to receive a verification code.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* College Selection */}
                                        <div className="space-y-1.5 relative">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Your Institution</label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    type="text"
                                                    value={collegeSearch}
                                                    onChange={(e) => {
                                                        setCollegeSearch(e.target.value);
                                                        if (selectedCollege && e.target.value !== selectedCollege.name) {
                                                            setSelectedCollege(null);
                                                        }
                                                    }}
                                                    placeholder="Search University/College..."
                                                    className="bg-white border-gray-300 h-11 rounded-none text-sm pl-10 pr-4 focus:border-[#BC9B6A] shadow-sm"
                                                />
                                                {isSearchingColleges && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-[#BC9B6A]" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dropdown for colleges */}
                                            {showCollegeDropdown && colleges.length > 0 && !selectedCollege && (
                                                <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-gray-200 shadow-xl max-h-48 overflow-y-auto mt-1 custom-scrollbar">
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
                                                            className="p-3 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-2"
                                                        >
                                                            <Building2 className="w-3.5 h-3.5 text-[#002B5B]" />
                                                            <span className="truncate">{college.collegeName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 mt-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Account Email</label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <Input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    className="bg-white border-gray-300 h-11 rounded-none text-sm pl-10 pr-4 focus:border-[#BC9B6A] shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRequestReset}
                                        disabled={isLoading || !email || !selectedCollege}
                                        className="w-full bg-[#004D40] hover:bg-[#00332D] text-white h-12 rounded-none text-sm font-bold transition-all shadow-xl mt-6 disabled:opacity-50"
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
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-600 mb-6">
                                            Code sent to <br/><span className="font-bold text-[#002B5B] text-base">{email}</span>
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
                                                    className="w-10 h-14 text-center text-xl font-bold bg-white border-2 border-gray-200 rounded-none focus:border-[#BC9B6A] focus:ring-1 focus:ring-[#BC9B6A]/20 outline-none transition-all shadow-sm"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setStep(3)}
                                        disabled={otp.join("").length !== 6}
                                        className="w-full bg-[#004D40] hover:bg-[#00332D] text-white h-12 rounded-none text-sm font-bold shadow-xl active:scale-[0.98] mt-4"
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
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="bg-white border-gray-300 h-11 rounded-none px-4 text-sm focus:border-[#BC9B6A] shadow-sm"
                                                    placeholder="Enter new password"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BC9B6A]">
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="bg-white border-gray-300 h-11 rounded-none px-4 text-sm focus:border-[#BC9B6A] shadow-sm"
                                                    placeholder="Confirm new password"
                                                />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BC9B6A]">
                                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 border-y border-gray-100 mt-4">
                                            <RequirementItem label="Min 8 characters" met={passwordChecks.length} />
                                            <RequirementItem label="At least 1 number" met={passwordChecks.number} />
                                            <RequirementItem label="Uppercase letter" met={passwordChecks.uppercase} />
                                            <RequirementItem label="Special character" met={passwordChecks.special} />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isLoading || !Object.values(passwordChecks).every(Boolean)}
                                            className="w-full bg-[#004D40] hover:bg-[#00332D] text-white h-12 rounded-none text-sm font-bold transition-all shadow-xl mt-6"
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
                                    className="text-center py-2"
                                >
                                    <div className="w-16 h-16 bg-[#006064]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-10 h-10 text-[#006064]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Reset Successful</h3>
                                    <p className="text-sm text-gray-600 mb-6 px-4">You can now use your new password to sign in.</p>
                                    <Button
                                        onClick={onClose}
                                        className="w-full bg-[#002B5B] hover:bg-[#001D3D] text-white h-10 rounded-none text-sm font-bold transition-all shadow-lg"
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
      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-[#006064]' : 'bg-gray-200'}`}>
        <CheckCircle2 className={`w-3 h-3 ${met ? 'text-white' : 'text-gray-400'}`} />
      </div>
      <span className={`text-[11px] ${met ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
    </div>
  );

export default ForgotPasswordModal;
