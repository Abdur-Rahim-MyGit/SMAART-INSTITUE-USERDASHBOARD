import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import blueLogo from "@/assets/blue.png";

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call or use existing logic from SignupInitial
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in sessionStorage for next step (ComprehensiveSignup)
      sessionStorage.setItem("signupFullName", formData.fullName);
      sessionStorage.setItem("signupEmail", formData.email);

      toast.success("Account created! Proceeding to setup...");
      onClose();
      navigate("/signup"); // Redirect to full registration flow
    } catch (error) {
      toast.error("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[420px] bg-white overflow-hidden shadow-2xl z-10 flex flex-col"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.04)",
              borderRadius: "24px",
            }}
          >
            {/* Header */}
            <div className="bg-gray-50 p-8 flex flex-col items-center justify-center border-b border-gray-100 relative">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors z-30"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative mb-3 z-10 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 w-14 h-14 flex items-center justify-center">
                <User className="w-6 h-6 text-[#1a3884]" />
              </div>
              <h2 className="text-gray-900 text-xs font-bold font-sans tracking-[0.2em] uppercase opacity-90 pt-3 px-6 text-center z-10">
                Join SMAART Institute
              </h2>
              <p className="text-[13px] text-gray-500 mt-2 text-center px-8">
                Create your student account to access premium educational resources.
              </p>
            </div>

            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div 
                    className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#f8fafc] border border-[#e2e8f0]"
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
                      <User className="w-3.5 h-3.5 text-[#1a3884]" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div 
                    className="relative group flex items-center gap-2.5 px-3.5 rounded-xl h-11 transition-all bg-[#f8fafc] border border-[#e2e8f0]"
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
                      <Mail className="w-3.5 h-3.5 text-[#1a3884]" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="flex-1 bg-transparent outline-none text-[13px] sm:text-sm font-semibold placeholder:font-normal placeholder:text-gray-400 text-[#112b6b]"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-[#112b6b]/20 mt-4 text-white transition-all hover:-translate-y-1 active:translate-y-0 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Get Started
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-gray-50">
                <p className="text-gray-400 text-[12px] font-medium">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      onClose();
                      onSwitchToLogin();
                    }}
                    className="font-bold text-[#1a3884] hover:text-[#112b6b] transition-colors ml-1 underline underline-offset-4"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
  );
};

export default SignupModal;

