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
import useUser from "@/hooks/useUser";
import InstitutionSelectModal from "./auth/InstitutionSelectModal";

const LoginCard = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showInstitutionSelector, setShowInstitutionSelector] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isInstitutionSelectOpen, setIsInstitutionSelectOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState({ tempToken: "", email: "" });

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({ tempToken: "", email: "", fullName: "" });




  useEffect(() => {
    const storedInstitution = sessionStorage.getItem("selectedInstitution");
    if (storedInstitution) {
      try {
        const institution = JSON.parse(storedInstitution);
        setSelectedInstitution(institution);
        setShowInstitutionSelector(false);
      } catch (error) {
        console.error("Error parsing stored institution:", error);
        sessionStorage.removeItem("selectedInstitution");
      }
    }
  }, []);

  const validateEmail = (email) =>
    String(email).toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!selectedInstitution) {
      toast.error("Please select your institution first");
      return;
    }

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
      const normalizedEmail = loginEmail.trim().toLowerCase();

      const data = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password: loginPassword,
          collegeCode: selectedInstitution.code,
        }),
      });

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

      if (data.requireOtp) {
        toast.success("OTP sent to your email!");
        setOtpData({ tempToken: data.tempToken, email: data.email });
        setShowOtpModal(true);
        setIsLoading(false);
        return;
      }

      login(data.user, data.token);



      toast.success("Login successful!");

      if (data.user.hasRegistration) {
        navigate("/dashboard", { replace: true });
      } else {
        sessionStorage.setItem("signupEmail", data.user.email);
        sessionStorage.setItem("signupFullName", data.user.fullName);
        navigate("/complete-registration", { replace: true });
      }
    } catch (error) {
      console.error("Login detail error:", error);
      if (error.message.includes("not completed")) {
        toast.error("Registration not completed. Please complete your registration.");
      } else if (error.message.includes("Invalid credentials")) {
        toast.error("Invalid email or password");
      } else if (error.message.includes("unauthorized")) {
        toast.error("Invalid credentials or unauthorized for this institution");
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        toast.error("Failed to connect to server. Please ensure backend is running.");
      } else {
        toast.error(error.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstitutionSelected = (institution) => {
    // If institution is passed (from InstitutionSelector), use it. 
    // Otherwise fallback to sessionStorage (legacy/initial load)
    const targetInstitution = institution || (
      sessionStorage.getItem("selectedInstitution") ?
        JSON.parse(sessionStorage.getItem("selectedInstitution")) :
        null
    );

    if (targetInstitution) {
      setSelectedInstitution(targetInstitution);
      setShowInstitutionSelector(false);
      setIsInstitutionSelectOpen(false);

      // CRITICAL FIX: If we are on an institution-specific page or the login page, 
      // sync the URL so the parent component (like Institution.jsx) updates its video/data
      if (window.location.pathname.includes('/institution/') || window.location.pathname.startsWith('/login')) {
        navigate(`/institution/${encodeURIComponent(targetInstitution.name)}`, { replace: true });
      }
    }
  };

  const handleChangeInstitution = () => {
    setIsInstitutionSelectOpen(true);
  };

  const handleOtpSuccess = (data) => {
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

    login(data.user, data.token);

    // Store session expiry for client-side 3-hour countdown
    if (data.sessionExpiresAt) {
      sessionStorage.setItem("sessionExpiresAt", data.sessionExpiresAt);
    }
    setShowOtpModal(false);
    resetUserIdCache();

    if (data.nextStep) {
      navigate(data.nextStep, { replace: true });
    } else if (!data.user?.hasRegistration) {
      sessionStorage.setItem("signupEmail", data.user?.email || "");
      sessionStorage.setItem("signupFullName", data.user?.fullName || "");
      navigate("/complete-registration", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleOtpClose = () => {
    setShowOtpModal(false);
    setOtpData({ tempToken: "", email: "" });
  };

  const handlePasswordChangeSuccess = (data, redirectToDashboard = false) => {
    login(data.user, data.token);
    if (data.sessionExpiresAt) {
      sessionStorage.setItem("sessionExpiresAt", data.sessionExpiresAt);
    }
    setShowPasswordChangeModal(false);
    setPasswordChangeData({ tempToken: "", email: "", fullName: "" });
    resetUserIdCache();

    if (redirectToDashboard || data.user?.hasRegistration) {
      navigate("/dashboard", { replace: true });
    } else {
      sessionStorage.setItem("signupEmail", data.user?.email || "");
      sessionStorage.setItem("signupFullName", data.user?.fullName || "");
      navigate("/complete-registration", { replace: true });
    }
  };

  const handlePasswordChangeClose = () => {
    setShowPasswordChangeModal(false);
    setPasswordChangeData({ tempToken: "", email: "", fullName: "" });
  };

  if (showInstitutionSelector) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto"
      >
        {/* ── Card wrapper — matches the LoginCard Soft-UI style exactly ── */}
        <div
          className="overflow-hidden bg-white dark:bg-[#002A5C] rounded-3xl border border-black/5 dark:border-white/10"
          style={{
            boxShadow: "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          {/* Navy top accent line */}
          <div className="h-[3px] bg-gradient-to-r from-transparent via-[#002147] to-transparent opacity-80" />

          {/* Header */}
          <div className="bg-[#F8FAFC] dark:bg-[#00152E] px-8 pt-8 pb-7 flex flex-col items-center border-b border-gray-100 dark:border-white/10">
            {/* Icon badge */}
            <div className="w-16 h-16 flex items-center justify-center mb-4 bg-white dark:bg-[#002147] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
              {selectedInstitution?.logo ? (
                <img
                  src={selectedInstitution.logo}
                  alt={selectedInstitution.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Building2 className="w-7 h-7 text-[#1a3884]" />
              )}
            </div>

            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#112b6b] dark:text-white text-center"
              style={{ letterSpacing: "-0.02em" }}
            >
              Select Your Institution
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-slate-300 mt-2 text-center max-w-[260px] leading-relaxed">
              Find your college to access your personalised career dashboard.
            </p>
          </div>

          {/* Search area */}
          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <InstitutionSelector onSelect={handleInstitutionSelected} />
          </div>
        </div>
      </motion.div>
    );
  }


  return (
    <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto flex flex-col gap-3 sm:gap-4">

      {/* ── Institution Badge ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-between gap-3 px-4 py-2 bg-white dark:bg-[#002A5C] border border-black/5 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-2xl"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#00152E] border border-slate-100 dark:border-white/10 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            {selectedInstitution?.logo ? (
              <img
                src={selectedInstitution.logo}
                alt={selectedInstitution.name}
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <Building2 className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight">
              {selectedInstitution?.name}
            </p>
            {selectedInstitution?.location?.city && (
              <p className="text-[11px] text-gray-500 dark:text-slate-300 font-medium truncate mt-0.5">
                {selectedInstitution.location.city}
                {selectedInstitution?.location?.state && (
                  <span className="opacity-70">, {selectedInstitution.location.state}</span>
                )}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleChangeInstitution}
          className="text-[11px] font-bold uppercase tracking-widest text-[#002147] dark:text-blue-400 hover:text-[#00152e] dark:hover:text-blue-300 transition-colors shrink-0 px-1"
        >
          Change
        </button>
      </motion.div>

      {/* ── Login Form Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden bg-white dark:bg-[#002A5C] relative rounded-[24px] border border-black/5 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#002147] to-transparent opacity-80" />
        <div className="px-5 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-8 relative z-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 flex items-center justify-center mb-4 bg-white dark:bg-[#00152E] rounded-2xl shadow-lg border border-[#1a3884]/5 dark:border-white/10 relative overflow-hidden"
              style={{
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
              }}
            >
              {selectedInstitution?.logo ? (
                <img
                  src={selectedInstitution.logo}
                  alt={selectedInstitution.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Lock className="w-7 h-7 text-[#1a3884]" />
              )}
            </motion.div>

            <h2
              className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1 text-[#112b6b] dark:text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Welcome Back
            </h2>
            <p className="text-gray-500 dark:text-slate-300 text-[12px] sm:text-[13px] font-medium max-w-[240px]">
              Access your personalized learning and career dashboard
            </p>
          </div>

          {/* Form */}
          <form
            className="flex flex-col gap-5"
            onSubmit={handleLogin}
            aria-label="Login form"
          >
            <div role="status" aria-live="polite" className="sr-only" id="login-status">
              {isLoading ? "Logging in, please wait..." : ""}
            </div>

            {/* Email / Student ID */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest pl-0.5 text-gray-500"
              >
                Email or Student ID
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group relative overflow-hidden border border-gray-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#00152E] focus-within:border-[#1a3884] dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-[#003366] focus-within:ring-4 focus-within:ring-[#1a3884]/10 dark:focus-within:ring-blue-400/20"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-[#002147] shadow-sm border border-gray-100 dark:border-white/10 group-focus-within:border-[#1a3884]/30 dark:group-focus-within:border-blue-400/30 transition-all">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-[#1a3884] dark:text-blue-400 group-focus-within:scale-110 transition-transform" />
                </div>
                <input
                  id="login-email"
                  type="text"
                  placeholder="Email or Student ID (e.g. STU123)"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  aria-required="true"
                  autoComplete="username"
                  required
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b] dark:text-white"
                />
              </div>
            </div>

            {/* Security Key */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pl-0.5">
                <label
                  htmlFor="login-password"
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-500"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedInstitution) {
                      toast.error("Please select your institution first");
                      return;
                    }
                    if (!loginEmail.trim()) {
                      toast.error("Please enter your registered email address first");
                      return;
                    }
                    if (!validateEmail(loginEmail.trim())) {
                      toast.error("Please enter a valid email address to reset your password");
                      return;
                    }
                    setShowForgotPassword(true);
                  }}
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors text-[#002147] dark:text-blue-400 hover:text-[#00152e] dark:hover:text-blue-300"
                >
                  Forgot?
                </button>
              </div>
              <div
                className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group relative overflow-hidden border border-gray-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#00152E] focus-within:border-[#1a3884] dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-[#003366] focus-within:ring-4 focus-within:ring-[#1a3884]/10 dark:focus-within:ring-blue-400/20"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-[#002147] shadow-sm border border-gray-100 dark:border-white/10 group-focus-within:border-[#1a3884]/30 dark:group-focus-within:border-blue-400/30 transition-all">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-[#1a3884] dark:text-blue-400 group-focus-within:scale-110 transition-transform" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  aria-required="true"
                  autoComplete="current-password"
                  required
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 transition-colors text-gray-400 hover:text-[#1a3884] p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>



            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-12 flex items-center justify-center gap-2 font-bold text-[15px] text-white transition-all duration-300 hover:-translate-y-1 active:translate-y-0 mt-2 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden rounded-xl shadow-xl shadow-[#112b6b]/20"
              style={{
                background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.boxShadow = "0 12px 36px rgba(17,43,107,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(17,43,107,0.25)";
              }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Portal
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </>
              )}
            </button>

            {/* Registration Link */}
            {/* <div className="mt-6 text-center">
              <span className="text-sm font-medium text-slate-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => navigate("/signup-initial")}
                className="text-sm font-bold text-[#1a3884] hover:text-[#2d5dc7] transition-colors underline decoration-[#1a3884]/30 hover:decoration-[#1a3884]"
              >
                Sign Up
              </button>
            </div> */}
          </form>
        </div>
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
        initialEmail={loginEmail.trim()}
      />

      {/* First Login Password Change Modal */}
      <FirstLoginPasswordModal
        isOpen={showPasswordChangeModal}
        onClose={handlePasswordChangeClose}
        tempToken={passwordChangeData.tempToken}
        email={passwordChangeData.email}
        fullName={passwordChangeData.fullName}
        onSuccess={handlePasswordChangeSuccess}
      />

      {/* Institution Selection Modal */}
      <InstitutionSelectModal
        isOpen={isInstitutionSelectOpen}
        onClose={() => setIsInstitutionSelectOpen(false)}
        onInstitutionSelected={handleInstitutionSelected}
      />
    </div>
  );
};

export default LoginCard;

