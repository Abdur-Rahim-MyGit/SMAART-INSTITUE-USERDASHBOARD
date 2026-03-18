import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronRight, CheckCircle2, Circle, Clock, BookOpen, FileText, Video, ArrowLeft, ShieldCheck, Lightbulb, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { coursesAPI, courseEnrollmentAPI } from "@/services/api";
import { useParams, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import TaskQuestion from "@/components/TaskQuestion";
import useUser from "@/hooks/useUser";
import BadgeModal from "@/components/badges/BadgeModal";
import MicroAssessment from "@/components/MicroAssessment";
import SubmissionTask from "@/components/SubmissionTask";
import ReflectionTask from "@/components/ReflectionTask";
import FlashcardTask from "@/components/FlashcardTask";
import ModulePathway from "@/components/ModulePathway";
import FloatingDictionary from "@/components/FloatingDictionary";
import FiveModuleRoadmap from "@/components/FiveModuleRoadmap";

const IntroScreen = ({ lines, onFinish }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const handleNext = () => {
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLineIndex, lines]);

  return (
    <div className="w-full h-full bg-[#001229] flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 text-center pointer-events-auto">
      <div className="max-w-2xl w-full flex flex-col gap-4 sm:gap-6 md:gap-8">
        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
          {lines.map((_, idx) => (
            <div
              key={idx}
              className={`h-0.5 sm:h-1 rounded-full transition-all duration-300 ${idx === currentLineIndex ? 'w-6 sm:w-8 bg-[#1a3884]' : 'w-1.5 sm:w-2 bg-slate-700'
                }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLineIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-[80px] sm:min-h-[120px] flex items-center justify-center px-2"
          >
            <p className="text-base sm:text-xl md:text-2xl font-medium text-slate-100 leading-snug sm:leading-relaxed">
              {lines[currentLineIndex]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:mt-8">
          <button
            onClick={handleNext}
            className="group flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-[#1a3884] hover:bg-[#2a7d88] text-white rounded-full text-sm sm:text-base font-bold transition-all shadow-lg hover:shadow-[#1a3884]/20 active:scale-95"
          >
            {currentLineIndex === lines.length - 1 ? 'Start Video' : 'Next'}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
          </button>

          <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold hidden xs:block">
            Press Enter or Space to continue
          </span>
        </div>
      </div>
    </div>
  );
};


const ModuleViewPage = () => {
  const playerRef = useRef(null);
  const { user: currentUser, loading: userLoading } = useUser();
  const { courseId, moduleId, dayId } = useParams();
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState(moduleId ? parseInt(moduleId) : null);
  const [selectedDay, setSelectedDay] = useState(dayId ? parseInt(dayId) : null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [videoProgressMap, setVideoProgressMap] = useState({});
  const [videoCompletionMap, setVideoCompletionMap] = useState({});
  const [videoDurationMap, setVideoDurationMap] = useState({});
  const [taskResultsMap, setTaskResultsMap] = useState({}); // Stores { score, totalPoints, responses }
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStepId, setSelectedStepId] = useState(null); // Track user-selected step
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [finishedIntros, setFinishedIntros] = useState({}); // Track which video intros have been seen
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset selected step when session changes
  useEffect(() => {
    setSelectedStepId(null);
  }, [selectedDay]);

  // Fetch course data and enrollment progress
  useEffect(() => {
    const DUMMY_COURSE = {
      _id: 'dummy-id',
      courseCode: 'CRS00001',
      title: 'CAPACITY',
      description: 'Foundational leadership and capability development.',
      modules: [{
        id: 1,
        _id: 'dummy-mod-1',
        title: 'Module 1: Foundations',
        description: 'Core concepts and strategic thinking.',
        days: Array.from({ length: 7 }, (_, i) => ({
          id: i + 1,
          dayNumber: i + 1,
          title: `Task ${i + 1}: ${['Introduction', 'Strategic Clarity', 'Emotional Intelligence', 'Decision Making', 'Resource Mapping', 'Execution Framework', 'Review'][i]}`,
          description: "Comprehensive session covering key module concepts.",
          duration: "45 mins",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          videoTitle: `Task ${i + 1} Video`,
          videoDescription: "Detailed instructional video for this task.",
          keyTakeaways: ["Master core concepts", "Identify strategic gaps", "Implement feedback loops"]
        }))
      }]
    };

    const mapCourseModules = (course) => {
      return (course.modules || []).map((module, index) => ({
        id: index + 1,
        _id: module._id,
        title: module.title || `Module ${index + 1}`,
        description: module.description || 'No description available',
        duration: module.timeAllocation ? `${module.timeAllocation} minutes` : 'Duration not specified',
        sequence: module.sequence || index + 1,
        days: (module.days || []).map((day, dIdx) => ({
          ...day,
          id: day.id || day.dayNumber || dIdx + 1,
          title: day.title || `Task ${dIdx + 1}`
        }))
      }));
    };

    const fetchData = async () => {
      try {
        setLoading(true);

        // Validate courseId before making API calls
        if (!courseId || courseId === 'undefined') {
          console.warn('Skipping fetch: Invalid courseId', courseId);
          // Don't return, let failsafe handle dummy data
        }

        let courseResponse;
        try {
          if (courseId && courseId !== 'undefined') {
            // Check if courseId is a MongoDB ObjectId (24 hex characters)
            if (/^[0-9a-fA-F]{24}$/.test(courseId)) {
              courseResponse = await coursesAPI.getById(courseId);
            } else {
              let codePart = String(courseId).replace(/^CRS/i, '');
              const courseCode = `CRS${codePart.padStart(5, '0')}`;
              courseResponse = await coursesAPI.getByCode(courseCode);
            }
          }
        } catch (e) {
          console.warn("Error fetching specific course:", e);
        }

        // Failsafe: If course is not found, fetch all courses and pick the first one
        if (!courseResponse || !courseResponse.success || !courseResponse.data) {
          console.log("Course not found by ID/Code. Checking for any available courses...");
          try {
            const allCourses = await coursesAPI.getAll();
            if (allCourses && allCourses.data && allCourses.data.length > 0) {
              courseResponse = { success: true, data: allCourses.data[0] };
            }
          } catch (apiErr) {
            console.warn("Global course fetch failed:", apiErr);
          }
        }

        // Final Ultimate Failsafe: Use Dummy Data if everything failed
        if (!courseResponse || !courseResponse.success || !courseResponse.data) {
          console.log("No courses found in database. Using Dummy Data for UI display.");
          courseResponse = { success: true, data: DUMMY_COURSE };
        }

        if (courseResponse && courseResponse.success && courseResponse.data) {
          const courseData = courseResponse.data;
          setCourseData(courseData);

          const fetchedModules = mapCourseModules(courseData);
          setModules(fetchedModules);

          if (fetchedModules.length > 0) {
            // Keep selectedModule/Day null if not in URL to show Roadmap
            // Only auto-select if we specifically want to skip roadmap (not the case here)
          }

          // Fetch Enrollment Progress if user is logged in
          if (currentUser && courseData._id !== 'dummy-id') {
            try {
              const enrollmentResponse = await courseEnrollmentAPI.getByStudentAndCourse(currentUser._id || currentUser.id, courseData._id);
              if (enrollmentResponse.success && enrollmentResponse.data && enrollmentResponse.data.length > 0) {
                const enrollment = enrollmentResponse.data[0];
                const progressMap = {};
                const videoProg = {};
                const videoComp = {};
                const videoDur = {};
                if (enrollment.moduleProgress) {
                  enrollment.moduleProgress.forEach(mp => {
                    const modIndex = courseData.modules.findIndex(m => m._id.toString() === mp.module.toString());
                    if (modIndex !== -1) {
                      const modId = modIndex + 1;
                      if (mp.completedTasks) mp.completedTasks.forEach(t => progressMap[`${modId}-${t.dayId}-${t.taskId}`] = true);
                      if (mp.videoProgress) mp.videoProgress.forEach(vp => {
                        const key = `${modId}-${vp.dayId}-${vp.stepId || 1}`;
                        videoProg[key] = vp.maxWatchedTime;
                        videoComp[key] = vp.isCompleted;
                        videoDur[key] = vp.videoDuration || 0;
                      });
                    }
                  });
                }
                setCompletedTasks(progressMap);
                setVideoProgressMap(videoProg);
                setVideoCompletionMap(videoComp);
              }
            } catch (err) {
              console.error("Error fetching enrollment progress:", err);
            }
          }
        }
      } catch (error) {
        console.error('Critical fetchData error:', error);
        setCourseData(DUMMY_COURSE);
        setModules(mapCourseModules(DUMMY_COURSE));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, currentUser]);

  // --- ROUTE GUARD EFFECT ---
  // Strictly enforce sequential progression on mount and URL changes
  useEffect(() => {
    // Only run when we have enough data (modules loaded and progress fetched)
    if (loading || modules.length === 0 || !selectedModule || !selectedDay) return;

    const moduleIndex = modules.findIndex(m => m.id === selectedModule);
    if (moduleIndex === -1) return;

    const mod = modules[moduleIndex];
    const dayIndex = mod.days.findIndex(d => d.id === selectedDay);
    if (dayIndex === -1) return;

    // Check if the current requested day is actually unlocked
    const isActuallyUnlocked = isDayUnlocked(selectedModule, dayIndex, mod);

    // NEW: Dynamic Module Unlocking - Module 1 is allowed, others if previous is done
    const isModuleAllowed = selectedModule === 1 || (() => {
      const prevMod = modules.find(m => m.id === selectedModule - 1);
      if (!prevMod) return false;
      // We need to check enrollment progress for previous module
      const enrollmentData = sessionStorage.getItem(`enrollment_${courseId}`); // Check if we have cached enrollment
      // Or use the state we fetched in fetchData
      // For now, let's look at the modules state which should be updated with completion status
      return getModuleCompletedCount(selectedModule - 1).completed >= (prevMod.days?.length || 3);
    })();

    if (!isActuallyUnlocked) {
      console.warn(`[RouteGuard] Blocking access to M${selectedModule} S${selectedDay}: Day is LOCKED.`);
      toast.error("Finish previous session's videos to unlock!");
      navigateToDays(selectedModule);
    } else {
      console.log(`[RouteGuard] Access GRANTED to M${selectedModule} S${selectedDay}.`);
    }
  }, [selectedModule, selectedDay, modules, loading, videoProgressMap, videoDurationMap, videoCompletionMap, completedTasks]);


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
        title: `Session ${j + 1}`,
        description: `Topic for Day ${j + 1}`,
        duration: "45 minutes",
        dayType: 'course',
        videoUrl: null, // No video for placeholder data
        videoTitle: `Session ${j + 1} Lesson`,
        videoDescription: "Content not yet available. Please contact your instructor.",
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
    // Always set to true when coming from onComplete
    const isCompleted = true;

    // Optimistic update
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: isCompleted,
    }));

    // Update backend
    if (currentUser && courseData) {
      try {
        console.log('Saving task progress:', {
          studentId: currentUser._id || currentUser.id,
          courseCode: courseData.courseCode,
          moduleId,
          dayId,
          taskId,
          completed: isCompleted
        });

        const courseCode = courseData.courseCode || `CRS${String(courseId).padStart(5, '0')}`;
        const response = await courseEnrollmentAPI.updateTaskProgress({
          studentId: currentUser._id || currentUser.id,
          courseCode: courseCode,
          moduleId: moduleId,
          dayId: dayId,
          taskId: taskId,
          completed: isCompleted
        });
        console.log('Task progress saved successfully');

        // Check for new badges
        if (response.badgesEarned && response.badgesEarned.length > 0) {
          handleBadgesEarned(response.badgesEarned);
        }
      } catch (error) {
        console.error("Failed to save task progress:", error);
        // Revert on error
        setCompletedTasks((prev) => ({
          ...prev,
          [key]: !isCompleted,
        }));
      }
    } else {
      console.warn('Cannot save progress: currentUser or courseData missing', { currentUser, courseData });
    }
  };

  const isVideoLoading = !modules || modules.length === 0;

  const handleVideoProgressUpdate = async (moduleId, dayId, stepId, maxTime, isCompleted, duration) => {
    const key = `${moduleId}-${dayId}-${stepId}`;

    // Update local state
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

    // Update backend
    if (currentUser && courseData) {
      try {
        const courseCode = courseData.courseCode || `CRS${String(courseId).padStart(5, '0')}`;
        const response = await courseEnrollmentAPI.updateVideoProgress({
          studentId: currentUser._id || currentUser.id,
          courseCode: courseCode,
          moduleId: moduleId,
          dayId: dayId,
          stepId: stepId, // NEW: Include stepId
          maxWatchedTime: maxTime,
          videoDuration: duration,
          isCompleted: isCompleted
        });

        // Check for new badges
        if (response.badgesEarned && response.badgesEarned.length > 0) {
          handleBadgesEarned(response.badgesEarned);
        }
      } catch (error) {
        console.error("Failed to save video progress:", error);
      }
    }
  };

  const handleBadgesEarned = (badges) => {
    if (badges && badges.length > 0) {
      setEarnedBadge(badges[0]);
      setShowBadgeModal(true);
      if (badges.length > 1) {
        toast.success(`You earned ${badges.length} badges!`);
      }
    }
  };

  // Navigation functions
  const navigateToCourses = () => {
    navigate('/dashboard/courses');
  };

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
    setSelectedStepId(null);
    setSelectedModule(moduleId);
    setSelectedDay(dayId);
    navigate(`/dashboard/courses/${courseId}/modules/${moduleId}/days/${dayId}`);
  };

  const handleBackToRoadmap = () => {
    setSelectedModule(null);
    setSelectedDay(null);
    navigate(`/dashboard/courses/${courseId}/modules`);
  };

  const handleMoveToNext = () => {
    const currentModule = modules.find(m => m.id === selectedModule);
    const currentDay = currentModule?.days?.find(d => d.id === selectedDay);
    const steps = currentDay?.steps || [];

    // Find index of current step
    // Note: selectedStepId might be null if using defaultActiveStep
    // Robustly find active step's ID first
    const activeStepId = selectedStepId || steps.find(s => {
      const key = `${selectedModule}-${selectedDay}-${s.id}`;
      return !videoCompletionMap[key];
    })?.id || steps[steps.length - 1]?.id;

    const currentStepIndex = steps.findIndex(s => String(s.id) === String(activeStepId));

    if (currentStepIndex !== -1 && currentStepIndex < steps.length - 1) {
      // Go to next step in current day
      const nextStep = steps[currentStepIndex + 1];
      console.log(`[Navigation] Moving to next step: ${nextStep.id}`);
      setSelectedStepId(nextStep.id);
    } else {
      // Go to next day
      if (currentModule && selectedDay < currentModule.days.length) {
        console.log(`[Navigation] Moving to next day: ${selectedDay + 1}`);
        navigateToDay(selectedModule, selectedDay + 1);
      } else {
        // Module complete
        console.log(`[Navigation] Module complete. Returning to modules.`);
        toast.success("Module Completed!");
        setTimeout(() => navigateToModules(), 1500);
      }
    }
  };

  const getDayCompletedCount = (moduleId, dayId) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod || !mod.days) return 0;
    const day = mod.days.find(d => d.id === dayId);

    // If it's a dummy day (no day object in DB), it's zero progress
    if (!day) return 0;

    // Check if day is completed using existing logic
    return checkSessionCompletion(moduleId, day) ? 1 : 0;
  };

  const getModuleCompletedCount = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) {
      return { completed: 0, total: 3 };
    }

    // Use the same logic as the UI for total days (usually 3)
    const totalDays = Math.max(3, module.days?.length || 0);
    let completedDays = 0;

    // Count completed real days
    if (module.days) {
      module.days.forEach(day => {
        if (checkSessionCompletion(moduleId, day)) {
          completedDays++;
        }
      });
    }

    return { completed: completedDays, total: totalDays };
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

  const formatCourseDuration = (numModules) => {
    const totalDays = numModules * 3;
    if (totalDays === 0) return "0 Days";

    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    if (weeks > 0) {
      if (remainingDays === 0) {
        return `${weeks} Week${weeks > 1 ? 's' : ''}`;
      }
      return `${weeks} Week${weeks > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
    }
    return `${totalDays} Day${totalDays > 1 ? 's' : ''}`;
  };

  const checkSessionCompletion = (mId, session) => {
    if (!session) return false;
    // Multi-step session
    if (session.steps && session.steps.length > 0) {
      const requiredSteps = session.steps.filter(s => s.isRequired !== false);
      const completedRequiredSteps = requiredSteps.filter(s =>
        videoCompletionMap[`${mId}-${session.id}-${s.id}`] === true
      );
      return completedRequiredSteps.length === requiredSteps.length;
    }
    // Legacy session with video
    if (session.videoUrl) {
      const key = `${mId}-${session.id}-1`;
      return videoCompletionMap[key] === true;
    }
    // No video/steps: Check tasks if they exist
    if (session.tasks && session.tasks.length > 0) {
      const completedTasksCount = session.tasks.filter(t =>
        completedTasks[`${mId}-${session.id}-${t.id}`] === true
      ).length;
      return completedTasksCount === session.tasks.length;
    }

    // Default: If truly empty and no tasks, don't show as done by default
    return false;
  };

  const isDayUnlocked = (moduleId, dayIndex, moduleObj) => {
    if (dayIndex === 0) return true; // First day always unlocked
    const mod = moduleObj || modules.find(m => m.id === moduleId);
    if (!mod || !mod.days) return false;

    // STRICT SEQUENTIAL LOCK: Current session is unlocked ONLY if 
    // ALL previous sessions are completed.
    for (let i = 0; i < dayIndex; i++) {
      if (!checkSessionCompletion(moduleId, mod.days[i])) {
        // Find if a previous session is not complete
        console.log(`[Progression] S${dayIndex + 1} is LOCKED because S${i + 1} is incomplete.`);
        return false;
      }
    }

    return true;
  };

  const isStepUnlocked = (mId, dId, stepIndex, steps) => {
    // First step in any day is always unlocked if the day itself is unlocked
    if (stepIndex === 0) return true;

    // STRICT SEQUENTIAL LOCK: Step N is unlocked ONLY if Step N-1 is complete.
    const prevStep = steps[stepIndex - 1];
    if (!prevStep) return true;

    const prevStepKey = `${mId}-${dId}-${prevStep.id}`;
    return videoCompletionMap[prevStepKey] === true;
  };

  // Show loading state while fetching modules
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0B1120 0%, #1a2332 50%, #0B1120 100%)' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3884] mx-auto mb-4"></div>
            <p className="text-gray-300">Loading course content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-[#001229] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Course Not Found</h2>
          <p className="text-gray-400 mb-6">The course you are looking for could not be loaded. Please check the URL or return to your dashboard.</p>
          <motion.button
            onClick={() => navigate('/dashboard/courses')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-[#1a3884] hover:bg-[#2a7d88] text-white rounded-xl font-bold transition-all"
          >
            Back to My Courses
          </motion.button>
        </div>
      </div>
    );
  }

  // --- NEW VINTAGE LAYOUT RENDER ---
  if (!selectedModule) {
    return (
      <FiveModuleRoadmap 
        courseData={courseData} 
        onModuleSelect={(mod) => navigateToDay(mod.id, 1)} 
      />
    );
  }

  // If loading or course not found, we handle above.
  // We'll flatten the days/steps into "Tasks" for the sidebar as requested.
  const flatTasks = modules.length > 0 ? modules[0].days || [] : [];
  const activeTask = flatTasks[activeTaskIndex] || flatTasks[0];
  const activeModule = modules.length > 0 ? modules[0] : null;

  const navyBlue = '#1a3884';
  const cream = '#f5f0e8';
  const gold = '#c9a84c';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: cream,
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
      color: navyBlue,
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
      {/* LEFT SIDEBAR (Table of Contents) */}
      <div style={{
        width: isMobile ? '100%' : '280px',
        borderRight: isMobile ? 'none' : `1.5px solid ${gold}44`,
        borderBottom: isMobile ? `1.5px solid ${gold}44` : 'none',
        padding: isMobile ? '20px' : '40px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '0 30px', marginBottom: '40px' }}>
          <button 
            onClick={handleBackToRoadmap}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              fontStyle: 'italic',
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              marginBottom: '20px'
            }}
          >
            ← Back to Roadmap
          </button>
          <h2 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700',
            margin: isMobile ? '0 0 15px 0' : '0 0 30px 0',
            color: navyBlue,
            letterSpacing: '0.5px'
          }}>
            Module {activeModule?.id || 1}
          </h2>

          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            color: '#444',
            borderBottom: `1px solid ${gold}44`,
            paddingBottom: '8px'
          }}>
            Table of Contents
          </h3>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {flatTasks.map((task, idx) => {
              const isActive = idx === activeTaskIndex;
              return (
                <li key={`${task.moduleId}-${task.id}`} style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => setActiveTaskIndex(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px',
                      color: isActive ? navyBlue : '#666',
                      fontWeight: isActive ? '700' : '400',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'color 0.2s ease',
                      width: '100%',
                    }}
                  >
                    {isActive && <span style={{ color: gold, fontSize: '12px' }}>▶</span>}
                    Task {idx + 1}: {task.title || `Session ${task.id}`}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* RIGHT MAIN AREA (Video & Content) */}
      <div style={{
        flex: 1,
        padding: isMobile ? '20px' : '40px 60px',
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100vh',
        overflowY: isMobile ? 'visible' : 'auto',
      }}>
        {/* Top Header - Progress */}
        <div style={{
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'flex-end',
          alignItems: 'center',
          gap: '20px',
          marginBottom: isMobile ? '20px' : '30px',
          order: isMobile ? -1 : 0
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
             <span style={{ fontSize: '18px', fontWeight: '600' }}>Course Progress</span>
             <div style={{ width: '120px', height: '4px', background: `${gold}44`, marginTop: '8px', position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '10%', background: navyBlue }} />
             </div>
          </div>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: `2px solid ${navyBlue}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '700',
            color: navyBlue
          }}>
            10%
          </div>
        </div>

        {/* Video Player Area */}
        {activeTask && (
           <div style={{
             width: '100%',
             maxWidth: '900px',
             margin: '0 auto',
           }}>
             {/* Header above video */}
             <div style={{ marginBottom: '20px' }}>
               <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '8px' }}>
                 {activeTask.title || `Task ${activeTaskIndex + 1}`}
               </h1>
               <p style={{ fontSize: '14px', color: '#555', fontStyle: 'italic' }}>
                 {activeTask.description || "Watch this video to understand the core concepts."}
               </p>
             </div>

             {/* Video Container */}
             <div style={{
               width: '100%',
               aspectRatio: '16/9',
               background: '#000',
               border: `3px solid ${navyBlue}`,
               boxShadow: `8px 8px 0px ${gold}44`,
               marginBottom: '40px',
               position: 'relative'
             }}>
               {activeTask.videoUrl ? (
                 <video 
                   src={activeTask.videoUrl} 
                   controls 
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                 />
               ) : (
                 <div style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "sans-serif" }}>
                    Video Content will load here.
                 </div>
               )}
             </div>

             {/* Content Below Video */}
             <div style={{ 
               display: 'grid', 
               gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
               gap: '40px',
               borderTop: `1px solid ${gold}44`,
               paddingTop: '30px'
             }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: navyBlue }}>
                    Overview
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#444' }}>
                    {activeTask.videoDescription || activeTask.description || "No overview available for this task. Please complete the video lesson."}
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: navyBlue }}>
                    Key Takeaways
                  </h3>
                  <ul style={{ paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6', color: '#444' }}>
                    <li>Understand the foundational principles</li>
                    <li>Apply techniques in practical scenarios</li>
                    <li>Review mastery materials</li>
                  </ul>
                </div>
             </div>
           </div>
        )}
      </div>

      <FloatingDictionary />
    </div>
  );
};

export default ModuleViewPage;


