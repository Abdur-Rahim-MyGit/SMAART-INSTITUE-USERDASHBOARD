import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiCall } from "@/services/api";

import whiteLogo from "@/assets/white.png";

const SignupInitial = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsLoading(true);

    try {
      // SECURITY FIX #6: Call real backend OTP endpoint
      const data = await apiCall('/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), fullName: fullName.trim() }),
      });

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Store in sessionStorage for next step
      sessionStorage.setItem("signupFullName", fullName.trim());
      sessionStorage.setItem("signupEmail", email.trim());
      sessionStorage.setItem("signupTempToken", data.tempToken);

      toast.success("OTP sent to your email!");
      navigate("/verify-otp");
    } catch (error) {
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-10 md:py-12 px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-effect-glow rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-md shadow-[var(--shadow-purple)]"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex justify-center mb-6">
            <img src={whiteLogo} alt="SMAART Institute" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-background mb-1 sm:mb-2">
            Create Account
          </h1>
          <p className="text-background/70 text-sm sm:text-base">Join SMAART Institute today</p>
        </motion.div>

        <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label htmlFor="fullName" className="text-background text-sm sm:text-base">
              Full Name *
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-secondary/30 border-accent/30 text-background mt-1.5 sm:mt-2 h-10 sm:h-11"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label htmlFor="email" className="text-background text-sm sm:text-base">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/30 border-accent/30 text-background mt-1.5 sm:mt-2 h-10 sm:h-11"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-accent to-accent/80 hover:shadow-lg text-primary-foreground font-semibold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base h-10 sm:h-12"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-background/70 text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-accent hover:text-accent/80 font-semibold transition-colors"
              >
                Login
              </button>
            </p>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 pt-6 border-t border-accent/20 text-center"
        >
          <p className="text-background/60 text-xs">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </motion.div >
    </div >
  );
};

export default SignupInitial;
