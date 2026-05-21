import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import NeuralBackground from "@/components/ui/NeuralBackground";

const SignupSuccess = () => {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] flex items-center justify-center px-4 py-8 relative overflow-hidden transition-colors duration-300">
      <NeuralBackground theme={theme} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-100/50 opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/40 opacity-50 blur-[100px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 md:p-12 w-full max-w-md shadow-[0_20px_40px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
          className="flex justify-center mb-6 sm:mb-8"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
            <CheckCircle className="w-full h-full text-[#1a3884]" strokeWidth={1.5} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute inset-0 rounded-full border-2 border-[#1a3884] opacity-30"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 sm:space-y-4 mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-gray-900">
            Registration Successful!
          </h1>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
            Your account has been created. You can now log in to access your dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 sm:mt-8"
        >
          <Link to="/" className="block">
            <Button 
              className="w-full text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(to right, #1a3884, #002147)' }}
            >
              Try logging in now!
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignupSuccess;


