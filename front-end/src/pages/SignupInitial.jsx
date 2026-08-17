import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

import { apiCall } from "@/services/api";
import { UserPlus, Mail, User, ArrowRight, Loader2 } from "lucide-react";
import blueLogo from "@/assets/blue.png";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

const SignupInitial = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
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
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#002147] flex items-center justify-center px-4 py-10">
      <NeuralBackground theme={theme} />
      {/* Background glow blobs — same as login page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100/50 opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 opacity-50 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{
            border: "1px solid rgba(0, 0, 0, 0.04)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {/* Top accent line */}
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#1a3884] to-transparent opacity-70" />

          <div className="px-8 pt-8 pb-8">
            {/* Logo + Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex flex-col items-center text-center mb-8"
            >
              <div
                className="w-24 h-24 flex items-center justify-center mb-4 bg-white rounded-2xl border border-[#1a3884]/10 shadow-lg"
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black tracking-tighter text-[#1a3884] leading-none">
                    SMAART
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Institute
                  </span>
                </div>
              </div>
              <h1
                className="text-2xl font-extrabold tracking-tight text-[#112b6b] mb-1"
                style={{ letterSpacing: "-0.02em" }}
              >
                Create Account
              </h1>
              <p className="text-gray-500 text-[13px] font-medium max-w-[240px]">
                Join SMAART Institute — your AI-powered career journey starts here
              </p>
            </motion.div>

            {/* Contact Admin View */}
            <div className="flex flex-col gap-6 text-center py-4">
              <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
                Self-registration is currently disabled. Accounts are created and managed by the institution administrator.
              </p>
              
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-white/5 border border-blue-100/50 dark:border-white/5 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a3884] dark:text-blue-300">
                  Contact Support
                </span>
                <a
                  href="mailto:hello@smaartinstitute.org?subject=SMAART%20Institute%20Account%20Request"
                  className="text-base font-extrabold text-[#112b6b] dark:text-blue-400 hover:underline"
                >
                  hello@smaartinstitute.org
                </a>
              </div>

              <a
                href="mailto:hello@smaartinstitute.org?subject=SMAART%20Institute%20Account%20Request"
                className="relative w-full h-12 flex items-center justify-center gap-2 font-bold text-[15px] text-white transition-all duration-300 hover:-translate-y-1 active:translate-y-0 mt-2 overflow-hidden rounded-xl shadow-xl shadow-[#112b6b]/20"
                style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
              >
                <Mail className="w-4 h-4" />
                Contact via Email
              </a>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-bold text-[#1a3884] hover:text-[#112b6b] transition-colors text-sm mt-2 underline underline-offset-4"
              >
                Back to Login
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 border-t border-gray-50">
            <p className="text-center text-[11px] text-gray-400 pt-5 leading-relaxed">
              By creating an account you agree to our{" "}
              <Link to="/legal?tab=terms-of-service" className="font-semibold text-gray-500 cursor-pointer hover:text-[#1a3884] transition-colors">
                Terms of Service
              </Link>{" "}
              &{" "}
              <Link to="/legal?tab=privacy-policy" className="font-semibold text-gray-500 cursor-pointer hover:text-[#1a3884] transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupInitial;
