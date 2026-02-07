import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiCall } from "@/services/api";

const VerifyOTP = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-10 md:py-12 px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-effect-glow rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md shadow-[var(--shadow-purple)]"
      >
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleGoBack}
          className="flex items-center gap-2 text-accent hover:text-accent/80 mb-4 sm:mb-6 transition text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-background mb-1 sm:mb-2">
            Verify OTP
          </h1>
          <p className="text-background/70 text-xs sm:text-sm">
            We've sent a 6-digit code to
          </p>
          <p className="text-accent font-semibold text-sm sm:text-base break-all">{email}</p>
        </motion.div>

        <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-1.5 sm:space-y-2"
          >
            <Label htmlFor="otp" className="text-background text-sm sm:text-base">
              Enter OTP Code *
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              maxLength="6"
              className="bg-secondary/30 border-accent/30 text-background placeholder:text-muted-foreground text-center text-xl sm:text-2xl tracking-widest font-mono h-12 sm:h-14"
              required
            />
            <p className="text-[10px] sm:text-xs text-background/60">
              Enter the 6-digit code sent to your email
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between p-3 sm:p-4 bg-accent/10 rounded-lg border border-accent/20"
          >
            <span className="text-background/80 text-xs sm:text-sm">Time remaining:</span>
            <span className={`font-mono font-bold text-sm sm:text-base ${timeLeft < 60 ? "text-destructive" : "text-accent"}`}>
              {formatTime(timeLeft)}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-foreground font-semibold py-4 sm:py-6 text-base sm:text-lg h-12 sm:h-14"
              disabled={isLoading || timeLeft === 0}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-background/70 text-xs sm:text-sm mb-2 sm:mb-3">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="w-full bg-secondary/30 hover:bg-secondary/50 text-background border border-accent/30 h-10 sm:h-12 text-sm sm:text-base"
            >
              {isLoading ? "Resending..." : "Resend OTP"}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 0.8 }}
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, hsl(174 62% 47% / 0.1) 0%, transparent 50%)`,
        }}
      />
    </div>
  );
};

export default VerifyOTP;
