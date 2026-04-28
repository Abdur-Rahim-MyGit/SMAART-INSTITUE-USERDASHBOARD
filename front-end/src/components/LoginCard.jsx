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
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

      sessionStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("token", data.token);

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", normalizedEmail);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      setUser(data.user);
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

      // CRITICAL FIX: If we are on an institution-specific page, 
      // sync the URL so the parent component (like Institution.jsx) updates its video/data
      if (window.location.pathname.includes('/institution/')) {
        navigate(`/institution/${encodeURIComponent(targetInstitution.name)}`, { replace: true });
      }
    }
  };

  const handleChangeInstitution = () => {
    sessionStorage.removeItem("selectedInstitution");
    setSelectedInstitution(null);
    setShowInstitutionSelector(true);
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

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
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
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));
    if (data.user?.isFirstLogin) {
      sessionStorage.setItem("isFirstLogin", "true");
    }
    setUser(data.user);
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
          className="overflow-hidden bg-white rounded-3xl"
          style={{
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          {/* Navy top accent line */}
          <div className="h-[3px] bg-gradient-to-r from-transparent via-[#002147] to-transparent opacity-80" />

          {/* Header */}
          <div className="bg-gray-50 px-8 pt-8 pb-7 flex flex-col items-center border-b border-gray-100">
            {/* Icon badge */}
            <div className="w-14 h-14 flex items-center justify-center mb-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <Building2 className="w-6 h-6 text-[#1a3884]" />
            </div>

            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#112b6b] text-center"
              style={{ letterSpacing: "-0.02em" }}
            >
              Select Your Institution
            </h2>
            <p className="text-[13px] text-gray-500 mt-2 text-center max-w-[260px] leading-relaxed">
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
        className="flex items-center justify-between gap-3 px-4 py-2 bg-white"
        style={{
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          borderRadius: "16px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#1a3884]" />
            </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm truncate leading-tight">
              {selectedInstitution?.name}
            </p>
            {selectedInstitution?.location?.city && (
              <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
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
          className="text-[11px] font-bold uppercase tracking-widest text-[#002147] hover:text-[#00152e] transition-colors shrink-0 px-1"
        >
          Change
        </button>
      </motion.div>

      {/* ── Login Form Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden bg-white relative"
        style={{
          border: "1px solid rgba(0, 0, 0, 0.04)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
          borderRadius: "24px",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#002147] to-transparent opacity-80" />
        <div className="px-5 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-8 relative z-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 flex items-center justify-center mb-4 bg-white rounded-2xl shadow-lg border border-[#1a3884]/5 relative overflow-hidden"
              style={{
                boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
              }}
            >
              <Lock className="w-7 h-7 text-[#1a3884]" />
            </motion.div>

            <h2
              className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1 text-[#112b6b]"
              style={{ letterSpacing: "-0.02em" }}
            >
              Welcome Back
            </h2>
            <p className="text-gray-500 text-[12px] sm:text-[13px] font-medium max-w-[240px]">
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
                className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group relative overflow-hidden"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
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
                  <Mail className="w-3.5 h-3.5 shrink-0 text-[#1a3884] group-focus-within:scale-110 transition-transform" />
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
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
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
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors text-[#002147] hover:text-[#00152e]"
                >
                  Forgot?
                </button>
              </div>
              <div
                className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group relative overflow-hidden"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
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
                  <Lock className="w-3.5 h-3.5 shrink-0 text-[#1a3884] group-focus-within:scale-110 transition-transform" />
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
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between px-1 -mt-1">
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
      />

      {/* First Login Password Change Modal */}
      <FirstLoginPasswordModal
        isOpen={showPasswordChangeModal}
        onClose={() => { }}
        tempToken={passwordChangeData.tempToken}
        email={passwordChangeData.email}
        fullName={passwordChangeData.fullName}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
};

export default LoginCard;

