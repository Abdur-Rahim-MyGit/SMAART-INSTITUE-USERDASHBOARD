import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, Circle, ArrowLeft, BookOpen, Clock, Calendar } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

const ModuleTasks = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  // Mock module data - in real app this would come from API/context
  const modules = [
    { id: 1, title: "Module 1", locked: false, tasks: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, title: `Task ${i + 1}`, completed: i < 5 })) },
    { id: 2, title: "Module 2", locked: false, tasks: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, title: `Task ${i + 1}`, completed: i < 3 })) },
    { id: 3, title: "Module 3", locked: true, tasks: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, title: `Task ${i + 1}`, completed: false })) },
    { id: 4, title: "Module 4", locked: true, tasks: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, title: `Task ${i + 1}`, completed: false })) },
  ];

  const module = modules.find(m => m.id === parseInt(moduleId));
  
  if (!module) {
    return <div>Module not found</div>;
  }

  // Module descriptions
  const getModuleDescription = (moduleId) => {
    const descriptions = {
      1: {
        day: "Day 1",
        title: "Foundation & Setup",
        description: "Begin your learning journey with essential concepts and foundational knowledge. This module covers the basic principles and sets up your understanding for advanced topics.",
        duration: "45 minutes"
      },
      2: {
        day: "Day 2", 
        title: "Core Concepts",
        description: "Dive deeper into the core concepts and methodologies. Build upon your foundation with practical applications and real-world examples.",
        duration: "60 minutes"
      },
      3: {
        day: "Day 3",
        title: "Advanced Applications",
        description: "Apply your knowledge to complex scenarios and advanced use cases. Develop critical thinking and problem-solving skills.",
        duration: "75 minutes"
      },
      4: {
        day: "Day 4",
        title: "Integration & Practice",
        description: "Integrate all learned concepts and practice through comprehensive exercises. Prepare for real-world implementation.",
        duration: "90 minutes"
      }
    };
    
    return descriptions[moduleId] || {
      day: `Day ${moduleId}`,
      title: `Module ${moduleId}`,
      description: "Continue your learning journey with new concepts and practical applications.",
      duration: "60 minutes"
    };
  };

  const moduleInfo = getModuleDescription(module.id);
  const completedTasks = module.tasks.filter(t => t.completed).length;
  const progressPercentage = (completedTasks / module.tasks.length) * 100;

  const handleTaskToggle = (taskId) => {
    // In real app, this would update the task status via API
    console.log(`Toggle task ${taskId} for module ${moduleId}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecef' }}>
      <DashboardSidebar />
      
      <div className="min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-30 glass-effect border-b border-sidebar-border">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-accent text-2xl font-display font-bold lg:hidden"
              >
                SMAART Minds
              </motion.div>
            </Link>
            
            <div className="flex items-center gap-4 ml-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-full glass-effect hover:bg-accent/10 transition-colors"
              >
                <Bell className="w-6 h-6 text-accent" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </motion.button>
              
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Back Button and Header */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/courses')}
                className="p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                style={{ border: '2px solid #daa520', boxShadow: '0 0 8px rgba(218, 165, 32, 0.2)' }}
              >
                <ArrowLeft className="w-6 h-6" style={{ color: '#002147' }} />
              </motion.button>
              <div>
                <h1 className="text-4xl font-display font-bold" style={{ color: '#002147' }}>
                  {module.title}
                </h1>
                <p className="text-lg font-semibold" style={{ color: '#30919D' }}>{moduleInfo.day} • {moduleInfo.title}</p>
              </div>
            </div>

            {/* Module Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-8"
              style={{ border: '2px solid #daa520', boxShadow: '0 0 15px rgba(218, 165, 32, 0.3)' }}
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(218, 165, 32, 0.15)' }}>
                  <BookOpen className="w-8 h-8" style={{ color: '#daa520' }} />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-bold mb-3" style={{ color: '#002147' }}>
                    {moduleInfo.title}
                  </h2>
                  <p className="leading-relaxed mb-6" style={{ color: '#30919D' }}>
                    {moduleInfo.description}
                  </p>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" style={{ color: '#daa520' }} />
                      <span style={{ color: '#002147' }}>Duration: {moduleInfo.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" style={{ color: '#30919D' }} />
                      <span style={{ color: '#002147' }}>{module.tasks.length} Tasks</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6"
              style={{ border: '2px solid #daa520', boxShadow: '0 0 15px rgba(218, 165, 32, 0.3)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold" style={{ color: '#002147' }}>Progress Overview</h3>
                <span className="font-bold text-lg" style={{ color: '#30919D' }}>
                  {completedTasks} / {module.tasks.length} completed
                </span>
              </div>
              
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(218, 165, 32, 0.2)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full"
                  style={{ background: 'linear-gradient(to right, #daa520, #FFD700)' }}
                />
              </div>
              
              <p className="text-sm mt-2" style={{ color: '#30919D' }}>
                {progressPercentage === 100 ? 'Module completed! 🎉' : `${Math.round(progressPercentage)}% complete`}
              </p>
            </motion.div>

            {/* Tasks List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-8"
              style={{ border: '2px solid #daa520', boxShadow: '0 0 15px rgba(218, 165, 32, 0.3)' }}
            >
              <h3 className="text-2xl font-display font-bold mb-6" style={{ color: '#002147' }}>
                Module Tasks
              </h3>
              
              <div className="space-y-4">
                {module.tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-lg transition-colors group cursor-pointer hover:bg-gray-50"
                    style={{ border: '1px solid rgba(218, 165, 32, 0.3)' }}
                    onClick={() => handleTaskToggle(task.id)}
                  >
                    <Checkbox 
                      checked={task.completed}
                      className="w-5 h-5"
                      style={{ borderColor: '#daa520' }}
                    />
                    
                    <div className="flex items-center gap-3 flex-1">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: '#30919D' }} />
                      ) : (
                        <Circle className="w-5 h-5" style={{ color: '#daa520' }} />
                      )}
                      
                      <span className={`font-medium transition-colors ${
                        task.completed 
                          ? "line-through" 
                          : ""
                      }`} style={{ color: task.completed ? '#30919D' : '#002147' }}>
                        Task {index + 1}
                      </span>
                    </div>
                    
                    {task.completed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-sm font-medium px-3 py-1 rounded-full"
                        style={{ color: '#30919D', backgroundColor: 'rgba(48, 145, 157, 0.1)' }}
                      >
                        Completed
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/courses')}
                className="px-8 py-3 bg-white font-semibold rounded-lg transition-colors"
                style={{ color: '#002147', border: '2px solid #daa520' }}
              >
                Back to Modules
              </motion.button>
              
              {progressPercentage === 100 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                  style={{ background: 'linear-gradient(to right, #daa520, #FFD700)' }}
                >
                  Next Module
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ModuleTasks;
