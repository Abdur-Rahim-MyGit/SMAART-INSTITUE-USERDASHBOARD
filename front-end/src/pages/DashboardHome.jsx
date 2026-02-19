import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import PageTransition from "@/components/PageTransition";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import {
  TrendingUp,
  Zap,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronRight,
  ClipboardCheck,
  Play,
  ChevronLeft,
  BookOpen,
  Award,
  HelpCircle,
  Sparkles,
  Target,
  ArrowRight,
  MoreHorizontal,
  Bell,
  Search,
  Users,
  Trash2
} from "lucide-react";
import { getTasks, createTask, deleteTask } from "@/services/taskService";
import useAvatar from '@/hooks/useAvatar';
import ContinueLearning from '@/components/ContinueLearning';
import CourseCardSkeleton from '@/components/skeletons/CourseCardSkeleton';
import StatsCardSkeleton from '@/components/skeletons/StatsCardSkeleton';
import apiCall, { API_BASE_URL } from '@/services/api';
import useUser from "@/hooks/useUser";

/* Helper function for calendar logic */
const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return { daysArray, firstDayIndex };
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: userLoading } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showVisionSplash, setShowVisionSplash] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Real data states
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedModules: 0,
    baselineScore: 0,
    dayStreak: 0
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  // Animation Variants - Smoother, more professional
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "tween", ease: "easeOut", duration: 0.4 }
    }
  };

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('visionSplashShown');
    if (!hasSeenSplash) {
      setShowVisionSplash(true);
    }
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [location.key]);

  const handleVisionSplashComplete = () => {
    setShowVisionSplash(false);
    sessionStorage.setItem('visionSplashShown', 'true');
  };

  // Calendar Note State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNoteDate, setSelectedNoteDate] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [selectedNoteTime, setSelectedNoteTime] = useState("12:00");
  const [calendarNotes, setCalendarNotes] = useState({});

  const handleDayDoubleClick = (date) => {
    setSelectedNoteDate(date);
    // Default to current time or next hour
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedNoteTime(`${hours}:${minutes}`);
    setShowNoteModal(true);
  };

  const saveNote = async () => {
    if (!newNote.trim() || !selectedNoteDate) return;

    try {
      // Save to Backend
      const taskData = {
        title: newNote,
        date: selectedNoteDate,
        time: selectedNoteTime,
        type: 'personal',
        status: 'Pending'
      };

      const savedTask = await createTask(taskData);

      // Update Local State
      const dateKey = selectedNoteDate.toDateString();
      setCalendarNotes(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), {
          id: savedTask._id,
          text: savedTask.title,
          time: savedTask.time
        }]
      }));

      setNewNote("");
      setShowNoteModal(false);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteTask(noteId);

      // Update local state
      setCalendarNotes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(dateKey => {
          updated[dateKey] = updated[dateKey].filter(note => note.id !== noteId);
          if (updated[dateKey].length === 0) {
            delete updated[dateKey];
          }
        });
        return updated;
      });
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  // Fetch Dashboard Data (Real Data Integration)
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || (!user.id && !user._id)) {
        setDashboardLoading(false);
        return;
      }

      try {
        setDashboardLoading(true);
        const userId = user.id || user._id;
        const token = sessionStorage.getItem('token');

        if (!userId || !token) {
          setDashboardLoading(false);
          return;
        }

        // Fetch enrolled courses
        const coursesResponse = await fetch(
          `${API_BASE_URL.replace('/api', '')}/api/courseEnrollments/student/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        let courses = [];
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          courses = Array.isArray(coursesData.data) ? coursesData.data : (Array.isArray(coursesData) ? coursesData : []);
          setEnrolledCourses(courses);
        }

        // Fetch Tasks (Calendar Notes)
        try {
          const tasks = await getTasks();
          const notesMap = {};
          tasks.forEach(task => {
            if (task.date) {
              const d = new Date(task.date);
              if (!isNaN(d.getTime())) {
                const key = d.toDateString();
                if (!notesMap[key]) notesMap[key] = [];
                notesMap[key].push({
                  id: task._id,
                  text: task.title,
                  time: task.time || 'All Day'
                });
              }
            }
          });
          setCalendarNotes(notesMap);
        } catch (err) {
          console.error("Failed to fetch tasks", err);
        }

        // Fetch baseline results
        const baselineResponse = await fetch(
          `${API_BASE_URL.replace('/api', '')}/api/baselineresults/user/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        let baseline = null;
        if (baselineResponse.ok) {
          baseline = await baselineResponse.json();
        }

        // Calculate stats and resume point
        let completedModulesCount = 0;
        let totalProgressSum = 0;
        let resumeUrl = '/dashboard/courses';
        let currentModuleTitle = 'Start Learning';
        let lastAccessedTime = 'Never';

        // Pre-process all courses for stats
        courses.forEach(enrollment => {
          let currentProgress = enrollment.progress || 0;

          // Calculate module-based progress regardless of enrollment.progress
          if (enrollment.moduleProgress && enrollment.course?.modules?.length > 0) {
            const completedMods = enrollment.moduleProgress.filter(m => m.status === 'completed').length;
            const totalMods = enrollment.course.modules.length;
            if (totalMods > 0) {
              const moduleCalculatedProgress = Math.round((completedMods / totalMods) * 100);
              // Trust whichever is higher or catch 100% completion if status is stale
              if (moduleCalculatedProgress > currentProgress || moduleCalculatedProgress === 100) {
                currentProgress = moduleCalculatedProgress;
              }
            }
          }

          // Attach calculated progress for UI usage
          enrollment.calculatedProgress = currentProgress;
          totalProgressSum += currentProgress;

          if (enrollment.moduleProgress && Array.isArray(enrollment.moduleProgress)) {
            enrollment.moduleProgress.forEach(module => {
              if (module.status === 'completed') {
                completedModulesCount++;
              }
            });
          }

          // NEW: Check for any activity at all (even if 0% progress)
          let hasActivity = false;
          if (enrollment.moduleProgress && enrollment.moduleProgress.length > 0) {
            hasActivity = enrollment.moduleProgress.some(m => {
              const hasVideo = m.videoProgress && m.videoProgress.some(vp => vp.maxWatchedTime > 0);
              const hasTasks = m.completedTasks && m.completedTasks.length > 0;
              const hasQuizzes = m.quizzesTaken && m.quizzesTaken.length > 0;
              return hasVideo || hasTasks || hasQuizzes;
            });
          }
          enrollment.hasAnyActivity = hasActivity;
        });

        // A course is "Active" if it's in_progress OR has any activity, and not finished
        const activeCoursesCount = courses.filter(c => 
          (c.status === 'in_progress' || c.status === 'in-progress' || c.hasAnyActivity || c.calculatedProgress > 0) && 
          c.calculatedProgress < 100
        ).length;

        // Find the "Active" course for hero section
        const activeCourseEnrollment = [...courses]
          .filter(e => 
            (e.status === 'in_progress' || e.status === 'in-progress' || e.hasAnyActivity || e.calculatedProgress > 0) && 
            e.calculatedProgress < 100
          )
          .sort((a, b) =>
            new Date(b.lastAccessedAt || 0) - new Date(a.lastAccessedAt || 0)
          )[0];

        if (activeCourseEnrollment) {
          const course = activeCourseEnrollment.course;
          const enrollment = activeCourseEnrollment;
          let resumeModuleId = 1;
          let resumeDayId = 1;

          // Format Last Accessed Time
          if (activeCourseEnrollment.lastAccessedAt) {
            const diff = Date.now() - new Date(activeCourseEnrollment.lastAccessedAt).getTime();
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) lastAccessedTime = 'Just now';
            else if (minutes < 60) lastAccessedTime = `${minutes}m ago`;
            else if (minutes < 1440) lastAccessedTime = `${Math.floor(minutes / 60)}h ago`;
            else lastAccessedTime = `${Math.floor(minutes / 1440)}d ago`;
          }

          if (course && Array.isArray(course.modules)) {
            let found = false;
            for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
              const moduleDoc = course.modules[mIdx];
              const modProgress = (enrollment.moduleProgress || []).find(
                mp => mp.module === moduleDoc._id || mp.module?._id === moduleDoc._id
              );

              if (!modProgress || modProgress.status !== 'completed') {
                resumeModuleId = mIdx + 1;
                currentModuleTitle = moduleDoc.title || `Module ${mIdx + 1}`;

                const videoProgress = modProgress?.videoProgress || [];
                const completedTasks = modProgress?.completedTasks || [];
                const daysCount = moduleDoc.days?.length || 0;

                for (let d = 1; d <= daysCount; d++) {
                  const isVidDone = videoProgress.some(vp => vp.dayId === d && vp.isCompleted);
                  const dayDoc = moduleDoc.days?.find(day => day.dayNumber === d || day.id === d);
                  const hasTasks = dayDoc?.tasks?.length > 0;
                  const isTaskDone = completedTasks.some(ct => ct.dayId === d);
                  const taskCondition = hasTasks ? isTaskDone : true;

                  if (!isVidDone || !taskCondition) {
                    resumeDayId = d;
                    found = true;
                    break;
                  }
                }
              }
              if (found) break;
            }
          }

          if (course?._id) {
            resumeUrl = `/dashboard/courses/${course._id}/modules/${resumeModuleId}/days/${resumeDayId}`;
          }
        }

        const overallProgress = courses.length > 0
          ? Math.round(totalProgressSum / courses.length)
          : 0;

        // Fetch Streak
        let currentStreak = 0;
        try {
          const streakRes = await apiCall('/avatar/streak-status');
          if (streakRes.success) {
            currentStreak = streakRes.data?.totalStreakDays || streakRes.data?.streak || 0;
          }
        } catch (e) {
          console.error("Failed to fetch streak", e);
        }

        setStats({
          totalCourses: activeCoursesCount,
          completedModules: completedModulesCount,
          baselineScore: baseline?.baselineScore || 0,
          dayStreak: currentStreak,
          resumeUrl,
          currentModuleTitle,
          lastAccessedTime,
          activeEnrollment: activeCourseEnrollment
        });

        setWeeklyProgress(overallProgress);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (user && (user.id || user._id)) {
      fetchDashboardData();

      // Refresh data on window focus to handle updates from other tabs
      const onFocus = () => fetchDashboardData();
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, [user]);

  // --- Calendar Logic ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    return {
      daysArray: Array.from({ length: days }, (_, i) => i + 1),
      firstDayIndex
    };
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )}

      {/* Streak Details Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowStreakModal(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-transparent w-full max-w-2xl"
            onClick={e => e.stopPropagation()}
          >
            <ContinueLearning />
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowStreakModal(false)}
                className="px-6 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full font-bold text-sm shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0B1120] text-slate-900 font-sans transition-colors duration-300">
        <DashboardSidebar />

        <div className="min-h-screen pb-20 lg:pb-0">
          <PageTransition>
            <motion.main
              className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >

              {/* Enhanced Header - Professional & Clean */}
              <motion.div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 flex-wrap" variants={itemVariants}>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 shadow-sm">
                      {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    {/* <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> */}
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{user?.fullName?.split(' ')[0] || 'Student'}</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm md:text-base font-medium">
                    Your learning overview for today.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Streak Badge - Click to open details */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowStreakModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-500 fill-orange-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-none">Streak</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Day {stats.dayStreak}
                      </p>
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">

                {/* Left Column - Main Content */}
                <div className="lg:col-span-8 space-y-6 md:space-y-8">

                  {/* Professional Hero Section */}
                  <motion.section
                    variants={itemVariants}
                    className="relative overflow-hidden rounded-[20px] md:rounded-[24px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 md:p-10 shadow-xl shadow-slate-200 dark:shadow-none text-slate-900 dark:text-white z-0 ring-1 ring-slate-200 dark:ring-white/5"
                  >
                    {/* Subtle Grid Pattern */}
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                    />

                    {/* Abstract Geometric Accents */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="md:w-3/4">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                            <p className="text-blue-600 dark:text-blue-200 text-xs font-bold uppercase tracking-widest">Weekly Performance</p>
                          </div>

                          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-slate-900 dark:text-white">
                            You're performing exceptionally well.
                            <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Keep up the momentum.</span>
                          </h2>

                          <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-lg leading-relaxed text-sm">
                            {enrolledCourses.length > 0
                              ? `You have completed ${stats.completedModules} modules this week. Resume your latest course to maintain your streak.`
                              : "Start your professional journey today by exploring our industry-standard courses."}
                          </p>

                          <div className="flex flex-wrap gap-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate(stats.resumeUrl || '/dashboard/courses')}
                              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2"
                            >
                              <Play className="w-4 h-4 fill-white dark:fill-slate-900" />
                              {enrolledCourses.length > 0 ? "Resume Learning" : "Browse Library"}
                            </motion.button>
                          </div>
                        </div>

                        {/* Circular Progress (Professional Style) */}
                        <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" className="stroke-slate-100 dark:stroke-white/10" strokeWidth="6" />
                            <circle
                              cx="50" cy="50" r="45"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 45}`}
                              strokeDashoffset={`${2 * Math.PI * 45 * (1 - weeklyProgress / 100)}`}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-2xl font-bold block text-slate-900 dark:text-white">{weeklyProgress}%</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">Done</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.section>

                  {/* KPI Stats Grid - Minimalist & Clean */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                      { label: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-blue-600', trend: '+1', trendColor: 'text-emerald-500' },
                      { label: 'Modules Done', value: stats.completedModules, icon: CheckCircle2, color: 'text-emerald-600', trend: '+3', trendColor: 'text-emerald-500' },
                      { label: 'Baseline Score', value: `${stats.baselineScore}%`, icon: Target, color: 'text-violet-600', trend: 'High', trendColor: 'text-blue-500' },
                      { label: 'Learning Hours', value: '24h', icon: Clock, color: 'text-amber-600', trend: '+2h', trendColor: 'text-emerald-500' }
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          {stat.trend && (
                            <span className={`text-xs font-bold ${stat.trendColor} bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded`}>
                              {stat.trend}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{stat.value}</h3>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* 7-Day Streak Tracker - REMOVED from here, now in Modal */}

                  {/* Current Course - Horizontal Professional Card */}
                  <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Ongoing Learning
                      </h3>
                      <button
                        onClick={() => navigate('/dashboard/courses')}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                      >
                        View Library <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {dashboardLoading ? (
                      <CourseCardSkeleton />
                    ) : stats.activeEnrollment ? (
                      <motion.div
                        whileHover={{ scale: 1.005 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row"
                      >
                        {/* Image Section */}
                        <div className="md:w-1/3 relative h-48 md:h-auto group cursor-pointer" onClick={() => navigate(stats.resumeUrl)}>
                          <img
                            src={stats.activeEnrollment.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"}
                            alt="Course"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                              <Play className="w-5 h-5 text-slate-900 fill-current ml-1" />
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 truncate max-w-[200px]">
                              {stats.currentModuleTitle || 'Core Module'}
                            </span>
                            <span className="text-slate-400 text-xs font-medium">Last accessed {stats.lastAccessedTime || 'recently'}</span>
                          </div>

                          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                            {stats.activeEnrollment.course?.title || 'Advanced Leadership & Management'}
                          </h4>

                          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                            {stats.activeEnrollment.course?.description || 'Learn to lead effective teams and manage complex projects with confidence.'}
                          </p>

                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                                <span>Progress</span>
                                <span className="text-slate-900 dark:text-white">{stats.activeEnrollment.calculatedProgress || 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${stats.activeEnrollment.calculatedProgress || 0}%` }}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(stats.resumeUrl)}
                              className="px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                          <BookOpen className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Active Courses</h3>
                        <p className="text-slate-500 text-sm mb-5 max-w-sm">
                          You haven't enrolled in any courses yet. Select a course from the library to begin.
                        </p>
                        <button
                          onClick={() => navigate('/dashboard/courses')}
                          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Browse Library
                        </button>
                      </div>
                    )}
                  </motion.section>
                </div>

                {/* Right Column - Sidebar Widgets */}
                <motion.div
                  variants={itemVariants}
                  className="lg:col-span-4 space-y-6"
                >

                  {/* Calendar Widget - Professional Agenda Style */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex gap-1 bg-slate-50 dark:bg-slate-700 rounded-lg p-0.5">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md shadow-sm transition-all"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md shadow-sm transition-all"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {dayNames.map((d, i) => <div key={i}>{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {/* Padding for empty days */}
                      {(() => {
                        const { daysArray, firstDayIndex } = getDaysInMonth(calendarMonth);

                        return (
                          <>
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                              <div key={`empty-${i}`} />
                            ))}

                            {daysArray.map(day => {
                              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isSelected = date.toDateString() === selectedDate.toDateString();
                              const hasNotes = calendarNotes[date.toDateString()]?.length > 0;

                              return (
                                <div
                                  key={day}
                                  onClick={() => setSelectedDate(date)}
                                  onDoubleClick={() => handleDayDoubleClick(date)}
                                  className={`h-9 flex flex-col items-center justify-center rounded-md text-xs font-semibold cursor-pointer transition-all border border-transparent relative ${isSelected
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : isToday
                                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                  title="Double click to add a note"
                                >
                                  <span>{day}</span>
                                  {hasNotes && !isSelected && (
                                    <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-1.5" />
                                  )}
                                  {hasNotes && isSelected && (
                                    <span className="w-1 h-1 rounded-full bg-white absolute bottom-1.5" />
                                  )}
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>

                    {/* Agenda List */}
                    <div className="mt-6 space-y-3">

                      {/* Dynamic Notes for Selected Date */}
                      {calendarNotes[selectedDate.toDateString()]?.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
                            Notes for {selectedDate.getDate()} {selectedDate.toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                          {calendarNotes[selectedDate.toDateString()].map(note => (
                            <div key={note.id} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 group">
                              <div className="w-1 h-auto self-stretch rounded-full bg-blue-500 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight break-words">{note.text}</p>
                                <p className="text-[10px] text-blue-500 mt-1 font-bold opacity-80">{note.time}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNote(note.id);
                                }}
                                className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dynamic Upcoming Deadlines */}
                      {(() => {
                        const allUpcoming = [];
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);

                        Object.entries(calendarNotes).forEach(([dateStr, notes]) => {
                          const date = new Date(dateStr);
                          const isSelectedDate = date.toDateString() === selectedDate.toDateString();
                          
                          if (date >= now && !isSelectedDate) {
                            notes.forEach(note => {
                              allUpcoming.push({ ...note, date });
                            });
                          }
                        });

                        // Sort by date then time
                        allUpcoming.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.time || '').localeCompare(b.time || ''));

                        const nextThree = allUpcoming.slice(0, 3);

                        if (nextThree.length === 0) return null;

                        return (
                          <div className="mt-8">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming Deadlines</p>
                            <div className="space-y-3">
                              {nextThree.map((deadline) => (
                                <div 
                                  key={deadline.id} 
                                  onClick={() => {
                                    setCalendarMonth(new Date(deadline.date));
                                    setSelectedDate(new Date(deadline.date));
                                  }}
                                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group shadow-sm bg-white dark:bg-slate-800"
                                >
                                  <div className={`w-1 h-8 rounded-full bg-blue-500 flex-shrink-0`} />
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">{deadline.text}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {deadline.date.toDateString() === new Date().toDateString() 
                                        ? 'Today' 
                                        : deadline.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {deadline.time || 'All Day'}
                                    </p>
                                  </div>
                                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 self-center" />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>

                  {/* Quick Shortcuts - Clean List */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <h3 className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm">
                      Quick Access
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {[
                        { label: 'My Notes', icon: ClipboardCheck, path: '/dashboard/notes', desc: 'Review your study notes' },
                        { label: 'Community', icon: Users, path: '/dashboard/community', desc: 'Connect with peers' },
                        { label: 'Certificates', icon: Award, path: '/dashboard/certificate', desc: 'View earned credentials' },
                        { label: 'Support', icon: HelpCircle, path: '/dashboard/support', desc: 'Get assistance' }
                      ].map((item, i) => (
                        <div
                          key={i}
                          onClick={() => navigate(item.path)}
                          className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                        >
                          <div className="p-2 rounded-lg bg-slate-50 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors dark:bg-slate-700 dark:text-slate-400 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>

              </div>
            </motion.main>
          </PageTransition>

          {/* Note Modal */}
          {showNoteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowNoteModal(false)}>
              <div
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all border border-slate-200 dark:border-slate-800"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full" />
                  Add Note for {selectedNoteDate?.toLocaleDateString()}
                </h3>
                <textarea
                  autoFocus
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type your note here..."
                  className="w-full h-24 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4 text-sm placeholder:text-slate-400 font-medium"
                />

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Set Time / Deadline
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={selectedNoteTime}
                      onChange={(e) => setSelectedNoteTime(e.target.value)}
                      className="w-full p-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-semibold"
                    />
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
