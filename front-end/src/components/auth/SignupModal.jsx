import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-navy border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="p-8 pb-0 text-center relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-16 h-16 bg-gradient-to-br from-teal/20 to-teal/5 rounded-2xl border border-teal/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal/10">
                <User className="w-8 h-8 text-teal" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Create Account</h2>
              <p className="text-white/50">Join SMAART Institute today</p>
            </div>

            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 group">
                  <Label htmlFor="fullName" className="text-white/70 group-focus-within:text-teal transition-colors">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-teal transition-colors" />
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-teal focus:ring-1 focus:ring-teal transition-all duration-300 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="email" className="text-white/70 group-focus-within:text-teal transition-colors">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-teal transition-colors" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-teal focus:ring-1 focus:ring-teal transition-all duration-300 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal to-teal-hover text-white font-bold py-6 rounded-xl shadow-lg shadow-teal/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-white/40 text-sm">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      onClose();
                      onSwitchToLogin();
                    }}
                    className="font-bold text-teal hover:text-teal-light transition-colors ml-1"
                  >
                    Login
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
