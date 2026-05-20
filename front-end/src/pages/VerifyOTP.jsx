import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, MailOpen } from "lucide-react";
import { apiCall } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [email, setEmail] = useState("");
  const [tempToken, setTempToken] = useState("");

  useEffect(() => {
    // Get email and tempToken from sessionStorage
    const storedEmail = sessionStorage.getItem("signupEmail");
    const storedToken = sessionStorage.getItem("signupTempToken");
    if (!storedEmail || !storedToken) {
      toast.error("Please start from signup");
      navigate("/signup-initial");
      return;
    }
    setEmail(storedEmail);
    setTempToken(storedToken);

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits");
      return;
    }

    if (timeLeft === 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    setIsLoading(true);

    try {
      // SECURITY FIX #6: Call real backend OTP verification
      const data = await apiCall('/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, otp }),
      });

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("OTP verified successfully!");
      
      // Store verification status
      sessionStorage.setItem("otpVerified", "true");
      sessionStorage.removeItem("signupTempToken");
      
      // Redirect to comprehensive signup
      navigate("/signup");
    } catch (error) {
      toast.error(error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      // SECURITY FIX #6: Call real backend resend endpoint
      const data = await apiCall('/auth/resend-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      });

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Update tempToken (backend issues a new one on resend)
      if (data.tempToken) {
        setTempToken(data.tempToken);
        sessionStorage.setItem("signupTempToken", data.tempToken);
      }

      toast.success("OTP resent to your email!");
      setOtp("");
      setTimeLeft(300);
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    sessionStorage.removeItem("signupEmail");
    sessionStorage.removeItem("signupFullName");
    sessionStorage.removeItem("signupTempToken");
    navigate("/signup-initial");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-10 md:py-12 px-3 sm:px-4 bg-[#f4f7fa] dark:bg-[#002147] relative overflow-hidden transition-colors duration-300">
      <NeuralBackground theme={theme} />
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100/50 opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 opacity-50 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 w-full max-w-md relative z-10"
        style={{
          border: "1px solid rgba(0, 0, 0, 0.04)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-400 hover:text-[#002147] mb-6 sm:mb-8 transition-colors text-sm sm:text-base tracking-wide font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-sm transform rotate-3 hover:rotate-0 transition-transform">
            <ShieldCheck className="w-8 h-8 text-[#002147]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-2" style={{ letterSpacing: "-0.01em" }}>
            Two-Step Verification
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed px-4">
            To secure your account, please enter the 6-digit code we just sent to
            <span className="block mt-1 font-bold text-[#002147]">{email}</span>
          </p>
        </motion.div>

        <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2.5"
          >
            <div className="flex justify-between items-end pl-0.5 pr-1">
              <Label htmlFor="otp" className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Security Code
              </Label>
              <span className="text-[10px] text-gray-400 font-medium">6 digits</span>
            </div>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
                // Auto-submit when 6 digits entered
                if (value.length === 6 && timeLeft > 0) {
                  setTimeout(() => {
                    document.getElementById('otp-submit-btn')?.click();
                  }, 100);
                }
              }}
              maxLength="6"
              className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-center text-xl sm:text-2xl tracking-[0.5em] font-mono h-14 sm:h-16 rounded-xl focus:border-[#002147] focus:ring-4 focus:ring-[#002147]/10 focus:bg-white outline-none transition-all shadow-sm"
              aria-describedby="otp-timer otp-label"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <MailOpen className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 text-[11px] sm:text-xs font-semibold uppercase tracking-widest">Time remaining</span>
            </div>
            <span className={`font-mono font-bold text-sm sm:text-base ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[#002147]"}`}>
              {formatTime(timeLeft)}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              id="otp-submit-btn"
              type="submit"
              disabled={isLoading || timeLeft === 0}
              className="w-full h-12 sm:h-14 rounded-xl text-sm sm:text-base font-bold shadow-[0_8px_24px_rgba(0,33,71,0.2)] mt-2 text-white transition-all hover:-translate-y-0.5 relative overflow-hidden group"
              style={{ background: "linear-gradient(90deg, #00152e 0%, #002147 100%)" }}
            >
              {isLoading ? "Verifying..." : "Verify & Proceed"}
              {!isLoading && (
                 <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6 border-t border-gray-100 pt-6"
          >
            <p className="text-gray-500 text-xs sm:text-sm mb-3">
              Didn't receive the verification code?
            </p>
            <Button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 h-10 sm:h-11 text-sm font-semibold transition-colors rounded-xl shadow-sm"
            >
              {isLoading ? "Resending..." : "Send New Code"}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Removed the redundant radial gradient div since we have glows in the main wrapper */}
    </div>
  );
};

export default VerifyOTP;

