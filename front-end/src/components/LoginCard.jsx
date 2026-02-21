import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, Building2, Loader2, Eye, EyeOff } from "lucide-react";
import InstitutionSelector from "./InstitutionSelector";
import { API_BASE_URL, apiCall } from "@/services/api";
import LoginOtpModal from "./auth/LoginOtpModal";
import ForgotPasswordModal from "./auth/ForgotPasswordModal";
import FirstLoginPasswordModal from "./auth/FirstLoginPasswordModal";
import { resetUserIdCache } from "@/features/visionBoard/services/visionBoardProApi";
import { useUser } from "@/contexts/UserContext";

const LoginCard = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showInstitutionSelector, setShowInstitutionSelector] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");

  // OTP verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState({ tempToken: "", email: "" });

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // First login password change state
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({ tempToken: "", email: "", fullName: "" });

  // Check if institution is already selected
  useEffect(() => {
    const storedInstitution = sessionStorage.getItem("selectedInstitution");
    if (storedInstitution) {
      try {
        const institution = JSON.parse(storedInstitution);
        setSelectedInstitution(institution);
        setShowInstitutionSelector(false);
      } catch (error) {
        console.error('Error parsing stored institution:', error);
        sessionStorage.removeItem("selectedInstitution");
      }
    }
  }, []);

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!selectedInstitution) {
      toast.error("Please select your institution first");
      return;
    }

    // Allow login with ID (no strict email check)
    if (!loginEmail.trim()) {
      toast.error("Please enter your Email or Student ID");
      return;
    }

    if (loginPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend login endpoint with college validation
      const normalizedEmail = loginEmail.trim().toLowerCase();

      const data = await apiCall('/auth/login', {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password: loginPassword,
          collegeCode: selectedInstitution.code,
        }),
      });

      console.log('Login success data:', data);

      // Check if password change is required (first login)
      if (data.requirePasswordChange) {
        toast.info("Please change your password to continue");
        setPasswordChangeData({
          tempToken: data.tempToken,
          email: data.email,
          fullName: data.fullName,
        });
        setShowPasswordChangeModal(true);
        setIsLoading(false);
        return;
      }

      // Check if OTP verification is required
      if (data.requireOtp) {
        toast.success("OTP sent to your email!");
        setOtpData({
          tempToken: data.tempToken,
          email: data.email,
        });
        setShowOtpModal(true);
        setIsLoading(false);
        return;
      }

      // Direct login for first-time users (no OTP required)
      sessionStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("token", data.token);

      setUser(data.user);

      toast.success("Login successful!");

      // Check if user has completed comprehensive registration
      if (data.user.hasRegistration) {
        // User has registration details, go to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // User needs to complete registration
        sessionStorage.setItem("signupEmail", data.user.email);
        sessionStorage.setItem("signupFullName", data.user.fullName);
        navigate("/complete-registration", { replace: true });
      }
    } catch (error) {
      console.error("Login detail error:", error);
      // apiCall handles most errors, but we might want to catch specifically for unauthorized/forbidden
      if (error.message.includes('not completed')) {
        toast.error("Registration not completed. Please complete your registration.");
      } else if (error.message.includes('Invalid credentials')) {
        toast.error("Invalid email or password");
      } else if (error.message.includes('unauthorized')) {
        toast.error("Invalid credentials or unauthorized for this institution");
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error("Failed to connect to server. Please ensure backend is running.");
      } else {
        toast.error(error.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!signupName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!validateEmail(signupEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Store signup data
      sessionStorage.setItem("signupFullName", signupName);
      sessionStorage.setItem("signupEmail", signupEmail);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Proceeding to registration details!");
      navigate("/signup");
      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to proceed. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle institution selection
  const handleInstitutionSelected = () => {
    const storedInstitution = sessionStorage.getItem("selectedInstitution");
    if (storedInstitution) {
      try {
        const institution = JSON.parse(storedInstitution);
        setSelectedInstitution(institution);
        setShowInstitutionSelector(false);
      } catch (error) {
        console.error('Error parsing stored institution:', error);
      }
    }
  };

  const handleChangeInstitution = () => {
    sessionStorage.removeItem("selectedInstitution");
    setSelectedInstitution(null);
    setShowInstitutionSelector(true);
  };

  // OTP success handler
  const handleOtpSuccess = (data) => {
    // Check if password change is required (first-time login after OTP)
    if (data.requirePasswordChange) {
      setShowOtpModal(false);
      setPasswordChangeData({
        tempToken: data.tempToken,
        email: data.email,
        fullName: data.fullName,
      });
      setShowPasswordChangeModal(true);
      return;
    }

    // Regular login success
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    
    setUser(data.user);
    setShowOtpModal(false);

    // Clear vision board cache to ensure fresh data for this user
    resetUserIdCache();

    // Check if user needs registration or use nextStep from backend
    if (data.nextStep) {
      navigate(data.nextStep, { replace: true });
    } else if (!data.user?.hasRegistration) {
      // New user without registration - go to registration page
      sessionStorage.setItem("signupEmail", data.user?.email || "");
      sessionStorage.setItem("signupFullName", data.user?.fullName || "");
      navigate("/complete-registration", { replace: true });
    } else {
      // Returning user - go to dashboard
      navigate("/dashboard", { replace: true });
    }
  };

  // OTP modal close handler
  const handleOtpClose = () => {
    setShowOtpModal(false);
    setOtpData({ tempToken: "", email: "" });
  };

  // First login password change success handler
  const handlePasswordChangeSuccess = (data, redirectToDashboard = false) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    
    setUser(data.user);
    setShowPasswordChangeModal(false);
    setPasswordChangeData({ tempToken: "", email: "", fullName: "" });

    // Clear vision board cache to ensure fresh data for this user
    resetUserIdCache();

    // Check if user needs to complete registration
    if (redirectToDashboard || data.user?.hasRegistration) {
      // User already registered, go to dashboard
      navigate("/dashboard", { replace: true });
    } else {
      // New user - redirect to registration page
      sessionStorage.setItem("signupEmail", data.user?.email || "");
      sessionStorage.setItem("signupFullName", data.user?.fullName || "");
      navigate("/complete-registration", { replace: true });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Show institution selector first
  if (showInstitutionSelector) {
    return (
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl mx-auto px-0">
        <InstitutionSelector onSelect={handleInstitutionSelected} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto space-y-4 sm:space-y-6">
      {/* Selected Institution Display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-[#002147]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 flex items-center justify-between group hover:border-[#1a3884]/30 transition-all gap-2 sm:gap-3 md:gap-4 shadow-xl"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-[#1a3884]/10 dark:bg-[#1a3884]/20 flex items-center justify-center border border-[#1a3884]/20 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#1a3884]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#002147] dark:text-white text-xs sm:text-sm md:text-base truncate tracking-tight">{selectedInstitution?.name}</h3>
            {selectedInstitution?.code && (
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                {selectedInstitution.code}
                {selectedInstitution?.location?.city && (
                  <span className="opacity-60"> • {selectedInstitution.location.city}</span>
                )}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleChangeInstitution}
          className="text-[#1a3884] hover:text-[#132c6b] hover:bg-[#1a3884]/5 dark:hover:bg-white/5 shrink-0 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest px-2 sm:px-3 border border-transparent hover:border-[#1a3884]/20 h-8 sm:h-9 rounded-lg"
        >
          Change
        </Button>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 dark:bg-[#002147]/90 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1a3884]/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#daa520]/10 to-transparent pointer-events-none" />

        {/* Login Header */}
        <div className="text-center mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#1a3884] to-[#132c6b] text-white shadow-lg shadow-[#1a3884]/20 mb-2 sm:mb-3 md:mb-4 lg:mb-6"
          >
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
          </motion.div>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#002147] dark:text-white mb-1 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] md:text-xs font-light">Enter your credentials to access the portal</p>
        </div>

        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6"
          onSubmit={handleLogin}
          aria-label="Login form"
        >
          {/* Screen reader live region */}
          <div role="status" aria-live="polite" className="sr-only" id="login-status">
            {isLoading ? "Logging in, please wait..." : ""}
          </div>

          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="login-email" className="text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest pl-1">Email or Student ID</Label>
            <div className="relative group">
              <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-[#1a3884] transition-colors" aria-hidden="true" />
              <Input
                id="login-email"
                type="text"
                placeholder="Email or Student ID (e.g. STU123)"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                aria-required="true"
                autoComplete="username"
                className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 focus:border-[#1a3884] focus:ring-2 sm:focus:ring-4 focus:ring-[#1a3884]/10 text-[#002147] dark:text-white pl-9 sm:pl-11 h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium text-xs sm:text-sm"
                required
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="login-password" className="text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest pl-1">Security Key</Label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest font-bold text-[#1a3884] hover:text-[#132c6b] transition-colors focus:outline-none"
              >
                Forgot?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-[#1a3884] transition-colors" aria-hidden="true" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                aria-required="true"
                autoComplete="current-password"
                className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 focus:border-[#1a3884] focus:ring-2 sm:focus:ring-4 focus:ring-[#1a3884]/10 text-[#002147] dark:text-white pl-9 sm:pl-11 pr-9 sm:pr-11 h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium text-xs sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3884] transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2 sm:pt-3 md:pt-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#1a3884] to-[#132c6b] hover:from-[#132c6b] hover:to-[#1a3884] text-white h-10 sm:h-11 md:h-12 lg:h-13 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl shadow-xl shadow-[#1a3884]/20 hover:shadow-2xl hover:shadow-[#1a3884]/30 hover:-translate-y-0.5 transition-all duration-300 group"
              disabled={isLoading}
              aria-describedby="login-status"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin" />
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>

      {/* OTP Verification Modal */}
      <LoginOtpModal
        isOpen={showOtpModal}
        onClose={handleOtpClose}
        tempToken={otpData.tempToken}
        email={otpData.email}
        onSuccess={handleOtpSuccess}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      {/* First Login Password Change Modal */}
      <FirstLoginPasswordModal
        isOpen={showPasswordChangeModal}
        onClose={() => { }} // Cannot close - must change password
        tempToken={passwordChangeData.tempToken}
        email={passwordChangeData.email}
        fullName={passwordChangeData.fullName}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
};

export default LoginCard;


