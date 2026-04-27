import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import LoginOtpModal from "./LoginOtpModal";
import FirstLoginPasswordModal from "./FirstLoginPasswordModal";

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState({ tempToken: "", email: "", flowType: "login" });

  // Password change state (for first-time login after OTP)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ tempToken: "", email: "", fullName: "" });
  const [rememberMe, setRememberMe] = useState(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      return true;
    }
    return false;
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if OTP verification is required (ALL students now)
        if (data.requireOtp) {
          toast.success("OTP sent to your email!");
          setOtpData({
            tempToken: data.tempToken,
            email: data.email,
            flowType: data.flowType || "login", // 'first-login' or 'login'
          });
          setShowOtpModal(true);
        } else {
          // Direct login (non-students or legacy flow)
          handleLoginSuccess(data);
        }
      } else {
        // Handle specific error cases
        if (data.isLocked) {
          toast.error(data.error, { duration: 5000 });
        } else {
          toast.error(data.error || "Login failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful login (after OTP or direct)
  const handleLoginSuccess = useCallback((data) => {
    console.log("[LoginModal] Login successful, storing user data:", {
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user?.email,
      hasRegistration: data.user?.hasRegistration,
      isRegistered: data.user?.isRegistered,
      nextStep: data.nextStep
    });

    toast.success("Login successful!");

    // Always clear mustChangePassword from session data so the guard never fires
    // on a returning visit after a successful password change
    const userToStore = {
      ...data.user,
      mustChangePassword: false,
    };

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(userToStore));

    // Handle Remember Me
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", data.user?.email || formData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    console.log("[LoginModal] Data stored in sessionStorage");
    onClose();

    // Navigate based on user state
    // First-time students who just changed their password need to complete registration
    if (data.user?.passwordJustChanged && !data.user?.hasRegistration) {
      console.log("[LoginModal] First-time login, password changed → /complete-registration");
      sessionStorage.setItem("signupEmail", data.user.email);
      sessionStorage.setItem("signupFullName", data.user.fullName);
      navigate("/complete-registration");
      return;
    }

    // Regular returning user without registration
    if (data.user && !data.user.hasRegistration && !data.user.isRegistered) {
      console.log("[LoginModal] User needs to complete registration → /complete-registration");
      sessionStorage.setItem("signupEmail", data.user.email);
      sessionStorage.setItem("signupFullName", data.user.fullName);
      navigate("/complete-registration");
      return;
    }

    // All other users → dashboard (or nextStep from backend)
    const nextStep = data.nextStep || "/dashboard";
    console.log("[LoginModal] Navigating to:", nextStep);
    navigate(nextStep);
  }, [rememberMe, formData.email, onClose, navigate]);

  // Handle OTP verification success
  const handleOtpSuccess = (data) => {
    // Check if password change is required (first-time login)
    if (data.requirePasswordChange) {
      setShowOtpModal(false);
      setPasswordData({
        tempToken: data.tempToken,
        email: data.email,
        fullName: data.fullName
      });
      setShowPasswordModal(true);
    } else {
      // Regular login - proceed to dashboard
      setShowOtpModal(false);
      handleLoginSuccess(data);
    }
  };

  // Handle password change success
  const handlePasswordSuccess = (data) => {
    setShowPasswordModal(false);
    handleLoginSuccess(data);
  };

  const handleOtpClose = () => {
    setShowOtpModal(false);
    setOtpData({ tempToken: "", email: "", flowType: "login" });
  };

  const handlePasswordClose = () => {
    // Security: don't allow dismissal — close everything and force re-login
    setShowPasswordModal(false);
    setPasswordData({ tempToken: "", email: "", fullName: "" });
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showOtpModal && !showPasswordModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
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
              {/* Header */}
              <div className="bg-gray-50 p-8 flex flex-col items-center justify-center border-b border-gray-100 relative">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors z-30"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="relative mb-3 z-10 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 w-14 h-14 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#1a3884]" />
                </div>
                <h2 className="text-gray-900 text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-90 pt-3 px-6 text-center z-10">
                  Welcome Back
                </h2>
                <p className="text-[13px] text-gray-500 mt-2 text-center px-8">
                  Enter your registered credentials to access your secure portal.
                </p>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email / Student ID</label>
                    <div
                      className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#f8fafc] border border-[#e2e8f0]"
                      onFocusCapture={(e) => {
                        e.currentTarget.style.border = "1.5px solid #1a3884";
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.1)";
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.border = "1px solid #e2e8f0";
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 group-focus-within:border-[#1a3884]/30 transition-all">
                        <Mail className="w-3.5 h-3.5 text-[#1a3884]" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="text"
                        autoComplete="username"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com or Student ID"
                        className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                    </div>
                    <div
                      className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#f8fafc] border border-[#e2e8f0]"
                      onFocusCapture={(e) => {
                        e.currentTarget.style.border = "1.5px solid #1a3884";
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.boxShadow = "0 0 0 4px rgba(26,56,132,0.1)";
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
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between px-1 -mt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-[#1a3884] checked:border-[#1a3884] transition-all cursor-pointer"
                        />
                        <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none transition-opacity">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-700 transition-colors">
                        Remember Me
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-[#112b6b]/20 mt-4 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
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
                  <p className="text-gray-400 text-[12px] font-medium">
                    Don't have an account?{" "}
                    <button
                      onClick={() => {
                        onClose();
                        onSwitchToSignup();
                      }}
                      className="font-bold text-[#1a3884] hover:text-[#112b6b] transition-colors ml-1 underline underline-offset-4"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OTP Verification Modal */}
      <LoginOtpModal
        isOpen={showOtpModal}
        onClose={handleOtpClose}
        tempToken={otpData.tempToken}
        email={otpData.email}
        onSuccess={handleOtpSuccess}
      />

      {/* First Login Password Change Modal */}
      <FirstLoginPasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordClose}
        tempToken={passwordData.tempToken}
        email={passwordData.email}
        fullName={passwordData.fullName}
        onSuccess={handlePasswordSuccess}
      />
    </>
  );
};

export default LoginModal;
