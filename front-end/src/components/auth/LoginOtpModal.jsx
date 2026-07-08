import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, ArrowRight, RefreshCw, AlertTriangle, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiCall } from "@/services/api";
import blueLogo from "@/assets/blue.png";

const LoginOtpModal = ({ isOpen, onClose, tempToken, email, onSuccess }) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentTempToken, setCurrentTempToken] = useState(tempToken);
  const [expirationTime, setExpirationTime] = useState(180); // 3 minutes
  const [announcement, setAnnouncement] = useState("");

  // Force Logout State
  const [showForceLogout, setShowForceLogout] = useState(false);
  const [forceLogoutMessage, setForceLogoutMessage] = useState("");

  const inputRefs = useRef([]);
  // Bug #4 Fix: Track auto-submit to prevent double-fire from React re-renders
  const hasAutoSubmittedRef = useRef(false);

  const isVerifyingRef = useRef(false);

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
    setExpirationTime(180);
  }, [currentTempToken]);

  // AUTO-SUBMIT: When all 6 digits are filled, automatically verify
  // Bug #4 Fix: Added missing deps + ref guard to prevent duplicate POST calls
  useEffect(() => {
    const otpString = otp.join("");
    if (otpString.length === 6 && !isLoading && !showForceLogout && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      verifyOtp(false).finally(() => {
        hasAutoSubmittedRef.current = false;
      });
    }
    // Reset the guard when OTP is cleared
    if (otpString.length < 6) {
      hasAutoSubmittedRef.current = false;
    }
  }, [otp, isLoading, showForceLogout]);

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
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
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
        toast.success(t("login_otp.toast.verified_change_password", "OTP verified! Please change your password."));
      } else {
        toast.success(forceRetry ? t("login_otp.toast.session_reclaimed", "Session reclaimed successfully!") : t("login.toast.login_success", "Login successful!"));
      }
      onSuccess(data);
    } catch (error) {
      console.log("OTP verification error info:", error);

      // Handle Force Logout Requirement
      if (error.status === 409 || error.data?.requiresForceLogout) {
        console.log("Detecting 409/Force Logout requirement:", error.data);
        setForceLogoutMessage(error.message || error.data?.message || t("login_otp.already_logged_in", "You are already logged in on another device."));
        setShowForceLogout(true);
        setIsLoading(false);
        return;
      }

      // Handle account lock or rate limit
      if (error.message.includes('locked') || error.message.includes('Too many')) {
        const isTooMany = error.message.includes('Too many');
        const msg = isTooMany
          ? t("login_otp.toast.too_many", "Too many attempts. Please wait 5 minutes or restart the server.")
          : error.message;
        toast.error(msg, { duration: 5000 });
        if (isTooMany) onClose(); // Close on rate limit to prevent spam
        return;
      }

      toast.error(error.message || t("login_otp.toast.invalid_otp", "Invalid OTP"));
      if (!showForceLogout) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
      isVerifyingRef.current = false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      toast.error(t("login_otp.toast.enter_complete", "Please enter the complete 6-digit OTP"));
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

      toast.success(t("login_otp.toast.new_otp_sent", "New OTP sent to your email"));
      setCurrentTempToken(data.tempToken);
      setResendCooldown(20);
      setOtp(["", "", "", "", "", ""]);
      setShowForceLogout(false); // Reset this just in case
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Resend OTP error detail:", error);
      toast.error(error.message || t("login_otp.toast.resend_failed", "Failed to resend OTP"));
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
            className="relative w-full max-w-[420px] bg-white dark:bg-[#002147] overflow-hidden shadow-2xl z-10 flex flex-col border border-black/5 dark:border-white/10"
            style={{
              borderRadius: "24px",
            }}
          >
            {/* Content Switcher: Normal OTP or Force Logout Confirmation */}
            {!showForceLogout ? (
              <div className="flex flex-col">
                {/* Header */}
                <div className="bg-[#F8FAFC] dark:bg-dark-bg/50 p-8 flex flex-col items-center justify-center border-b border-gray-100 dark:border-white/5 relative">
                  <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-30"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="relative mb-3 z-10 p-3 bg-white dark:bg-dark-elevated rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 w-14 h-14 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#1a3884] dark:text-[#00a3e0]" />
                  </div>
                  <h2 className="text-gray-900 dark:text-white text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-90 pt-3 px-6 text-center z-10">
                    {t("login_otp.verify_email", "Verify Your Email")}
                  </h2>
                  <p className="text-[13px] text-gray-500 dark:text-slate-300 mt-2 text-center px-8">
                    {t("login_otp.sent_to", "We've sent a security code to")} <br />
                    <span className="text-[#112b6b] dark:text-white font-bold">{email}</span>
                  </p>
                </div>

                {/* OTP Form */}
                <div className="px-5 sm:px-10 py-6 sm:py-10 overflow-y-auto custom-scrollbar">
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
                      role="group"
                      aria-label={t("login_otp.otp_group_label", "One-time password input")}
                      className="flex justify-center gap-1.5 sm:gap-3"
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
                          aria-label={t("login_otp.otp_digit", "OTP digit {{n}} of 6", { n: index + 1 })}
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-9 h-12 sm:w-12 sm:h-16 text-center text-lg sm:text-2xl font-bold bg-[#f8fafc] dark:bg-dark-bg/50 border border-[#e2e8f0] dark:border-white/10 rounded-lg sm:rounded-xl focus:border-[#1a3884] dark:focus:border-[#00a3e0] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:ring-[#00a3e0]/20 focus:bg-white dark:focus:bg-[#001c3d] outline-none transition-all shadow-sm text-[#112b6b] dark:text-white"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      <p className={`text-[12px] font-bold uppercase tracking-wider ${expirationTime < 60 ? 'text-red-500' : 'text-slate-400'}`}>
                        {t("login_otp.expires_in", "Expires in:")} <span className="font-mono">{formatTime(expirationTime)}</span>
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
                          {t("login.access_portal", "Access Portal")}
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

                  <div className="mt-8 text-center pt-6 border-t border-gray-50 dark:border-white/5">
                    <p className="text-gray-400 dark:text-slate-400 text-[12px] font-medium mb-3">
                      {t("login_otp.didnt_receive", "Didn't receive the code?")}
                    </p>
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || isResending}
                      className="inline-flex items-center gap-2 text-[#1a3884] dark:text-[#00a3e0] hover:text-[#112b6b] dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-[13px] hover:-translate-y-0.5"
                    >
                      {isResending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {resendCooldown > 0
                        ? t("login_otp.resend_in", "Resend in {{seconds}}s", { seconds: resendCooldown })
                        : t("login_otp.resend_code", "Resend Code")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Force Logout Confirmation View
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="p-8 text-center bg-white dark:bg-[#002147] flex flex-col items-center relative"
              >
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-30"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Animated Graphic: Device Collision/Conflict */}
                <div className="relative w-full max-w-[280px] h-32 flex items-center justify-center mb-6 mt-2">
                  {/* Glowing background halo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-amber-500/10 dark:from-red-500/5 dark:to-amber-500/5 blur-xl rounded-full" />
                  
                  {/* Multi-layered Pulsing Radar Rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                      animate={{ scale: [0.9, 1.3, 0.9], opacity: [0.15, 0.35, 0.15] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="absolute w-28 h-28 border border-red-500/20 dark:border-red-500/10 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.18, 0.05] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
                      className="absolute w-36 h-36 border border-amber-500/20 dark:border-amber-500/10 rounded-full"
                    />
                  </div>

                  {/* Device Grid Interaction */}
                  <div className="relative flex items-center justify-between w-full px-4 z-10">
                    {/* Left Device: Current PC/Browser (Active attempt) */}
                    <motion.div 
                      initial={{ x: -15, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, type: "spring", delay: 0.1 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-navy-light/40 dark:to-navy-light/20 border border-blue-100 dark:border-blue-500/10 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/5 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-300" />
                        <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t("login_otp.this_device", "This Device")}</span>
                    </motion.div>

                    {/* Center: Clash / Conflict Wave */}
                    <div className="relative flex flex-col items-center justify-center w-12">
                      <div className="h-0.5 w-full bg-gradient-to-r from-blue-400/30 via-red-400/50 to-red-500/30 dark:from-blue-500/20 dark:via-red-500/30 dark:to-red-500/10 relative">
                        <motion.div 
                          animate={{ x: [-15, 15, -15] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          className="absolute -top-[3px] left-1/2 w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" 
                        />
                      </div>
                      
                      {/* Warning Shield Badge */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 4, -4, 0]
                        }}
                        transition={{ 
                          scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                          rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                        }}
                        className="absolute w-10 h-10 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/10 z-20"
                      >
                        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                      </motion.div>
                    </div>

                    {/* Right Device: The Other Active Session */}
                    <motion.div 
                      initial={{ x: 15, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.6, type: "spring", delay: 0.15 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-rose-50 dark:from-navy-light/40 dark:to-navy-light/20 border border-red-100 dark:border-red-500/10 rounded-2xl flex items-center justify-center shadow-md shadow-red-500/5 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-300" />
                        <Smartphone className="w-6 h-6 text-red-500/80 dark:text-red-400 relative z-10" />
                        {/* Red warning aura */}
                        <span className="absolute -top-1 -left-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-red-500/80 dark:text-red-400 uppercase tracking-widest">{t("login_otp.other_device", "Other Device")}</span>
                    </motion.div>
                  </div>
                </div>

                {/* Typography and Descriptions */}
                <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2.5">
                  {t("login_otp.active_session", "Active Session")}
                </h3>
                
                {/* Warning Card Container */}
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100/60 dark:border-red-500/10 rounded-2xl p-4 mb-8 max-w-[320px] mx-auto text-left flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-red-100/60 dark:bg-red-900/30 rounded-lg shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-extrabold text-red-800 dark:text-red-300 uppercase tracking-widest mb-0.5">{t("login_otp.security_notice", "Security Notice")}</h4>
                    <p className="text-[12.5px] text-red-700/95 dark:text-red-300/85 leading-relaxed font-semibold">
                      {forceLogoutMessage || t("login_otp.already_logged_in", "You are already logged in on another device.")}
                    </p>
                  </div>
                </div>

                {/* Dynamic buttons with premium interactions */}
                <div className="space-y-3 w-full px-2">
                  <Button
                    onClick={handleForceLogoutConfirm}
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl text-sm font-bold text-white shadow-lg shadow-red-500/20 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 hover:shadow-red-500/30 hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                    ) : (
                      <>
                        <span className="relative z-10">{t("login_otp.sign_out_other", "Sign out other device")}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleForceLogoutCancel}
                    disabled={isLoading}
                    variant="ghost"
                    className="w-full h-11 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5 font-bold text-[13px] rounded-xl transition-all duration-300"
                  >
                    {t("login_otp.cancel", "Cancel")}
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginOtpModal;




