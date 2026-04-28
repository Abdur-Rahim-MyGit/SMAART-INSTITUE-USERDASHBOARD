import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiCall } from "@/services/api";
import blueLogo from "@/assets/blue.png";

const LoginOtpModal = ({ isOpen, onClose, tempToken, email, onSuccess }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentTempToken, setCurrentTempToken] = useState(tempToken);
  const [expirationTime, setExpirationTime] = useState(300); // 5 minutes
  const [announcement, setAnnouncement] = useState("");

  // Force Logout State
  const [showForceLogout, setShowForceLogout] = useState(false);
  const [forceLogoutMessage, setForceLogoutMessage] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    setCurrentTempToken(tempToken);
    // Reset state on new token
    setShowForceLogout(false);
    setOtp(["", "", "", "", "", ""]);
  }, [tempToken]);

  useEffect(() => {
    if (isOpen && !showForceLogout && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen, showForceLogout]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (expirationTime > 0) {
      const timer = setTimeout(() => setExpirationTime(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expirationTime]);

  // Reset timer when token changes (initial or resend)
  useEffect(() => {
    setExpirationTime(300);
  }, [currentTempToken]);

  // AUTO-SUBMIT: When all 6 digits are filled, automatically verify
  useEffect(() => {
    const otpString = otp.join("");
    if (otpString.length === 6 && !isLoading && !showForceLogout) {
      verifyOtp(false);
    }
  }, [otp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
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

  const verifyOtp = async (forceRetry = false) => {
    setIsLoading(true);
    const otpString = otp.join("");

    try {
      const body = {
        tempToken: currentTempToken,
        otp: otpString,
        forceLogout: forceRetry
      };

      const data = await apiCall('/auth/verify-login-otp', {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data.requirePasswordChange) {
        toast.success("OTP verified! Please change your password.");
      } else {
        toast.success(forceRetry ? "Session reclaimed successfully!" : "Login successful!");
      }
      onSuccess(data);
    } catch (error) {
      console.log("OTP verification error info:", error);

      // Handle Force Logout Requirement
      if (error.status === 409 || error.data?.requiresForceLogout) {
        console.log("Detecting 409/Force Logout requirement:", error.data);
        setForceLogoutMessage(error.message || error.data?.message || "You are already logged in on another device.");
        setShowForceLogout(true);
        setIsLoading(false);
        return;
      }

      // Handle account lock or rate limit
      if (error.message.includes('locked') || error.message.includes('Too many')) {
        const msg = error.message.includes('Too many')
          ? "Too many attempts. Please wait 5 minutes or restart the server."
          : error.message;
        toast.error(msg, { duration: 5000 });
        if (msg.includes('Too many')) onClose(); // Close on rate limit to prevent spam
        return;
      }

      toast.error(error.message || "Invalid OTP");
      if (!showForceLogout) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    await verifyOtp(false);
  };

  const handleForceLogoutConfirm = async () => {
    await verifyOtp(true);
  };

  const handleForceLogoutCancel = () => {
    setShowForceLogout(false);
    setOtp(["", "", "", "", "", ""]); // Reset OTP to force re-entry or just keep it? Better keep it.
    // Actually, user cancelled, so they might want to enter OTP again or close.
    // But they already entered valid OTP to get here. 
    // Cancelling meaningful "No I don't want to logout the other device", implies "I want to stop trying to login".
    onClose();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);

    try {
      const data = await apiCall('/auth/resend-login-otp', {
        method: "POST",
        body: JSON.stringify({ tempToken: currentTempToken }),
      });

      toast.success("New OTP sent to your email");
      setCurrentTempToken(data.tempToken);
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setShowForceLogout(false); // Reset this just in case
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Resend OTP error detail:", error);
      toast.error(error.message || "Failed to resend OTP");
      if (error.message.includes("expired")) {
        onClose();
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[420px] bg-white overflow-hidden shadow-2xl z-10 flex flex-col"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.04)",
              borderRadius: "24px",
            }}
          >
            {/* Content Switcher: Normal OTP or Force Logout Confirmation */}
            {!showForceLogout ? (
              <div className="flex flex-col">
                {/* Header */}
                <div className="bg-gray-50 p-8 flex flex-col items-center justify-center border-b border-gray-100 relative">
                  <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors z-30"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="relative mb-3 z-10 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 w-14 h-14 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#1a3884]" />
                  </div>
                  <h2 className="text-gray-900 text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-90 pt-3 px-6 text-center z-10">
                    Verify Your Email
                  </h2>
                  <p className="text-[13px] text-gray-500 mt-2 text-center px-8">
                    We've sent a security code to <br />
                    <span className="text-[#112b6b] font-bold">{email}</span>
                  </p>
                </div>

                {/* OTP Form */}
                <div className="px-10 py-10 overflow-y-auto custom-scrollbar">
                  <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                  >
                    {announcement}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div
                      className="flex justify-center gap-3"
                      onPaste={handlePaste}
                    >
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-12 h-16 text-center text-2xl font-bold bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 focus:bg-white outline-none transition-all shadow-sm text-[#112b6b]"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      <p className={`text-[12px] font-bold uppercase tracking-wider ${expirationTime < 60 ? 'text-red-500' : 'text-slate-400'}`}>
                        Expires in: <span className="font-mono">{formatTime(expirationTime)}</span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-[#112b6b]/20 mt-2 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                      disabled={isLoading || otp.join("").length !== 6}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Access Portal
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 text-center pt-6 border-t border-gray-50">
                    <p className="text-gray-400 text-[12px] font-medium mb-3">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || isResending}
                      className="inline-flex items-center gap-2 text-[#1a3884] hover:text-[#112b6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-[13px] hover:-translate-y-0.5"
                    >
                      {isResending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend Code"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Force Logout Confirmation View
              <div className="p-8 text-center bg-white">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors z-30"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm relative">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20" />
                  <AlertTriangle className="w-10 h-10 text-red-500 relative z-10" />
                </div>

                <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Active Session</h3>
                <p className="text-[13px] text-gray-500 mb-8 max-w-[280px] mx-auto leading-relaxed">
                  {forceLogoutMessage || "You are already logged in on another device."}
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={handleForceLogoutConfirm}
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 text-white bg-red-500 hover:bg-red-600 transition-all hover:-translate-y-1 active:translate-y-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : "Sign out other device"}
                  </Button>

                  <Button
                    onClick={handleForceLogoutCancel}
                    variant="ghost"
                    disabled={isLoading}
                    className="w-full h-11 text-gray-500 hover:text-gray-900 font-bold text-[13px] transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginOtpModal;




