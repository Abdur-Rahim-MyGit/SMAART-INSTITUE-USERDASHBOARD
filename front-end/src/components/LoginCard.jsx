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
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-xl mx-auto px-0">
        <InstitutionSelector onSelect={handleInstitutionSelected} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto flex flex-col gap-3 sm:gap-4">

      {/* ── Institution Badge ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-between gap-3 px-4 py-2"
        style={{
          background: "#ffffff",
          border: "2px solid #BC9B6A",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          borderRadius: "0px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-none flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #f8f9fc 0%, #eef2fb 100%)",
              border: "1px solid rgba(188,155,106,0.3)",
            }}
          >
            <Building2 className="w-5 h-5 text-[#1a3884]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#0d1f4e] text-sm truncate leading-tight">
              {selectedInstitution?.name}
            </p>
            {selectedInstitution?.location?.city && (
              <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
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
          className="text-[11px] font-bold uppercase tracking-widest text-[#1a3884] hover:text-[#132c6b] transition-colors shrink-0 px-1"
        >
          Change
        </button>
      </motion.div>

      {/* ── Login Form Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden"
        style={{
          background: "#ffffff",
          border: "2px solid #BC9B6A",
          boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.06)",
          borderRadius: "0px",
        }}
      >
        <div className="px-5 pt-6 pb-5 sm:px-6 sm:pt-7 sm:pb-6">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
            <div
              className="w-12 h-12 flex items-center justify-center mb-3 shadow-md rounded-none"
              style={{
                background: "linear-gradient(135deg, #1a3884 0%, #102567 100%)",
                boxShadow: "0 8px 24px rgba(26,56,132,0.30)",
                width: "52px",
                height: "52px",
              }}
            >
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2
              className="text-lg sm:text-xl font-extrabold tracking-tight mb-0.5"
              style={{ color: "#0d1f4e", letterSpacing: "-0.01em" }}
            >
              Welcome Back
            </h2>
            <p className="text-gray-400 text-[11px] sm:text-[12px] font-normal">
              Enter your credentials to access the portal
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
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest pl-0.5"
                style={{ color: "#4e5d78" }}
              >
                Email or Student ID
              </label>
              <div
                className="flex items-center gap-2.5 px-3.5 rounded-none h-10 transition-all group"
                style={{
                  background: "#f8f9fc",
                  border: "1.2px solid #e3e8f4",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.border = "1.5px solid #1a3884";
                  e.currentTarget.style.background = "#f0f4ff";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.border = "1.5px solid #e3e8f4";
                  e.currentTarget.style.background = "#f5f7fc";
                }}
              >
                <Mail className="w-4 h-4 shrink-0" style={{ color: "#8fa3c4" }} />
                <input
                  id="login-email"
                  type="text"
                  placeholder="Email or Student ID (e.g. STU123)"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  aria-required="true"
                  autoComplete="username"
                  required
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-medium placeholder:font-normal"
                  style={{ color: "#0d1f4e" }}
                />
              </div>
            </div>

            {/* Security Key */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pl-0.5">
                <label
                  htmlFor="login-password"
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: "#4e5d78" }}
                >
                  Security Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors"
                  style={{ color: "#1a3884" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0d1f4e")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#1a3884")}
                >
                  Forgot?
                </button>
              </div>
              <div
                className="flex items-center gap-2.5 px-3.5 rounded-none h-10 transition-all"
                style={{
                  background: "#f8f9fc",
                  border: "1.2px solid #e3e8f4",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.border = "1.5px solid #1a3884";
                  e.currentTarget.style.background = "#f0f4ff";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.border = "1.5px solid #e3e8f4";
                  e.currentTarget.style.background = "#f5f7fc";
                }}
              >
                <Lock className="w-4 h-4 shrink-0" style={{ color: "#8fa3c4" }} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  aria-required="true"
                  autoComplete="current-password"
                  required
                  className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-medium placeholder:font-normal"
                  style={{ color: "#0d1f4e" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 transition-colors"
                  style={{ color: "#8fa3c4" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#1a3884")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8fa3c4")}
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
              className="relative w-full h-10 flex items-center justify-center gap-2 font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 mt-0.5 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden rounded-none"
              style={{
                background: "linear-gradient(90deg, #1a3884 0%, #1e47ad 100%)",
                boxShadow: "0 6px 20px rgba(26,56,132,0.25)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.boxShadow = "0 10px 32px rgba(26,56,132,0.42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(26,56,132,0.32)";
              }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
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
