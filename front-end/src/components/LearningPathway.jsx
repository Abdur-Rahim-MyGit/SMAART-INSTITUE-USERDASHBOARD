import { motion } from "framer-motion";
import { Flag, Lock } from "lucide-react";

const LearningPathway = ({ modules = [] }) => {
  // Default modules if none provided
  const defaultModules = [
    { id: 1, title: "Fundamentals of Stock Markets", status: "completed", duration: "12 hrs mins", locked: false },
    { id: 2, title: "Selecting Right Stock", status: "locked", duration: "29 hrs mins", locked: true },
    { id: 3, title: "Conduct Financial Overview", status: "pending", duration: "15 hrs mins", locked: false },
    { id: 4, title: "Risk Management Strategies", status: "pending", duration: "18 hrs mins", locked: false },
    { id: 5, title: "Portfolio Building", status: "pending", duration: "22 hrs mins", locked: false },
  ];

  const pathwayModules = modules.length > 0 ? modules : defaultModules;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const carVariants = {
    initial: { x: 0 },
    animate: {
      x: "calc(100% - 60px)",
      transition: {
        duration: 8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  };

  const wheelVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-sans font-bold text-white">
          Your Learning Pathway is about to start
        </h2>
        <p className="text-gray-700">
          Complete each module to progress through your learning journey
        </p>
      </motion.div>

      {/* Pathway Visualization */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 overflow-hidden border border-gray-700"
      >
        {/* Animated Car */}
        <motion.div
          variants={carVariants}
          initial="initial"
          animate="animate"
          className="absolute top-8 left-0 z-20"
        >
          <div className="flex items-center gap-1">
            {/* Car Body */}
            <div className="w-12 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg relative shadow-lg">
              {/* Windows */}
              <div className="absolute top-1 left-1 w-3 h-2 bg-gray-200 rounded-sm opacity-70"></div>
              <div className="absolute top-1 right-1 w-3 h-2 bg-gray-200 rounded-sm opacity-70"></div>
            </div>
            {/* Wheels */}
            <motion.div
              variants={wheelVariants}
              animate="animate"
              className="w-3 h-3 bg-black rounded-full"
            ></motion.div>
            <motion.div
              variants={wheelVariants}
              animate="animate"
              className="w-3 h-3 bg-black rounded-full"
            ></motion.div>
          </div>
        </motion.div>

        {/* Pathway Line */}
        <div className="relative pt-20 pb-8">
          {/* Dashed Line */}
          <svg className="absolute top-16 left-0 w-full h-2" preserveAspectRatio="none">
            <line
              x1="0"
              y1="8"
              x2="100%"
              y2="8"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="8,8"
              className="text-gray-600"
            />
          </svg>

          {/* Modules */}
          <div className="relative flex justify-between items-end gap-4">
            {pathwayModules.map((module, index) => (
              <motion.div
                key={module.id}
                variants={itemVariants}
                className="flex-1 flex flex-col items-center"
              >
                {/* Stop Point */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 relative z-10 transition-all ${
                    module.status === "completed"
                      ? "bg-white shadow-lg shadow-white/50"
                      : module.status === "locked"
                      ? "bg-gray-600"
                      : "bg-gray-400 shadow-lg shadow-gray-400/50"
                  }`}
                >
                  {module.status === "completed" ? (
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : module.status === "locked" ? (
                    <Lock className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-black font-bold text-sm">{index + 1}</span>
                  )}
                </motion.div>

                {/* Module Card */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className={`w-full rounded-xl p-4 text-center transition-all ${
                    module.locked
                      ? "bg-gray-700/50 border border-gray-600"
                      : module.status === "completed"
                      ? "bg-gray-300/30 border border-gray-400/50"
                      : "bg-gray-600/30 border border-gray-500/50"
                  }`}
                >
                  <h3 className="font-semibold text-sm text-white mb-2 line-clamp-2">
                    {module.title}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-300">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
                    </svg>
                    <span>{module.duration}</span>
                  </div>
                  {module.locked && (
                    <p className="text-xs text-gray-700 mt-2">Locked</p>
                  )}
                </motion.div>
              </motion.div>
            ))}

            {/* Goal Flag */}
            <motion.div
              variants={itemVariants}
              className="flex-1 flex flex-col items-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4 relative z-10 bg-white shadow-lg shadow-white/50"
              >
                <Flag className="w-6 h-6 text-black fill-black" />
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="w-full rounded-xl p-4 text-center bg-gray-300/30 border border-gray-400/50"
              >
                <h3 className="font-semibold text-sm text-white mb-2">
                  Goal Achieved!
                </h3>
                <p className="text-xs text-gray-300">
                  Complete all modules
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="space-y-2"
      >
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700">Overall Progress</p>
          <p className="text-sm font-bold text-white">
            {Math.round((pathwayModules.filter(m => m.status === "completed").length / pathwayModules.length) * 100)}%
          </p>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(pathwayModules.filter(m => m.status === "completed").length / pathwayModules.length) * 100}%` }}
            transition={{ duration: 1, delay: 1 }}
            className="h-full bg-gradient-to-r from-white to-gray-400 rounded-full"
          ></motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LearningPathway;

