import { motion } from "framer-motion";

const AssessmentBanner = ({ title = "ONBOARDING" }) => {
  // Icon components for the banner
  const icons = [
    // People icons
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
    // Gear icons
    "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.1-.62l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
    // Briefcase
    "M20 6h-2.18c-.16-1.05-.68-2.02-1.41-2.73L17 1.59c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L14.59 2.59c-.71-.73-1.68-1.25-2.73-1.41V0h-2v1.18c-1.05.16-2.02.68-2.73 1.41L6.41.18c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.59 1.59C5.86 4.98 5.34 5.95 5.18 7H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h17c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 15H3V8h17v11z",
    // Laptop/Monitor
    "M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14l4 4v-4h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12H4V5h14v10z",
    // Mail
    "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    // Handshake
    "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
    // Lightbulb
    "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-20C5.9 1 3 3.9 3 7c0 2.05.84 3.89 2.2 5.2.16.16.3.33.41.52.11.19.22.37.3.56h10.98c.08-.19.19-.37.3-.56.12-.19.25-.36.41-.52C19.16 10.89 20 9.05 20 7c0-3.1-2.9-6-6-6zm0 16h-4v2h4v-2z",
  ];

  const floatingVariants = {
    animate: (i) => ({
      y: [0, -20, 0],
      x: [0, 10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 4 + i * 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative w-full rounded-3xl overflow-hidden mb-8 border border-[#30919D]/20 shadow-lg bg-white"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#30919D]/5 to-transparent opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 py-8 md:px-12 md:py-10 text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl md:text-5xl font-display font-bold text-[#002147] drop-shadow-sm"
        >
          {title}
        </motion.h1>

      </div>
    </motion.div>
  );
};

export default AssessmentBanner;
