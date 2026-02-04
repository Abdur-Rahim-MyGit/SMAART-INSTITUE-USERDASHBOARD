import { motion } from "framer-motion";
import { Wrench, Clock } from "lucide-react";

const ComingSoon = ({ title = "Coming Soon", subtitle = "Under Development" }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg mx-auto"
      >
        {/* Maintenance Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center backdrop-blur-sm border border-accent/30">
            <Wrench className="w-12 h-12 text-accent" />
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-4">
            {title}
          </h1>
          <h2 className="text-xl font-semibold text-accent mb-6">
            {subtitle}
          </h2>
          <p className="text-gray-800/80 leading-relaxed mb-8">
            We're working hard to bring you something amazing. This feature is currently under development and will be available soon.
          </p>
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3 glass-effect px-6 py-3 rounded-full border border-accent/20 max-w-fit mx-auto"
        >
          <Clock className="w-5 h-5 text-accent animate-pulse" />
          <span className="text-gray-800/90 font-medium">Expected Launch: Soon</span>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-gray-800/60 text-sm"
        >
          <p>Thank you for your patience while we improve your experience.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
