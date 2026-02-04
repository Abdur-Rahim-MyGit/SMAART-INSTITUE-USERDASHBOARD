import { motion } from "framer-motion";
import { Flag, Lock } from "lucide-react";

const StaircasePathway = ({ modules = [] }) => {
  // Default modules if none provided
  const defaultModules = [
    { id: 1, title: "Fundamentals of Stock Markets", status: "completed", duration: "12 hrs mins", locked: false },
    { id: 2, title: "Selecting Right Stock", status: "locked", duration: "29 hrs mins", locked: true },
    { id: 3, title: "Conduct Financial Overview", status: "pending", duration: "15 hrs mins", locked: false },
    { id: 4, title: "Risk Management Strategies", status: "pending", duration: "18 hrs mins", locked: false },
    { id: 5, title: "Portfolio Building", status: "pending", duration: "22 hrs mins", locked: false },
  ];

  const pathwayModules = modules.length > 0 ? modules : defaultModules;

  // Calculate character position based on completed modules
  const completedCount = pathwayModules.filter(m => m.status === "completed").length;
  const totalSteps = pathwayModules.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  // Character position calculation - moves to the completed step
  const getCharacterPosition = () => {
    if (completedCount === 0) {
      return { bottom: '5%', left: '5%' };
    }
    // Position character on the last completed step
    const stepIndex = completedCount - 1;
    const leftPosition = 10 + (stepIndex * 18); // Spacing between steps
    const bottomPosition = 10 + (stepIndex * 15); // Height increase per step
    return { bottom: `${bottomPosition}%`, left: `${leftPosition}%` };
  };

  const characterPosition = getCharacterPosition();

  // Character animation - gentle bobbing
  const characterVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Staircase step animation
  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
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
        <h2 className="text-2xl font-display font-bold text-white">
          Your Learning Staircase
        </h2>
        <p className="text-gray-700">
          Climb each step to reach your goal
        </p>
      </motion.div>

      {/* Staircase Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 md:p-12 overflow-hidden border border-gray-700 min-h-[500px]"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Staircase Steps and Cards */}
        <div className="relative h-full flex items-end justify-start gap-4 md:gap-6">
          {pathwayModules.map((module, index) => {
            const stepHeight = 60 + (index * 50); // Increasing height for each step

            return (
              <motion.div
                key={module.id}
                custom={index}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                className="relative flex flex-col items-center"
                style={{ marginBottom: `${stepHeight}px` }}
              >
                {/* Stair Platform */}
                <div
                  className={`w-32 md:w-40 h-16 md:h-20 rounded-lg mb-4 transition-all ${
                    module.status === "completed"
                      ? "bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-gray-300"
                      : module.status === "locked"
                      ? "bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600"
                      : "bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-500"
                  }`}
                />

                {/* Module Card */}
                <motion.div
                  whileHover={{ y: -5, scale: 1.05 }}
                  className={`w-32 md:w-40 rounded-xl p-3 md:p-4 text-center transition-all cursor-pointer shadow-lg ${
                    module.locked
                      ? "bg-gray-700/60 border-2 border-gray-600"
                      : module.status === "completed"
                      ? "bg-white/20 border-2 border-white/40"
                      : "bg-gray-600/40 border-2 border-gray-500/50"
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="flex justify-center mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                        module.status === "completed"
                          ? "bg-white text-black"
                          : module.status === "locked"
                          ? "bg-gray-600 text-white"
                          : "bg-gray-400 text-black"
                      }`}
                    >
                      {module.status === "completed" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : module.status === "locked" ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-xs md:text-sm text-white mb-1 line-clamp-2">
                    {module.title}
                  </h3>
                  <p className="text-xs text-gray-300">
                    {module.duration}
                  </p>
                  {module.locked && (
                    <p className="text-xs text-gray-700 mt-1">Locked</p>
                  )}
                </motion.div>
              </motion.div>
            );
          })}

          {/* Goal Flag */}
          <motion.div
            custom={pathwayModules.length}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col items-center"
            style={{ marginBottom: `${60 + (pathwayModules.length * 50)}px` }}
          >
            {/* Flag Platform */}
            <div className="w-32 md:w-40 h-16 md:h-20 rounded-lg mb-4 bg-gradient-to-br from-white to-gray-300 border-2 border-white" />

            {/* Goal Card */}
            <motion.div
              whileHover={{ y: -5, scale: 1.05 }}
              className="w-32 md:w-40 rounded-xl p-3 md:p-4 text-center bg-white/30 border-2 border-white/60 cursor-pointer shadow-lg"
            >
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-black shadow-md">
                  <Flag className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-semibold text-xs md:text-sm text-white mb-1">
                Goal Achieved!
              </h3>
              <p className="text-xs text-gray-300">
                Complete all
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated Character - Positioned based on progress */}
        <motion.div
          variants={characterVariants}
          animate="animate"
          className="absolute z-30 transition-all duration-1000 ease-in-out"
          style={{
            bottom: characterPosition.bottom,
            left: characterPosition.left,
          }}
        >
          <div className="flex flex-col items-center">
            {/* Character Head */}
            <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mb-1 shadow-lg border-2 border-gray-400">
              <div className="flex gap-1 justify-center mt-3">
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
              </div>
            </div>
            {/* Character Body */}
            <div className="w-7 h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-md shadow-md"></div>
            {/* Character Legs */}
            <div className="flex gap-1.5">
              <div className="w-2 h-5 bg-gray-400 rounded-sm"></div>
              <div className="w-2 h-5 bg-gray-400 rounded-sm"></div>
            </div>
          </div>
        </motion.div>
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
            {Math.round(progressPercentage)}%
          </p>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, delay: 1 }}
            className="h-full bg-gradient-to-r from-white to-gray-400 rounded-full"
          ></motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default StaircasePathway;
