import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiCall } from "@/services/api";

const MODAL_LABEL_ID = "first-login-modal-title";

const FirstLoginPasswordModal = ({ isOpen, onClose, tempToken, email, fullName, onSuccess }) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Full password policy validation (matching backend)
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // ── Escape key trap: show warning instead of closing ──────────────────────
  const handleClose = useCallback(() => {
    toast.error(t("first_login_pw.toast_mandatory", "You must set a new password to continue."), { id: "force-pw-toast" });
  }, [t]);

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
      setError(t("first_login_pw.error_policy", "Please ensure your password meets all requirements below."));
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
          className="relative w-full max-w-[420px] bg-white dark:bg-[#002147] rounded-2xl shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col border border-black/5 dark:border-white/10"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-[90] p-1.5 rounded-full hover:bg-gray-100/80 dark:hover:bg-white/5 transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="bg-[#F8FAFC] dark:bg-[#001833]/50 px-6 pt-5 pb-4 flex flex-col items-center border-b border-gray-100 dark:border-white/5 shrink-0">
            {/* Shield badge */}
            <div className="mb-2 p-2.5 bg-white dark:bg-[#002147] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 w-11 h-11 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#1a3884] dark:text-[#00a3e0]" />
            </div>

            {/* Forced-change badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-widest mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t("first_login_pw.badge", "Action Required")}
            </span>

            <h2
              id={MODAL_LABEL_ID}
              className="text-gray-900 dark:text-white text-[10px] font-bold tracking-[0.2em] uppercase text-center"
            >
              {t("first_login_pw.title", "Secure Your Account")}
            </h2>
            <p
              className="text-[12px] text-gray-500 dark:text-slate-300 mt-1 text-center px-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t("first_login_pw.subtitle", { name: fullName || "User", interpolation: { escapeValue: true } }) }}
            />
          </div>

          {/* ── Form ────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3.5 overflow-y-auto">
            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-500/20"
                >
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account Email (read-only) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">
                {t("first_login_pw.account_email", "Account Email")}
              </label>
              <div className="flex items-center gap-2.5 px-3 rounded-xl h-10 bg-[#F8FAFC] dark:bg-dark-bg/30 border border-gray-100 dark:border-white/5 opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-[#002147] shadow-sm border border-gray-100 dark:border-white/10">
                  <Lock className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                </div>
                <input
                  value={email || ""}
                  readOnly
                  tabIndex={-1}
                  className="flex-1 bg-transparent outline-none text-[12px] font-semibold text-gray-400 dark:text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label
                htmlFor="new-password"
                className="text-[10px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-widest ml-1"
              >
                {t("first_login_pw.new_password", "New Password")}
              </label>
              <div
                className="relative group flex items-center gap-2.5 px-3 rounded-xl h-10 transition-all bg-[#f8fafc] dark:bg-[#001c3d]/50 border border-[#e2e8f0] dark:border-white/10 focus-within:border-[#1a3884] dark:focus-within:border-[#00a3e0] focus-within:bg-white dark:focus-within:bg-[#001c3d] focus-within:ring-4 focus-within:ring-[#1a3884]/10 dark:focus-within:ring-[#00a3e0]/20"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-[#002147] shadow-sm border border-gray-100 dark:border-white/10 group-focus-within:border-[#1a3884]/30 dark:group-focus-within:border-[#00a3e0]/30 transition-all">
                  <Lock className="w-3 h-3 text-[#1a3884] dark:text-[#00a3e0]" />
                </div>
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("first_login_pw.new_password_placeholder", "Create a strong password")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[12px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-slate-500 text-[#112b6b] dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] dark:text-slate-400 dark:hover:text-[#00a3e0] p-1"
                  aria-label={showNewPassword ? t("first_login_pw.hide", "Hide password") : t("first_login_pw.show", "Show password")}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label
                htmlFor="confirm-password"
                className="text-[10px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-widest ml-1"
              >
                {t("first_login_pw.confirm_password", "Confirm Password")}
              </label>
              <div
                className="relative group flex items-center gap-2.5 px-3 rounded-xl h-10 transition-all bg-[#f8fafc] dark:bg-[#001c3d]/50 border border-[#e2e8f0] dark:border-white/10 focus-within:border-[#1a3884] dark:focus-within:border-[#00a3e0] focus-within:bg-white dark:focus-within:bg-[#001c3d] focus-within:ring-4 focus-within:ring-[#1a3884]/10 dark:focus-within:ring-[#00a3e0]/20"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-[#002147] shadow-sm border border-gray-100 dark:border-white/10 group-focus-within:border-[#1a3884]/30 dark:group-focus-within:border-[#00a3e0]/30 transition-all">
                  <Lock className="w-3 h-3 text-[#1a3884] dark:text-[#00a3e0]" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("first_login_pw.confirm_password_placeholder", "Repeat your new password")}
                  className="flex-1 bg-transparent outline-none text-[12px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-slate-500 text-[#112b6b] dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] dark:text-slate-400 dark:hover:text-[#00a3e0] p-1"
                  aria-label={showConfirmPassword ? t("first_login_pw.hide", "Hide password") : t("first_login_pw.show", "Show password")}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ── Password Requirements Checklist ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 py-3 border-y border-gray-100 dark:border-white/5">
              <RequirementItem label={t("first_login_pw.req_length", "Min 8 characters")} met={passwordChecks.length} />
              <RequirementItem label={t("first_login_pw.req_number", "At least 1 number")} met={passwordChecks.number} />
              <RequirementItem label={t("first_login_pw.req_upper", "Uppercase letter")} met={passwordChecks.uppercase} />
              <RequirementItem label={t("first_login_pw.req_special", "Special character")} met={passwordChecks.special} />
              <RequirementItem label={t("first_login_pw.req_lower", "Lowercase letter")} met={passwordChecks.lowercase} />
              <RequirementItem label={t("first_login_pw.req_match", "Passwords match")} met={passwordChecks.match} />
            </div>

            {/* Submit & Cancel Actions */}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full h-10 rounded-xl text-sm font-bold shadow-lg shadow-[#112b6b]/20 dark:shadow-none text-white transition-all hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>{t("first_login_pw.submitting", "Securing Account…")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("first_login_pw.submit", "Update & Access Portal")}</span>
                    <ShieldCheck className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={onClose}
                className="w-full h-9 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {t("first_login_pw.cancel", "Cancel & Exit")}
              </Button>
            </div>

            <p className="text-center text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed">
              {t("first_login_pw.mandatory_note", "🔒 This step is mandatory. Your account cannot be accessed until a secure password is set.")}
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
      className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${met ? "bg-green-500 shadow-sm dark:shadow-none" : "bg-gray-100 dark:bg-slate-800"
        }`}
    >
      <CheckCircle2 className={`w-3 h-3 ${met ? "text-white" : "text-gray-400 dark:text-slate-500"}`} />
    </div>
    <span
      className={`text-[11px] font-bold transition-colors duration-200 ${met ? "text-gray-800 dark:text-slate-200" : "text-gray-400 dark:text-slate-500"
        }`}
    >
      {label}
    </span>
  </div>
);

export default FirstLoginPasswordModal;
