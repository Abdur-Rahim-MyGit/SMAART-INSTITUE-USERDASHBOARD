import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiCall } from "@/services/api";

const MODAL_LABEL_ID = "first-login-modal-title";

const FirstLoginPasswordModal = ({ isOpen, onClose, tempToken, email, fullName, onSuccess }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Full password policy validation (matching backend)
  const passwordChecks = {
    length:    newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number:    /[0-9]/.test(newPassword),
    special:   /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match:     newPassword === confirmPassword && confirmPassword.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // ── Escape key trap: show warning instead of closing ──────────────────────
  const handleClose = useCallback(() => {
    toast.error("You must set a new password to continue.", { id: "force-pw-toast" });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, handleClose]);

  // ── Lock body scroll while modal is open ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Reset fields when re-opened ───────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please ensure your password meets all requirements below.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiCall('/auth/first-login-change-password', {
        method: "POST",
        body: JSON.stringify({ tempToken, newPassword, confirmPassword }),
      });

      // Check if user is already registered — redirect to dashboard
      if (data.alreadyRegistered || data.redirectToDashboard) {
        toast.info(data.message || "You are already registered. Redirecting to dashboard.");
        onSuccess(data, true);
        return;
      }

      toast.success(data.message || "Password changed successfully! Welcome aboard.");
      onSuccess(data, false);
    } catch (err) {
      console.error("Password change error:", err);
      // Show backend validation errors as-is (they are user-friendly)
      const msg = err.message || "Failed to connect. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        // Intercept clicks on the backdrop — show warning instead of closing
        onClick={handleClose}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={MODAL_LABEL_ID}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          // Stop clicks inside the card from reaching the backdrop
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl overflow-hidden"
          style={{ border: "1px solid rgba(0, 0, 0, 0.05)" }}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="bg-[#F8FAFC] px-8 pt-8 pb-7 flex flex-col items-center border-b border-gray-100">
            {/* Shield badge */}
            <div className="mb-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 w-14 h-14 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#1a3884]" />
            </div>

            {/* Forced-change badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Action Required
            </span>

            <h2
              id={MODAL_LABEL_ID}
              className="text-gray-900 text-xs font-bold tracking-[0.2em] uppercase text-center"
            >
              Secure Your Account
            </h2>
            <p className="text-[13px] text-gray-500 mt-2 text-center px-4 leading-relaxed">
              Welcome, <span className="text-[#112b6b] font-bold">{fullName || "User"}</span>. 
              {" "}You must set a new password before accessing the portal.
            </p>
          </div>

          {/* ── Form ────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <p className="text-[11px] text-red-600 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Account Email
              </label>
              <div className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 bg-[#F8FAFC] border border-gray-100 opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  value={email || ""}
                  readOnly
                  tabIndex={-1}
                  className="flex-1 bg-transparent outline-none text-[13px] font-semibold text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                New Password
              </label>
              <div
                className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#f8fafc] border border-[#e2e8f0]"
                onFocusCapture={(e) => {
                  e.currentTarget.style.border = "1.5px solid #1a3884";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.08)";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.border = "1px solid #e2e8f0";
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 group-focus-within:border-[#1a3884]/30 transition-all">
                  <Lock className="w-3.5 h-3.5 text-[#1a3884]" />
                </div>
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] p-1"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1"
              >
                Confirm Password
              </label>
              <div
                className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#f8fafc] border border-[#e2e8f0]"
                onFocusCapture={(e) => {
                  e.currentTarget.style.border = "1.5px solid #1a3884";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.08)";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.border = "1px solid #e2e8f0";
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 group-focus-within:border-[#1a3884]/30 transition-all">
                  <Lock className="w-3.5 h-3.5 text-[#1a3884]" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] p-1"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ── Password Requirements Checklist ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 border-y border-gray-100">
              <RequirementItem label="Min 8 characters"   met={passwordChecks.length} />
              <RequirementItem label="At least 1 number"  met={passwordChecks.number} />
              <RequirementItem label="Uppercase letter"   met={passwordChecks.uppercase} />
              <RequirementItem label="Special character"  met={passwordChecks.special} />
              <RequirementItem label="Lowercase letter"   met={passwordChecks.lowercase} />
              {/* BUG 3 FIX: show the match indicator */}
              <RequirementItem label="Passwords match"    met={passwordChecks.match} />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-[#112b6b]/20 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Securing Account…</span>
                </>
              ) : (
                <>
                  <span>Update &amp; Access Portal</span>
                  <ShieldCheck className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-gray-400 leading-relaxed">
              🔒 This step is mandatory. Your account cannot be accessed until a secure password is set.
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const RequirementItem = ({ label, met }) => (
  <div className="flex items-center gap-2">
    <div
      className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
        met ? "bg-green-500 shadow-sm shadow-green-200" : "bg-gray-100"
      }`}
    >
      <CheckCircle2 className={`w-3 h-3 ${met ? "text-white" : "text-gray-400"}`} />
    </div>
    <span
      className={`text-[11px] font-bold transition-colors duration-200 ${
        met ? "text-gray-800" : "text-gray-400"
      }`}
    >
      {label}
    </span>
  </div>
);

export default FirstLoginPasswordModal;
