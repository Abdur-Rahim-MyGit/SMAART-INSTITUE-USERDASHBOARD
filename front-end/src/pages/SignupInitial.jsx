import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiCall } from "@/services/api";
import { UserPlus, Mail, User, ArrowRight, Loader2 } from "lucide-react";
import blueLogo from "@/assets/blue.png";

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

            {/* Form */}
            <form onSubmit={handleSendOTP} className="flex flex-col gap-5">

              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-col gap-1.5"
              >
                <label
                  htmlFor="signup-fullname"
                  className="text-[10px] font-bold uppercase tracking-widest pl-0.5 text-gray-500"
                >
                  Full Name
                </label>
                <div
                  className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
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
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 group-focus-within:border-[#1a3884]/30 transition-all shrink-0">
                    <User className="w-3.5 h-3.5 text-[#1a3884] group-focus-within:scale-110 transition-transform" />
                  </div>
                  <input
                    id="signup-fullname"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    className="flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                  />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                className="flex flex-col gap-1.5"
              >
                <label
                  htmlFor="signup-email"
                  className="text-[10px] font-bold uppercase tracking-widest pl-0.5 text-gray-500"
                >
                  Email Address
                </label>
                <div
                  className="flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all group"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
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
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 group-focus-within:border-[#1a3884]/30 transition-all shrink-0">
                    <Mail className="w-3.5 h-3.5 text-[#1a3884] group-focus-within:scale-110 transition-transform" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                  />
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36, duration: 0.4 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full h-12 flex items-center justify-center gap-2 font-bold text-[15px] text-white transition-all duration-300 hover:-translate-y-1 active:translate-y-0 mt-2 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden rounded-xl shadow-xl shadow-[#112b6b]/20"
                  style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
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
                      Send Verification Code
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </>
                  )}
                </button>
              </motion.div>

              {/* Already have account */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.44 }}
                className="text-center"
              >
                <p className="text-gray-500 text-[13px]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-bold text-[#1a3884] hover:text-[#112b6b] transition-colors"
                  >
                    Login
                  </button>
                </p>
              </motion.div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 border-t border-gray-50">
            <p className="text-center text-[11px] text-gray-400 pt-5 leading-relaxed">
              By creating an account you agree to our{" "}
              <span className="font-semibold text-gray-500 cursor-pointer hover:text-[#1a3884] transition-colors">
                Terms of Service
              </span>{" "}
              &{" "}
              <span className="font-semibold text-gray-500 cursor-pointer hover:text-[#1a3884] transition-colors">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </motion.div>
  );
};

export default SignupInitial;
