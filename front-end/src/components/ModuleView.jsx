import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronRight, CheckCircle2, Circle, Clock, BookOpen, FileText, Video, ArrowLeft } from "lucide-react";
import { coursesAPI, courseEnrollmentAPI } from "@/services/api";
import { useParams, useNavigate } from "react-router-dom";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";

const ModuleView = ({ courseId, onBack }) => {
  const { moduleId, dayId } = useParams();
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState(moduleId ? parseInt(moduleId) : null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [videoProgressMap, setVideoProgressMap] = useState({});
  const [videoCompletionMap, setVideoCompletionMap] = useState({});
  const [videoDurationMap, setVideoDurationMap] = useState({});
  const [modules, setModules] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch course data based on courseId
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const courseCode = `CRS${String(courseId).padStart(5, '0')}`;
        const response = await coursesAPI.getByCode(courseCode);
        
        if (response.success && response.data) {
          setCourseData(response.data);
          
          // Map modules from the course data
          const fetchedModules = response.data.modules.map((module, index) => ({
            id: index + 1, // Use numeric index for consistent ID matching
            _id: module._id, // Keep MongoDB _id for reference
            title: module.title || `Module ${index + 1}`,
            description: module.description || 'No description available',
            duration: module.timeAllocation ? `${module.timeAllocation} minutes` : '3 Days',
            sequence: module.sequence || index + 1,
            days: module.days && module.days.length > 0 
              ? module.days.map((day, dayIndex) => ({
                  id: dayIndex + 1, // Use numeric index for consistent ID matching
                  _id: day._id, // Keep MongoDB _id for reference
                  dayNumber: day.dayNumber || dayIndex + 1,
                  title: day.moduleDetails?.title || `Day ${day.dayNumber || dayIndex + 1}`,
                  description: day.moduleDetails?.description || 'No description available',
                  duration: (() => {
                    let totalMinutes = 0;
                    
                    // Helper to parse duration to minutes
                    const parseToMinutes = (val) => {
                      if (!val) return 0;
                      if (typeof val === 'number') return val;
                      const str = String(val).toLowerCase();
                      const match = str.match(/(\d+)/);
                      if (match) {
                        let num = parseInt(match[1], 10);
                        if (str.includes('hour') || str.includes('hr')) num *= 60;
                        return num;
                      }
                      return 0;
                    };

                    // 1. textReading (estimatedTime)
                    if (day.textReading && Array.isArray(day.textReading)) {
                      day.textReading.forEach(item => totalMinutes += parseToMinutes(item.estimatedTime));
                    }

                    // 2. VideoContent (duration) - Handle both Array (user request) and Object (legacy)
                    if (day.VideoContent && Array.isArray(day.VideoContent)) {
                      day.VideoContent.forEach(item => totalMinutes += parseToMinutes(item.duration));
                    } else if (day.videoContent && Array.isArray(day.videoContent)) {
                       day.videoContent.forEach(item => totalMinutes += parseToMinutes(item.duration));
                    } else if (day.videoContent?.duration) {
                      totalMinutes += parseToMinutes(day.videoContent.duration);
                    }

                    // 3. summaryVideo (duration)
                    if (day.summaryVideo && Array.isArray(day.summaryVideo)) {
                      day.summaryVideo.forEach(item => totalMinutes += parseToMinutes(item.duration));
                    }

                    if (totalMinutes === 0) return '3 Days';
                    
                    if (totalMinutes >= 60) {
                      const hours = Math.floor(totalMinutes / 60);
                      const mins = totalMinutes % 60;
                      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hour${hours > 1 ? 's' : ''}`;
                    }
                    return `${totalMinutes} minutes`;
                  })(),
                  dayType: day.dayType || 'course',
                  videoUrl: (() => {
                    if (day.VideoContent && Array.isArray(day.VideoContent) && day.VideoContent.length > 0) {
                      return day.VideoContent[0].videoUrl || '';
                    }
                    if (day.videoContent && Array.isArray(day.videoContent) && day.videoContent.length > 0) {
                      return day.videoContent[0].videoUrl || '';
                    }
                    return day.videoContent?.videoUrl || '';
                  })(),
                  transcription: (() => {
                    if (day.VideoContent && Array.isArray(day.VideoContent) && day.VideoContent.length > 0) {
                      return day.VideoContent[0].transcription || '';
                    }
                    if (day.videoContent && Array.isArray(day.videoContent) && day.videoContent.length > 0) {
                      return day.videoContent[0].transcription || '';
                    }
                    return day.videoContent?.transcription || '';
                  })(),
                  tasks: day.tasks && day.tasks.length > 0
                    ? day.tasks.map((task, taskIndex) => ({
                        id: taskIndex + 1, // Use numeric index for consistent ID matching
                        _id: task._id, // Keep MongoDB _id for reference
                        title: task.question || `Task ${taskIndex + 1}`,
                        type: task.type || 'mcq',
                        completed: false,
                      }))
                    : Array.from({ length: 5 }, (_, j) => ({
                        id: j + 1,
                        title: `Task ${j + 1}`,
                        completed: false,
                      })),
                }))
              : Array.from({ length: 7 }, (_, i) => ({
                  id: i + 1,
                  dayNumber: i + 1,
                  title: `Day ${i + 1}`,
                  description: `Topic for Day ${i + 1}`,
                  duration: "3 Days",
                  dayType: i < 6 ? 'course' : 'catchup',
                  tasks: Array.from({ length: 5 }, (_, j) => ({
                    id: j + 1,
                    title: `Task ${j + 1}`,
                    completed: false,
                  })),
                })),
          }));
          
          setModules(fetchedModules);

          // 2. Fetch Enrollment Progress if user is logged in
          const userData = sessionStorage.getItem("user");
          if (userData) {
            const user = JSON.parse(userData);
            setCurrentUser(user);
            try {
              const enrollmentResponse = await courseEnrollmentAPI.getByStudentAndCourse(user._id || user.id, response.data._id);
              
              if (enrollmentResponse.success && enrollmentResponse.data && enrollmentResponse.data.length > 0) {
                const enrollment = enrollmentResponse.data[0];
                const progressMap = {};
                const videoProg = {};
                const videoComp = {};
                const videoDur = {};
                
                if (enrollment.moduleProgress) {
                  enrollment.moduleProgress.forEach(mp => {
                    const modIndex = response.data.modules.findIndex(m => m._id.toString() === mp.module.toString());
                    if (modIndex !== -1) {
                      const modId = modIndex + 1;
                      
                      if (mp.completedTasks) {
                        mp.completedTasks.forEach(t => {
                          progressMap[`${modId}-${t.dayId}-${t.taskId}`] = true;
                        });
                      }

                      if (mp.videoProgress) {
                        mp.videoProgress.forEach(vp => {
                          videoProg[`${modId}-${vp.dayId}`] = vp.maxWatchedTime;
                          videoComp[`${modId}-${vp.dayId}`] = vp.isCompleted;
                          videoDur[`${modId}-${vp.dayId}`] = vp.videoDuration || 0;
                        });
                      }
                    }
                  });
                }
                setCompletedTasks(progressMap);
                setVideoProgressMap(videoProg);
                setVideoCompletionMap(videoComp);
                setVideoDurationMap(videoDur);
              }
            } catch (err) {
              console.error("Error fetching enrollment progress:", err);
            }
          }
        } else {
          // Fallback to placeholder data
          setModules(generatePlaceholderModules());
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        // Fallback to placeholder data
        setModules(generatePlaceholderModules());
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Helper to generate placeholder modules
  const generatePlaceholderModules = () => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      title: `Module ${i + 1}`,
      description: `Module ${i + 1} description`,
      duration: `${5 + i} hours`,
      days: Array.from({ length: 3 }, (_, j) => ({
        id: j + 1,
        dayNumber: j + 1,
        title: `Day ${j + 1}`,
        description: `Topic for Day ${j + 1}`,
        duration: "3 Days",
        dayType: 'course',
        tasks: Array.from({ length: 5 }, (_, k) => ({
          id: k + 1,
          title: `Task ${k + 1}`,
          completed: false,
        })),
      })),
    }));
  };

  const toggleTask = async (moduleId, dayId, taskId) => {
    const key = `${moduleId}-${dayId}-${taskId}`;
    const isCompleted = !completedTasks[key];
    
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: isCompleted,
    }));

    // Update backend
    if (currentUser && courseData) {
      try {
        const courseCode = courseData.courseCode || `CRS${String(courseId).padStart(5, '0')}`;
        await courseEnrollmentAPI.updateTaskProgress({
          studentId: currentUser._id || currentUser.id,
          courseCode: courseCode,
          moduleId: moduleId,
          dayId: dayId,
          taskId: taskId,
          completed: isCompleted
        });
      } catch (error) {
        console.error("Failed to save task progress:", error);
      }
    }
  };

  const handleVideoProgressUpdate = async (moduleId, dayId, maxTime, isCompleted, duration) => {
    const key = `${moduleId}-${dayId}`;
    
    setVideoProgressMap(prev => ({
        ...prev,
        [key]: maxTime
    }));

    if (duration > 0) {
        setVideoDurationMap(prev => ({
            ...prev,
            [key]: duration
        }));
    }

    if (isCompleted || (duration > 0 && maxTime >= duration - 1)) {
        setVideoCompletionMap(prev => ({
            ...prev,
            [key]: true
        }));
    }

    if (currentUser && courseData) {
        try {
            const courseCode = courseData.courseCode || `CRS${String(courseId).padStart(5, '0')}`;
            await courseEnrollmentAPI.updateVideoProgress({
                studentId: currentUser._id || currentUser.id,
                courseCode: courseCode,
                moduleId: moduleId,
                dayId: dayId,
                maxWatchedTime: maxTime,
                videoDuration: duration,
                isCompleted: isCompleted
            });
        } catch (error) {
            console.error("Failed to save video progress:", error);
        }
    }
  };

  // Navigation functions
  const navigateToModules = () => {
    setSelectedModule(null);
    setSelectedDay(null);
    navigate(`/dashboard/courses/${courseId}/modules`);
  };

  const navigateToDays = (moduleId) => {
    setSelectedModule(moduleId);
    setSelectedDay(1);
    navigate(`/dashboard/courses/${courseId}/modules/${moduleId}/days/1`);
  };

  const navigateToDay = (moduleId, dayId) => {
    setSelectedModule(moduleId);
    setSelectedDay(dayId);
    navigate(`/dashboard/courses/${courseId}/modules/${moduleId}/days/${dayId}`);
  };

  const getDayCompletedCount = (moduleId, dayId) => {
    const module = modules.find(m => m.id === moduleId);
    const day = module.days.find(d => d.id === dayId);
    return day.tasks.filter(
      (task) => completedTasks[`${moduleId}-${dayId}-${task.id}`]
    ).length;
  };

  const getModuleCompletedCount = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    let totalTasks = 0;
    let completed = 0;
    module.days.forEach(day => {
      totalTasks += day.tasks.length;
      completed += getDayCompletedCount(moduleId, day.id);
    });
    return { completed, total: totalTasks };
  };

  const getDisplayDuration = (moduleId, dayId, defaultDuration) => {
    const key = `${moduleId}-${dayId}`;
    const actualSeconds = videoDurationMap[key];
    if (actualSeconds && actualSeconds > 0) {
      const minutes = Math.floor(actualSeconds / 60);
      if (minutes < 1) return "< 1 minute";
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return defaultDuration;
  };

  // LEVEL 3: DAY DETAIL VIEW
  if (selectedDay && selectedModule) {
    const module = modules.find(m => m.id === selectedModule);
    const day = module.days.find(d => d.id === selectedDay);
    const completedCount = getDayCompletedCount(selectedModule, selectedDay);
    const progressPercent = Math.round((completedCount / day.tasks.length) * 100);
    
    const key = `${selectedModule}-${selectedDay}`;
    const maxWatchedTime = videoProgressMap[key] || 0;
    const videoDuration = videoDurationMap[key] || 0;
    const isVideoCompleted = videoCompletionMap[key] === true || (videoDuration > 0 && maxWatchedTime >= videoDuration - 1);
    const hasVideo = day?.videoUrl;
    const isLocked = hasVideo && !isVideoCompleted;

    return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <motion.button
          onClick={() => navigateToDays(selectedModule)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Days
        </motion.button>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-800">
            {module.title} - {day.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{day.description}</p>
        </div>

        {/* Main Content Layout - Forced 50/50 split to prevent squashing during navigation */}
        <div className="lg:flex lg:w-full lg:gap-12 items-start space-y-6 lg:space-y-0">
          {/* Left Column - Video & Content */}
          <div className="w-full" style={{ flex: '0 0 calc(50% - 1.5rem)', minWidth: '0' }}>
            {/* Video Player wrapper without motion to prevent layout thrashing */}
            <div
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full"
            >
              <CustomVideoPlayer 
                videoUrl={day.videoUrl} 
                title={day.title}
                duration={getDisplayDuration(selectedModule, selectedDay, day.duration)}
                initialMaxTime={videoProgressMap[`${selectedModule}-${selectedDay}`] || 0}
                onProgressUpdate={(time, completed, dur) => handleVideoProgressUpdate(selectedModule, selectedDay, time, completed, dur)}
              />
              <div className="p-4 sm:p-6">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 mb-6">
                  {['overview', 'transcription'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${
                        activeTab === tab ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tabs Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                        {day.title}: Deep Dive
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {day.description || "Watch this video to master the concepts for today."}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="transcription"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="min-h-[100px]"
                    >
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                        Video Transcription
                      </h2>
                      <div className="text-sm sm:text-base text-gray-600 leading-relaxed max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {day.transcription || (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <FileText className="w-12 h-12 mb-2 opacity-20" />
                            <p className="italic">No transcription available for this video.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column - Tasks */}
          <div className="w-full flex flex-col gap-6" style={{ flex: '0 0 calc(50% - 1.5rem)', minWidth: '0' }}>
            {/* Progress Card */}
            <div
              className="w-full bg-gradient-to-br from-orange-500 to-yellow-400 rounded-3xl p-6 shadow-xl text-white"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-1">Day Progress</h3>
                  <p className="text-white/90 text-xs">Keep up the great work!</p>
                </div>
                <div className="text-4xl sm:text-5xl font-bold">{progressPercent}%</div>
              </div>
              <div className="h-2.5 sm:h-3 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-white rounded-full shadow-lg"
                />
              </div>
              <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] sm:text-xs">
                <span>{completedCount} of {day.tasks.length} completed</span>
                <span className="font-semibold">{day.tasks.length - completedCount} remaining</span>
              </div>
            </div>

            <div
              className="w-full bg-white rounded-3xl p-5 sm:p-8 shadow-xl flex-1 border border-gray-100 relative overflow-hidden"
            >
              {/* Task Lock Overlay */}
              {isLocked && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50/95 backdrop-blur-[4px] text-center rounded-3xl">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-100 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">Tasks Locked</h3>
                    <p className="text-xs sm:text-sm text-gray-600 max-w-[200px] mb-3 sm:mb-4 font-medium">
                        Finish watching the video to unlock today's learning tasks.
                    </p>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-orange-600 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full border-2 border-orange-100 shadow-sm flex items-center gap-2">
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-orange-600" />
                        In Progress
                    </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Today's Tasks</h3>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-50 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-semibold text-orange-600">{day.tasks.length} Tasks</span>
                </div>
              </div>
              
              <div className={`space-y-3 sm:space-y-4 ${isLocked ? 'opacity-20 pointer-events-none grayscale select-none' : ''}`}>
                {day.tasks.map((task, index) => {
                  const isCompleted = completedTasks[`${selectedModule}-${selectedDay}-${task.id}`];
                  return (
                    <motion.button
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleTask(selectedModule, selectedDay, task.id)}
                      className={`w-full group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-orange-300 hover:shadow-md'
                      }`}
                    >
                      {/* Animated background on hover */}
                      {!isCompleted && (
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      
                      <div className="relative flex items-center gap-4">
                        {/* Checkbox */}
                        <div className="relative flex-shrink-0">
                          {isCompleted ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-7 h-7 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
                            >
                              <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <div className="w-7 h-7 rounded-xl border-3 border-gray-300 group-hover:border-orange-400 transition-colors flex items-center justify-center bg-white">
                              <div className="w-3 h-3 rounded-md bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 text-left">
                          <span className={`font-semibold text-base transition-colors ${
                            isCompleted 
                              ? 'text-green-700 line-through' 
                              : 'text-gray-800 group-hover:text-orange-600'
                          }`}>
                            {task.title}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full"
                          >
                            Done
                          </motion.div>
                        )}
                        
                        {/* Arrow indicator */}
                        {!isCompleted && (
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // LEVEL 2: DAY LIST VIEW
  if (selectedModule) {
    const module = modules.find(m => m.id === selectedModule);
    const { completed, total } = getModuleCompletedCount(selectedModule);
    const progressPercent = Math.round((completed / total) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="space-y-6"
      >
        <motion.button
          onClick={() => navigateToModules()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Modules
        </motion.button>

        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-gray-800">
            {module.title}
          </h1>
          <p className="text-gray-800/70 text-lg">Select a day to start learning</p>
        </div>

        {/* Module Progress */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm max-w-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">Module Progress</span>
            <span className="text-orange-600 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400"
            />
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {module.days.map((day, index) => {
            const dayCompletedCount = getDayCompletedCount(selectedModule, day.id);
            const isVideoDone = !day.videoUrl || videoCompletionMap[`${selectedModule}-${day.id}`] === true;
            const isTasksDone = day.tasks.length > 0 ? dayCompletedCount === day.tasks.length : false;
            
            // A day is completed if it has content (video or tasks) and they are all done
            const isDayCompleted = (day.videoUrl || day.tasks.length > 0) && isVideoDone && (day.tasks.length > 0 ? isTasksDone : true);
            
            return (
              <motion.button
                key={day.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { duration: 0.2 } 
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateToDay(selectedModule, day.id)}
                className="group relative bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all text-left overflow-hidden"
              >
                {/* Hover Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-yellow-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                      {day.title}
                    </h3>
                    {isDayCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-green-100 p-1 rounded-full"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </motion.div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-gray-200 group-hover:border-orange-400 transition-colors flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2 min-h-[40px]">
                    {day.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-white/50 transition-colors">
                      <Clock className="w-3.5 h-3.5 text-orange-500" /> {getDisplayDuration(selectedModule, day.id, day.duration)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-white/50 transition-colors">
                      <FileText className="w-3.5 h-3.5 text-blue-500" /> {day.tasks.length} Tasks
                    </span>
                  </div>

                  <div className="w-full py-2.5 rounded-lg text-center text-sm font-bold border-2 border-gray-100 text-gray-600 group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                    {isDayCompleted ? 'Review Content' : 'Start Learning'}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // LEVEL 1: MODULE LIST VIEW - Card columns with day lists
  const [selectedDayPerModule, setSelectedDayPerModule] = useState({});

  // Initialize first day selected for each module
  useEffect(() => {
    if (modules.length > 0) {
      const initialSelection = {};
      modules.forEach(module => {
        if (module.days && module.days.length > 0) {
          initialSelection[module.id] = module.days[0].id;
        }
      });
      setSelectedDayPerModule(initialSelection);
    }
  }, [modules]);

  const handleDaySelect = (moduleId, dayId) => {
    setSelectedDayPerModule(prev => ({
      ...prev,
      [moduleId]: dayId
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <motion.button
        onClick={onBack}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full glass-effect text-gray-800 hover:bg-accent/20 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-gray-800">
          {courseData?.title || `Course ${courseId}`}
        </h1>
        <p className="text-gray-600">Select a module and day to start learning</p>
      </motion.div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, moduleIndex) => {
          const { completed, total } = getModuleCompletedCount(module.id);
          const progressPercent = Math.round((completed / total) * 100);
          const selectedDay = selectedDayPerModule[module.id];

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: moduleIndex * 0.1 }}
              className="bg-[#121A2C] rounded-2xl overflow-hidden shadow-lg border border-[#0288D1]/50 flex flex-col"
            >
              {/* Module Header */}
              <div 
                className="bg-[#1e3a5f]/50 text-white px-6 py-4 relative border-b border-[#0288D1]/30"
                style={{
                  borderLeft: '4px solid #0288D1'
                }}
              >
                <h3 className="text-lg font-bold tracking-wide text-center uppercase">
                  Module {module.id}
                </h3>
                {module.title !== `Module ${module.id}` && (
                  <p className="text-xs text-center text-gray-300 mt-1 truncate">
                    {module.title}
                  </p>
                )}
              </div>

              {/* Days List */}
              <div className="flex-1 divide-y divide-[#0288D1]/10">
                {module.days && module.days.length > 0 ? (
                  module.days.map((day, dayIndex) => {
                    const isSelected = selectedDay === day.id;
                    const dayCompletedCount = getDayCompletedCount(module.id, day.id);
                    const isDayCompleted = dayCompletedCount === day.tasks.length;

                    return (
                      <motion.button
                        key={day.id}
                        onClick={() => {
                          handleDaySelect(module.id, day.id);
                          navigateToDay(module.id, day.id);
                        }}
                        whileHover={{ backgroundColor: isSelected ? undefined : 'rgba(2, 136, 209, 0.1)' }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'bg-[#0288D1] text-white' 
                            : 'bg-transparent text-gray-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isDayCompleted && (
                            <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-green-500'}`} />
                          )}
                          <span className={`font-semibold text-sm uppercase tracking-wide ${
                            isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'
                          }`}>
                            Day {day.dayNumber || day.id}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isSelected ? 'text-white opacity-100' : 'text-gray-400'
                        }`} />
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    No days available
                  </div>
                )}
              </div>

              {/* Module Footer with Progress */}
              <div className="px-4 py-3 bg-[#0B1120]/50 border-t border-[#0288D1]/20">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{module.days?.length || 0} Days</span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-[#0288D1] to-[#29b6f6]"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unit Indicator */}
      <div className="text-center pt-4">
        <span className="text-gray-400 text-sm uppercase tracking-widest font-medium">
          Unit 1
        </span>
      </div>
    </motion.div>
  );
};

export default ModuleView;
