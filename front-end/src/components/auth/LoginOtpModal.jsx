import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiCall } from "@/services/api";

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
  const [forceLogouMessage, setForceLogoutMessage] = useState("");

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
      console.error("OTP verification error detail:", error);

      // Handle Force Logout Requirement
      if (error.data?.requiresForceLogout) {
        setForceLogoutMessage(error.message);
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
            className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#30919D]/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#daa520]/5 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* Content Switcher: Normal OTP or Force Logout Confirmation */}
            {!showForceLogout ? (
              <>
                {/* Header */}
                <div className="p-8 pb-0 text-center relative">
                  <button
                    onClick={onClose}
                    aria-label="Close OTP verification"
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" aria-hidden="true" />
                  </button>
                  <div className="w-24 h-24 bg-gradient-to-br from-[#30919D]/20 to-[#30919D]/5 rounded-3xl border border-[#30919D]/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#30919D]/10">
                    <Mail className="w-12 h-12 text-[#30919D]" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-[#002147] mb-2">
                    Verify Your Email
                  </h2>
                  <p className="text-gray-500">
                    We've sent a 6-digit code to<br />
                    <span className="text-[#30919D] font-medium">{email}</span>
                  </p>
                </div>

                {/* OTP Form */}
                <div className="p-8">
                  {/* Screen reader live region for announcements */}
                  <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                  >
                    {announcement}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6" aria-label="OTP verification form">
                    <fieldset>
                      <legend className="sr-only">Enter the 6-digit verification code sent to {email}</legend>
                      <div
                        className="flex justify-center gap-3"
                        onPaste={handlePaste}
                        role="group"
                        aria-label="OTP input fields"
                      >
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            aria-label={`Digit ${index + 1} of 6`}
                            aria-describedby="otp-helper"
                            autoComplete="one-time-code"
                            className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl text-[#002147] focus:border-[#30919D] focus:ring-2 focus:ring-[#30919D]/30 transition-all duration-300 outline-none"
                          />
                        ))}
                      </div>
                      <div className="text-center mt-4">
                        <p className={`text-sm font-medium ${expirationTime < 60 ? 'text-red-500' : 'text-slate-500'}`}>
                          OTP Expires in: <span className="font-mono">{formatTime(expirationTime)}</span>
                        </p>
                      </div>
                      <p id="otp-helper" className="sr-only">Enter each digit of your 6-digit verification code</p>
                    </fieldset>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#30919D] to-[#267a84] hover:from-[#267a84] hover:to-[#30919D] text-white font-bold py-6 rounded-xl shadow-lg shadow-[#30919D]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                      disabled={isLoading || otp.join("").length !== 6}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Verify & Login <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || isResending}
                      className="inline-flex items-center gap-2 text-[#30919D] hover:text-[#267a84] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

                  <p className="mt-6 text-center text-gray-400 text-xs">
                    Code expires in 5 minutes
                  </p>
                </div>
              </>
            ) : (
              // Force Logout Confirmation View
              <div className="p-8 text-center animate-in fade-in zoom-in duration-300">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">Active Session Detected</h3>
                <p className="text-gray-600 mb-8 max-w-[280px] mx-auto leading-relaxed">
                  {forceLogouMessage || "You are already logged in on another device."}
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={handleForceLogoutConfirm}
                    disabled={isLoading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-6 rounded-xl shadow-lg shadow-red-500/20"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : "Log out other device & Login here"}
                  </Button>

                  <Button
                    onClick={handleForceLogoutCancel}
                    variant="ghost"
                    disabled={isLoading}
                    className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
