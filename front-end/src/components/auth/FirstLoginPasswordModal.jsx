import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_BASE_URL, apiCall } from "@/services/api";
import logoWhite from "@/assets/white.png";

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-[500px] bg-[#FDFBF7] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden p-6 md:p-8"
        >
          {/* Vintage Border Layer */}
          <div className="absolute inset-4 md:inset-6 border-t-[1.5px] border-x-[1.5px] border-[#BC9B6A] rounded-t-2xl pointer-events-none">
            {/* Inner Decorative Corner Lines - simplified approach */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#BC9B6A] rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#BC9B6A] rounded-tr-lg" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Header / Brand */}
            {/* Header / Brand */}
            <div className="bg-[#002B5B] mx-[-32px] mt-[-32px] mb-4 p-6 shadow-lg flex flex-col items-center justify-center rounded-t-3xl border-b border-[#BC9B6A]/30">
              <img src={logoWhite} alt="Smaart Institute" className="h-16 w-auto mb-2" />
              <h2 className="text-white text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-80">Change Password</h2>
            </div>

            {/* Content Container */}
            <form onSubmit={handleSubmit} className="px-2 max-h-[70vh] overflow-y-auto no-scrollbar pb-4">
            <div className="space-y-4">
              {/* Info alert box */}
              <div className="bg-gray-50/80 p-3 rounded-2xl flex items-start gap-3 border border-gray-100">
                <div className="bg-[#002B5B] p-1.5 rounded-full mt-0.5">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-sans">
                  Your security is our priority. Please create a strong password.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </motion.div>
              )}
              <div className="space-y-3">
                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Email email</label>
                  <div className="relative group">
                    <Input
                      value={email || ""}
                      readOnly
                      className="bg-[#F1F3F4] border-gray-200 text-gray-500 h-11 rounded-xl cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[#F1F3F4] border-gray-200 text-gray-800 h-14 rounded-xl px-4 text-base focus:border-[#BC9B6A] focus-visible:ring-[#BC9B6A]/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BC9B6A] hover:text-[#9A7B4F] transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-[#F1F3F4] focus:bg-white border-gray-200 focus:border-[#BC9B6A] h-11 rounded-xl transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BC9B6A] hover:text-[#9A7B4F] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pt-2">
                <RequirementItem label="Minimum 8 characters" met={passwordChecks.length} />
                <RequirementItem label="At least one number" met={passwordChecks.number} />
                <RequirementItem label="At least one uppercase letter" met={passwordChecks.uppercase} />
                <RequirementItem label="At least one special character" met={passwordChecks.special} />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || !isPasswordValid}
                  className="w-full bg-[#006064] hover:bg-[#004D4F] text-white h-11 rounded-xl text-base font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Changing Password...
                    </span>
                  ) : (
                    "Change Password & Continue"
                  )}
                </Button>
                </div>
              </div>
            </form>
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
    <span className={`text-[13px] ${met ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
  </div>
);

export default FirstLoginPasswordModal;
