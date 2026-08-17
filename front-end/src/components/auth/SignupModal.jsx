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
            <div className="bg-[#F8FAFC] p-8 flex flex-col items-center justify-center border-b border-gray-100 relative">
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
                Self-registration is currently disabled.
              </p>
            </div>

            {/* Support Message */}
            <div className="p-8 flex flex-col gap-6 text-center">
              <p className="text-gray-600 text-sm leading-relaxed">
                Accounts are managed by your institution administrator. To request an account, please contact us.
              </p>

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a3884]">
                  Contact Support
                </span>
                <a
                  href="mailto:hello@smaartinstitute.org?subject=SMAART%20Institute%20Account%20Request"
                  className="text-sm font-extrabold text-[#112b6b] hover:underline"
                >
                  hello@smaartinstitute.org
                </a>
              </div>

              <a
                href="mailto:hello@smaartinstitute.org?subject=SMAART%20Institute%20Account%20Request"
                className="relative w-full h-12 flex items-center justify-center gap-2 font-bold text-sm text-white transition-all duration-300 hover:-translate-y-1 active:translate-y-0 overflow-hidden rounded-xl shadow-lg shadow-[#112b6b]/20"
                style={{ background: "linear-gradient(135deg, #112b6b 0%, #1a3884 100%)" }}
              >
                <Mail className="w-4 h-4" />
                Contact via Email
              </a>

              <div className="mt-4 text-center pt-6 border-t border-gray-50">
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

export default SignupModal;

