import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const handleLoginSuccess = (data) => {
    console.log("[LoginModal] Login successful, storing user data:", {
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user?.email,
      hasRegistration: data.user?.hasRegistration,
      isRegistered: data.user?.isRegistered,
      nextStep: data.nextStep
    });

    toast.success("Login successful!");
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    console.log("[LoginModal] Data stored in sessionStorage");
    onClose();

    // Navigate based on nextStep or user state
    const nextStep = data.nextStep || "/dashboard";
    if (data.user && !data.user.hasRegistration && !data.user.isRegistered) {
      console.log("[LoginModal] User needs to complete registration - redirecting to /complete-registration");
      sessionStorage.setItem("signupEmail", data.user.email);
      sessionStorage.setItem("signupFullName", data.user.fullName);
      navigate("/complete-registration");
    } else {
      console.log("[LoginModal] Navigating to:", nextStep);
      navigate(nextStep);
    }
  };

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
      handleLoginSuccess(data);
      setShowOtpModal(false);
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
    setShowPasswordModal(false);
    setPasswordData({ tempToken: "", email: "", fullName: "" });
    // Also close main modal since flow was interrupted
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && !showOtpModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
              className="relative w-full max-w-md bg-navy border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              {/* Header */}
              <div className="p-8 pb-0 text-center relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 bg-gradient-to-br from-teal/20 to-teal/5 rounded-2xl border border-teal/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal/10">
                  <Lock className="w-8 h-8 text-teal" />
                </div>
                <h2 className="text-3xl font-sans font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-white/50">Enter your credentials to access your account</p>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-white/70 group-focus-within:text-teal transition-colors">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-teal transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-teal focus:ring-1 focus:ring-teal transition-all duration-300 h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white/70 group-focus-within:text-teal transition-colors">Password</Label>
                      <a href="#" className="text-xs font-medium text-teal hover:text-teal-light transition-colors">Forgot Password?</a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-teal transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-teal focus:ring-1 focus:ring-teal transition-all duration-300 h-12 rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-teal transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-teal-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Login <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-white/40 text-sm">
                    Don't have an account?{" "}
                    <button
                      onClick={() => {
                        onClose();
                        onSwitchToSignup();
                      }}
                      className="font-bold text-teal hover:text-teal-light transition-colors ml-1"
                    >
                      Sign Up
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

