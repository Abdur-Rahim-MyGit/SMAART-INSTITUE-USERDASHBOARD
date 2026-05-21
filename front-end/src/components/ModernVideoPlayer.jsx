import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  ArrowLeft
} from "lucide-react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ModernVideoPlayer = ({ 
  courseData, 
  selectedModule, 
  selectedDay, 
  onBack, 
  onModuleSelect,
  onDaySelect,
  videoProgressMap,
  videoCompletionMap,
  videoDurationMap,
  completedTasks,
  currentUser,
  onVideoProgressUpdate
}) => {
  const [expandedModules, setExpandedModules] = useState({});
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');

  // Initialize expanded modules
  useEffect(() => {
    if (courseData?.modules) {
      const initialExpanded = {};
      courseData.modules.forEach((mod, idx) => {
        initialExpanded[idx] = true; // Expand all by default
      });
      setExpandedModules(initialExpanded);
    }
  }, [courseData]);

  // Set active lesson based on selected module/day
  useEffect(() => {
    if (selectedModule !== null && selectedDay !== null) {
      setActiveLesson({ module: selectedModule, day: selectedDay });
    }
  }, [selectedModule, selectedDay]);

  const toggleModule = (moduleIndex) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleIndex]: !prev[moduleIndex]
    }));
  };

  const handleLessonClick = (moduleIndex, dayIndex) => {
    setActiveLesson({ module: moduleIndex, day: dayIndex });
    if (onDaySelect) {
      onDaySelect(moduleIndex + 1, dayIndex + 1);
    }
  };

  const getLessonStatus = (moduleIndex, dayIndex, module) => {
    const day = module.days[dayIndex];
    if (!day) return 'locked';

    const key = `${moduleIndex + 1}-${dayIndex + 1}`;
    const isCompleted = videoCompletionMap[key] === true;
    
    // Check if previous lessons are completed
    if (dayIndex > 0) {
      const prevKey = `${moduleIndex + 1}-${dayIndex}`;
      const prevCompleted = videoCompletionMap[prevKey] === true;
      if (!prevCompleted) return 'locked';
    }

    return isCompleted ? 'completed' : 'incomplete';
  };

  const getModuleProgress = (moduleIndex) => {
    const module = courseData.modules[moduleIndex];
    if (!module?.days) return { completed: 0, total: 0 };

    let completed = 0;
    module.days.forEach((day, dayIndex) => {
      const key = `${moduleIndex + 1}-${dayIndex + 1}`;
      if (videoCompletionMap[key] === true) {
        completed++;
      }
    });

    return { completed, total: module.days.length };
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentModule = courseData?.modules?.[selectedModule - 1];
  const currentDay = currentModule?.days?.[selectedDay - 1];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC]">
      {/* Left Side - Video Player */}
      <div className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {currentDay?.title || `Lesson ${selectedDay}`}
            </h1>
            <p className="text-gray-600">
              {currentDay?.description || 'Watch this lesson to continue your learning journey.'}
            </p>
          </div>

          {/* Video Player */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <CustomVideoPlayer
              videoUrl={currentDay?.videoUrl || ''}
              title={currentDay?.title || `Lesson ${selectedDay}`}
              duration={formatDuration(videoDurationMap[`${selectedModule}-${selectedDay}`])}
              initialMaxTime={videoProgressMap[`${selectedModule}-${selectedDay}`] || 0}
              initialCompleted={videoCompletionMap[`${selectedModule}-${selectedDay}`] === true}
              onProgressUpdate={(time, completed, duration) => {
                if (onVideoProgressUpdate) {
                  onVideoProgressUpdate(selectedModule, selectedDay, time, completed, duration);
                }
              }}
            />
          </div>

          {/* Transcription Section */}
          <Card className="bg-white rounded-2xl shadow-sm mb-6">
            <CardContent className="p-6">
              {/* Tab Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'preview'
                      ? 'bg-[#1a3884] text-white shadow-lg shadow-[#1a3884]/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('transcription')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'transcription'
                      ? 'bg-[#1a3884] text-white shadow-lg shadow-[#1a3884]/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Transcription
                </button>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'preview' && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[200px]"
                  >
                    <div className="bg-[#F8FAFC] rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Lesson Preview</h4>
                      <p className="text-gray-600 leading-relaxed">
                        {currentDay?.description || 'Watch this lesson to continue your learning journey.'}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(videoDurationMap[`${selectedModule}-${selectedDay}`]) || '10:00'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          <span>Video Lesson</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'transcription' && (
                  <motion.div
                    key="transcription"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[200px]"
                  >
                    <div className="bg-[#F8FAFC] rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Video Transcription</h4>
                      <p className="text-gray-600 leading-relaxed italic">
                        Transcription will be available here once the video content is processed.
                      </p>
                      <p className="text-gray-500 text-sm mt-4">
                        This feature allows you to read along with the video content, making it easier to follow along and review key points.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Lesson Info Card */}
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentDay?.title || `Lesson ${selectedDay}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Module {selectedModule} • Lesson {selectedDay}
                  </p>
                </div>
                <Badge variant={videoCompletionMap[`${selectedModule}-${selectedDay}`] === true ? "default" : "secondary"}>
                  {videoCompletionMap[`${selectedModule}-${selectedDay}`] === true ? "Completed" : "In Progress"}
                </Badge>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {currentDay?.description || "Complete this lesson to unlock the next one in the module."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Sidebar with Modules */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Course Content</h2>

          {/* Overall Progress */}
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Your Progress</span>
                <span className="text-2xl font-bold">
                  {Math.round(
                    (courseData?.modules?.reduce((acc, mod, modIdx) => {
                      const progress = getModuleProgress(modIdx);
                      return acc + progress.completed;
                    }, 0) / 
                    (courseData?.modules?.reduce((acc, mod) => acc + (mod.days?.length || 0), 0) || 1)) * 100
                  )}%
                </span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.round(
                      (courseData?.modules?.reduce((acc, mod, modIdx) => {
                        const progress = getModuleProgress(modIdx);
                        return acc + progress.completed;
                      }, 0) / 
                      (courseData?.modules?.reduce((acc, mod) => acc + (mod.days?.length || 0), 0) || 1)) * 100
                    )}%`
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Modules List */}
          <div className="space-y-4">
            {courseData?.modules?.map((module, moduleIndex) => {
              const moduleProgress = getModuleProgress(moduleIndex);
              const isExpanded = expandedModules[moduleIndex];

              return (
                <Card key={moduleIndex} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(moduleIndex)}
                    className="w-full p-4 flex items-center justify-between bg-[#F8FAFC] hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">
                          {moduleIndex + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {module.title || `Module ${moduleIndex + 1}`}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {moduleProgress.completed}/{moduleProgress.total} completed
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Module Content - Lessons */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 space-y-1">
                          {module.days?.map((day, dayIndex) => {
                            const status = getLessonStatus(moduleIndex, dayIndex, module);
                            const isActive = activeLesson?.module === moduleIndex && activeLesson?.day === dayIndex;

                            return (
                              <button
                                key={dayIndex}
                                onClick={() => status !== 'locked' && handleLessonClick(moduleIndex, dayIndex)}
                                disabled={status === 'locked'}
                                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                                  isActive 
                                    ? 'bg-indigo-50 border-2 border-indigo-500' 
                                    : status === 'locked'
                                    ? 'bg-[#F8FAFC] opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-100 border-2 border-transparent'
                                }`}
                              >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                  {status === 'completed' ? (
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                  ) : status === 'locked' ? (
                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                      <Lock className="w-3 h-3 text-gray-500" />
                                    </div>
                                  ) : isActive ? (
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                      <Play className="w-3 h-3 text-white fill-white" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                      <Circle className="w-3 h-3 text-gray-300" />
                                    </div>
                                  )}
                                </div>

                                {/* Lesson Info */}
                                <div className="flex-1 text-left">
                                  <p className={`text-sm font-medium ${
                                    isActive ? 'text-indigo-600' : 
                                    status === 'completed' ? 'text-gray-500 line-through' : 
                                    'text-gray-900'
                                  }`}>
                                    {day.title || `Lesson ${dayIndex + 1}`}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-400">
                                      {formatDuration(videoDurationMap[`${moduleIndex + 1}-${dayIndex + 1}`]) || day.duration || "10:00"}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow */}
                                {status !== 'locked' && (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernVideoPlayer;
