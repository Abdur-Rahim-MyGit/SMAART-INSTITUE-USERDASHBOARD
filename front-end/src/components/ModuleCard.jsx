import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Play, Calendar, Clock, BookOpen, ArrowLeft, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const ModuleCard = ({ module, index }) => {
  const navigate = useNavigate();
  
  // Module descriptions based on module number
  const getModuleDescription = (moduleId) => {
    const descriptions = {
      1: {
        day: "Module 1",
        title: "Foundation & Setup",
        description: "Begin your learning journey with essential concepts and foundational knowledge. This module covers the basic principles and sets up your understanding for advanced topics.",
        duration: "3 Days",
        tasks: 7
      },
      2: {
        day: "Module 2", 
        title: "Core Concepts",
        description: "Dive deeper into the core concepts and methodologies. Build upon your foundation with practical applications and real-world examples.",
        duration: "3 Days",
        tasks: 8
      },
      3: {
        day: "Module 3",
        title: "Advanced Applications",
        description: "Apply your knowledge to complex scenarios and advanced use cases. Develop critical thinking and problem-solving skills.",
        duration: "3 Days", 
        tasks: 7
      },
      4: {
        day: "Module 4",
        title: "Integration & Practice",
        description: "Integrate all learned concepts and practice through comprehensive exercises. Prepare for real-world implementation.",
        duration: "3 Days",
        tasks: 8
      }
    };
    
    return descriptions[moduleId] || {
      day: `Module ${moduleId}`,
      title: `Module ${moduleId}`,
      description: "Continue your learning journey with new concepts and practical applications.",
      duration: "3 Days",
      tasks: module.tasks.length
    };
  };

  const moduleInfo = getModuleDescription(module.id);
  const completedTasks = module.tasks.filter(t => t.completed).length;
  const progressPercentage = (completedTasks / module.tasks.length) * 100;

  // Locked module view
  if (module.locked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative glass-effect rounded-xl p-6 border-2 border-background/20 bg-gradient-to-br from-background/10 to-background/5 overflow-hidden"
        style={{ boxShadow: "var(--shadow-purple)" }}
      >
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-background/30 z-10 rounded-xl" />
        
        {/* Lock icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-background/20 flex items-center justify-center backdrop-blur-md border border-background/30">
              <Lock className="w-8 h-8 text-background/70" />
            </div>
            <div className="text-center">
              <p className="text-background/80 font-semibold">Module Locked</p>
              <p className="text-background/60 text-sm">Complete previous modules to unlock</p>
            </div>
          </div>
        </div>

        {/* Blurred content behind */}
        <div className="opacity-50">
          {/* Module Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-sans font-bold text-background">
                  {module.title}
                </h3>
                <p className="text-accent font-semibold">{moduleInfo.day}</p>
              </div>
            </div>
            
            <h4 className="text-lg font-semibold text-background mb-2">
              {moduleInfo.title}
            </h4>
            
            <p className="text-background/80 text-sm leading-relaxed">
              {moduleInfo.description}
            </p>
          </div>

          {/* Module Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/5">
              <Clock className="w-4 h-4 text-accent" />
              <div>
                <p className="text-xs text-background/70">Duration</p>
                <p className="text-sm font-semibold text-background">{moduleInfo.duration}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/5">
              <Calendar className="w-4 h-4 text-accent" />
              <div>
                <p className="text-xs text-background/70">Tasks</p>
                <p className="text-sm font-semibold text-background">{moduleInfo.tasks} Activities</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-background/30 to-background/20 w-0" />
            </div>
          </div>

          {/* Disabled button */}
          <div className="w-full py-3 px-4 bg-background/20 text-background/50 font-semibold rounded-lg text-center">
            Locked
          </div>
        </div>
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="glass-effect rounded-xl p-6 border-2 border-accent/30 bg-gradient-to-br from-secondary/20 to-secondary/5 hover:border-accent/60 transition-all"
      style={{ boxShadow: "var(--shadow-purple)" }}
    >
      {/* Module Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-2xl font-sans font-bold text-background">
              {module.title}
            </h3>
            <p className="text-accent font-semibold">{moduleInfo.day}</p>
          </div>
        </div>
        
        <h4 className="text-lg font-semibold text-background mb-2">
          {moduleInfo.title}
        </h4>
        
        <p className="text-background/80 text-sm leading-relaxed">
          {moduleInfo.description}
        </p>
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-background/5">
          <Clock className="w-4 h-4 text-accent" />
          <div>
            <p className="text-xs text-background/70">Duration</p>
            <p className="text-sm font-semibold text-background">{moduleInfo.duration}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-3 rounded-lg bg-background/5">
          <Calendar className="w-4 h-4 text-accent" />
          <div>
            <p className="text-xs text-background/70">Tasks</p>
            <p className="text-sm font-semibold text-background">{moduleInfo.tasks} Activities</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-background/70">Progress</span>
          <span className="text-accent font-bold">
            {completedTasks} / {module.tasks.length} completed
          </span>
        </div>
        
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, delay: (index * 0.1) + 0.3 }}
            className="h-full bg-gradient-to-r from-accent to-accent/70"
          />
        </div>
      </div>

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/dashboard/courses/module/${module.id}`)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-accent to-accent/80 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
      >
        <Play className="w-5 h-5" />
        {completedTasks === 0 ? 'Start Course' : 'Continue'}
      </motion.button>
    </motion.div>
  );
};

export default ModuleCard;

