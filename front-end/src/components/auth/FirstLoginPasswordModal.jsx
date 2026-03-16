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
          className="relative w-full max-w-[420px] bg-[#FDFBF7] border-2 border-[#BC9B6A] rounded-none shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          {/* Vintage Decorative Border */}
          <div className="absolute inset-2 border border-[#BC9B6A]/20 pointer-events-none rounded-none" />
          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#BC9B6A]/40 pointer-events-none" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#BC9B6A]/40 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#BC9B6A]/40 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#BC9B6A]/40 pointer-events-none" />


          <div className="relative z-10 flex flex-col h-full">
            {/* Header / Brand */}
            <div className="bg-[#002B5B] p-8 shadow-xl flex flex-col items-center justify-center rounded-none border-b-2 border-[#BC9B6A]">
              <div className="relative mb-3">
                <img src={logoWhite} alt="Smaart Institute" className="h-14 w-auto drop-shadow-md" />
              </div>
              <h2 className="text-white text-xs font-bold font-sans tracking-[0.3em] uppercase opacity-90 border-t border-white/20 pt-2 px-4">
                Change Password
              </h2>
            </div>

            {/* Content Container */}
            <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="space-y-3">

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 rounded-none bg-red-50 border border-red-200"
                >
                  <p className="text-[11px] text-red-600 flex items-center gap-1.5 leading-tight">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </p>
                </motion.div>
              )}
              <div className="space-y-4">
                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Account Email</label>
                  <div className="relative">
                    <Input
                      value={email || ""}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400 h-11 rounded-none cursor-not-allowed text-sm font-medium pl-4"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Lock className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Create complex password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 h-11 rounded-none px-4 text-sm focus:border-[#BC9B6A] focus-visible:ring-[#BC9B6A]/10 transition-all shadow-sm"
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
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="bg-white border-gray-300 text-gray-900 h-11 rounded-none px-4 text-sm focus:border-[#BC9B6A] transition-all shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#BC9B6A]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 border-y border-gray-100 mt-4">
                <RequirementItem label="Min 8 characters" met={passwordChecks.length} />
                <RequirementItem label="At least 1 number" met={passwordChecks.number} />
                <RequirementItem label="Uppercase letter" met={passwordChecks.uppercase} />
                <RequirementItem label="Special character" met={passwordChecks.special} />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full bg-[#004D40] hover:bg-[#00332D] text-white h-12 rounded-none text-sm font-bold transition-all shadow-xl active:scale-[0.98] mt-6 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Change Password & Continue</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </Button>
              </div>
            </form>
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

export default FirstLoginPasswordModal;
