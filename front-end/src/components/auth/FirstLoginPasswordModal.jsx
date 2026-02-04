import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_BASE_URL, apiCall } from "@/services/api";

const FirstLoginPasswordModal = ({ isOpen, onClose, tempToken, email, fullName, onSuccess }) => {
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
    match: newPassword === confirmPassword && confirmPassword.length > 0
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please ensure your password meets all requirements");
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiCall('/auth/first-login-change-password', {
        method: "POST",
        body: JSON.stringify({
          tempToken,
          newPassword,
          confirmPassword
        }),
      });

      // Check if user is already registered - redirect to dashboard
      if (data.alreadyRegistered || data.redirectToDashboard) {
        toast.info(data.message || "You are already registered. Redirecting to dashboard.");
        onSuccess(data, true); // Pass flag indicating redirect to dashboard
        return;
      }

      toast.success(data.message || "Password changed successfully!");
      onSuccess(data, false);
    } catch (err) {
      console.error("Password change detail error:", err);
      setError(err.message || "Failed to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Don't allow closing - must change password
    toast.error("You must change your password to continue");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-gradient-to-b from-[#001a38] to-[#002147] rounded-2xl shadow-2xl border border-teal/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-teal/20 bg-gradient-to-r from-teal/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal/20 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-teal" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Change Your Password</h2>
                <p className="text-sm text-white/60">
                  Welcome, {fullName || "Student"}! Please set a new password.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Info Banner */}
            <div className="p-4 rounded-lg bg-teal/10 border border-teal/30">
              <p className="text-sm text-teal-light flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>For security purposes, you need to change your password on first login. This password will be used for all future logins.</span>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </motion.div>
            )}

            {/* Email Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Email</label>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm">
                {email}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-transparent border-white/20 focus:border-teal focus:ring-teal/20 text-white pl-10 pr-10 h-12 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent border-white/20 focus:border-teal focus:ring-teal/20 text-white pl-10 pr-10 h-12 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2">
              <p className="text-xs text-white/50 mb-2">Password requirements:</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-2 text-xs ${passwordChecks.length ? 'text-green-400' : 'text-white/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.length ? 'bg-green-400' : 'bg-white/30'}`} />
                  8+ characters
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordChecks.uppercase ? 'text-green-400' : 'text-white/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.uppercase ? 'bg-green-400' : 'bg-white/30'}`} />
                  Uppercase (A-Z)
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordChecks.lowercase ? 'text-green-400' : 'text-white/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.lowercase ? 'bg-green-400' : 'bg-white/30'}`} />
                  Lowercase (a-z)
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordChecks.number ? 'text-green-400' : 'text-white/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.number ? 'bg-green-400' : 'bg-white/30'}`} />
                  Number (0-9)
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordChecks.special ? 'text-green-400' : 'text-white/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.special ? 'bg-green-400' : 'bg-white/30'}`} />
                  Special char (!@#$...)
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordChecks.match ? 'text-green-400' : 'text-white/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.match ? 'bg-green-400' : 'bg-white/30'}`} />
                  Passwords match
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full h-12 bg-gradient-to-r from-teal to-teal-light hover:from-teal-light hover:to-teal text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Changing Password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Change Password & Continue
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FirstLoginPasswordModal;
