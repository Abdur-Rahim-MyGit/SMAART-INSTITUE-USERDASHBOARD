import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import PageTransition from "@/components/PageTransition";
import ContinueLearningCarousel from "@/components/ContinueLearningCarousel";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import {
  TrendingUp,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronRight,
  ClipboardCheck,
  Zap,
  Bell,
  Play,
  ChevronLeft,
  BookOpen,
  Users,
  Award,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { getTasks, createTask, updateTask, deleteTask } from "@/services/taskService";
import useAvatar from '@/hooks/useAvatar';
import CourseCardSkeleton from '@/components/skeletons/CourseCardSkeleton';
import StatsCardSkeleton from '@/components/skeletons/StatsCardSkeleton';
import TaskListSkeleton from '@/components/skeletons/TaskListSkeleton';
import { API_BASE_URL } from '@/services/api';
import ActivityFeed from '@/components/ActivityFeed';
import UpcomingDeadlines from '@/components/UpcomingDeadlines';
import useUser from "@/hooks/useUser";

const DashboardHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: userLoading } = useUser();
  const { avatarData } = useAvatar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showVisionSplash, setShowVisionSplash] = useState(false);

  const [activeTaskTab, setActiveTaskTab] = useState("All tasks");

  // Real data states
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedModules: 0,
    baselineScore: 0,
    dayStreak: 12
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  // Check if this is a fresh login (show splash)
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('visionSplashShown');
    if (!hasSeenSplash) {
      setShowVisionSplash(true);
    }
  }, []);
  useEffect(() => {
    // Real-time clock update
    const clockInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [location.key]);

  const handleVisionSplashComplete = () => {
    setShowVisionSplash(false);
    sessionStorage.setItem('visionSplashShown', 'true');
  };

  // Fetch Dashboard Data (Real Data Integration)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);
        setDashboardError(null);

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
        const totalCourses = courses.length;
        let completedModulesCount = 0;
        let totalProgressSum = 0;
        let resumeUrl = '/dashboard/courses';
        
        // Find the "Active" course (most recently accessed or first one)
        const activeCourseEnrollment = [...courses].sort((a, b) => 
          new Date(b.lastAccessedAt || 0) - new Date(a.lastAccessedAt || 0)
        )[0];

        if (activeCourseEnrollment) {
          const course = activeCourseEnrollment.course;
          const enrollment = activeCourseEnrollment;
          
          // Basic logic: find first module and day that isn't fully completed
          // We look into enrollment.moduleProgress which we populated in backend
          let resumeModuleId = 1;
          let resumeDayId = 1;

          if (course && Array.isArray(course.modules)) {
            let found = false;
            for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
              const moduleDoc = course.modules[mIdx];
              const modProgress = (enrollment.moduleProgress || []).find(
                mp => mp.module === moduleDoc._id || mp.module?._id === moduleDoc._id
              );

              if (!modProgress || modProgress.status !== 'completed') {
                resumeModuleId = mIdx + 1;
                
                // Find first day that isn't completed in this module
                // We check videoProgress and completedTasks
                const videoProgress = modProgress?.videoProgress || [];
                const completedTasks = modProgress?.completedTasks || [];
                
                // Use actual days from module if available, otherwise fallback to 6
                const daysCount = moduleDoc.days?.length || 6;
                
                for (let d = 1; d <= daysCount; d++) {
                  // Check simple completion first (if we have day-level tracking in future)
                  // For now check granular progress
                  
                  // Check if any video step for this day is completed
                  // In new model, we might have multiple steps. 
                  // If ANY step is done, we consider "started". 
                  // But to be "completed", ALL steps for that day should be done.
                  // For "resume", we want the first NOT fully completed day.
                  
                  // However, the current logic checks if *any* video is done. 
                  // If isVidDone is true, it skips. This implies "if begun, count as done"? 
                  // The original code was: if (!isVidDone || !isTaskDone) -> resumeDayId = d;
                  // So if EITHER video OR task is NOT done, we resume there.
                  // This means we find the first day where something is missing.
                  
                  const isVidDone = videoProgress.some(vp => vp.dayId === d && vp.isCompleted);
                  const isTaskDone = completedTasks.some(ct => ct.dayId === d);
                  
                  // If tasks exist for this day in the module definition, check them
                  const dayDoc = moduleDoc.days?.find(day => day.dayNumber === d || day.id === d);
                  const hasTasks = dayDoc?.tasks?.length > 0;
                  
                  // If there are no tasks, ignore isTaskDone check
                  const taskCondition = hasTasks ? isTaskDone : true;
                  
                  // Simplied: If video is not done OR (tasks exist and are not done)
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
             // If courseId is valid MongoDB ID, use it, else use normalized code (fallback)
             const cid = course._id;
             resumeUrl = `/dashboard/courses/${cid}/modules/${resumeModuleId}/days/${resumeDayId}`;
          }
        }

        courses.forEach(enrollment => {
          totalProgressSum += (enrollment.progress || 0);
          if (enrollment.moduleProgress && Array.isArray(enrollment.moduleProgress)) {
            enrollment.moduleProgress.forEach(module => {
              if (module.status === 'completed') {
                completedModulesCount++;
              }
            });
          }
        });

        // Calculate average progress across all enrolled courses
        const overallProgress = totalCourses > 0 
          ? Math.round(totalProgressSum / totalCourses) 
          : 0;

        setStats({
          totalCourses,
          completedModules: completedModulesCount,
          baselineScore: baseline?.baselineScore || 0,
          dayStreak: 12, // TODO: Calculate from activity log
          resumeUrl
        });

        setWeeklyProgress(overallProgress);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setDashboardError(error.message || 'Failed to load dashboard data');
        toast.error('Could not load some dashboard data');
      } finally {
        setDashboardLoading(false);
      }
    };

    if (user?.id || user?._id) {
      fetchDashboardData();
    }
  }, [user]);

  // --- Calendar Logic ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // --- Tasks Logic (REAL-TIME DB) ---
  const [tasks, setTasks] = useState([]);

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      // toast.error("Could not load tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (activeTaskTab === "All tasks") return true;
    if (activeTaskTab === "Progress") return task.status === "Pending" || task.status === "Submitted";
    if (activeTaskTab === "Done") return task.status === "Completed";
    return true;
  });

  const handleAddTask = async (title) => {
    if (!title || !title.trim()) return;

    try {
      const newTask = {
        title: title,
        date: selectedDate, // Use currently selected date
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        type: "personal",
        status: "Pending"
      };

      await createTask(newTask);
      await fetchTasks(); // Refresh list
      toast.success("Task added to calendar!");
    } catch (error) {
      toast.error("Failed to add task");
    }
  };

  const handleToggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === "Completed" ? "Pending" : "Completed";
      // Optimistic update
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));

      await updateTask(task._id, { status: newStatus });
      await fetchTasks(); // Sync
    } catch (error) {
      toast.error("Failed to update status");
      fetchTasks(); // Revert
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      // Optimistic update
      setTasks(tasks.filter(t => t._id !== id));
      await deleteTask(id);
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
      fetchTasks();
    }
  };

  const feedbacks = [
    { id: 1, subject: "Marketing Management", professor: "Dr. John Smith", time: "Thursday, 10:00 AM", priority: "High Priority", text: "Corrections required for you assessment task -20; please look into the ongoing learning outcome-c and the guidelines in the pdf." },
    { id: 2, subject: "Financial Analysis", professor: "Dr. MacAllister", time: "Thursday, 7:00 PM", priority: "Low Priority", text: "Outstanding work! The historical research on stock market performance was impressive. However please write in depth about the 2008 financial crisis." },
  ];

  const days = [
    { day: "Wed", date: 5 },
    { day: "Thu", date: 6 },
    { day: "Fri", date: 7, active: true },
    { day: "Sun", date: 9 },
    { day: "Sat", date: 8 },
    { day: "Sat", date: 8 },
    { day: "Sun", date: 9 },
    { day: "Mon", date: 10 },
    { day: "Tue", date: 11 },
  ];

  return (
    <>
      {/* Vision Board Splash on Login */}
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )}

      <div className="min-h-screen lms-dashboard-bg text-[#1A1A1A] font-sans">
        <DashboardSidebar />

        <div className="min-h-screen">
          <PageTransition>

            {/* Dashboard Content */}
            <main className="max-w-[1600px] mx-auto p-6 lg:p-8">

              {/* Welcome Header - Professional */}
              <div className="mb-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-[#002147] dark:text-white mb-2">
                      Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-300">
                      Here's your learning overview for today
                    </p>
                  </div>
                  {stats.dayStreak > 0 && (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
                      <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                        {stats.dayStreak} day streak
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Stats Dashboard - Clean Professional Design */}
                <div className="lg:col-span-12 mb-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {dashboardLoading ? (
                      [1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)
                    ) : (
                      [
                        {
                          label: 'Total Courses',
                          value: stats.totalCourses,
                          icon: BookOpen,
                          color: 'blue',
                          iconBg: 'bg-blue-100 dark:bg-blue-500/20',
                          iconColor: 'text-blue-600 dark:text-blue-400',
                          trend: '+2 this month'
                        },
                        {
                          label: 'Completed Modules',
                          value: stats.completedModules,
                          icon: CheckCircle2,
                          color: 'emerald',
                          iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
                          iconColor: 'text-emerald-600 dark:text-emerald-400',
                          trend: '+5 this week'
                        },
                        {
                          label: 'Baseline Score',
                          value: `${stats.baselineScore}%`,
                          icon: TrendingUp,
                          color: 'purple',
                          iconBg: 'bg-purple-100 dark:bg-purple-500/20',
                          iconColor: 'text-purple-600 dark:text-purple-400',
                          trend: 'Excellent'
                        },
                        {
                          label: 'Learning Streak',
                          value: `${stats.dayStreak}d`,
                          icon: Award,
                          color: 'amber',
                          iconBg: 'bg-amber-100 dark:bg-amber-500/20',
                          iconColor: 'text-amber-600 dark:text-amber-400',
                          trend: 'Keep going!'
                        }
                      ].map((stat, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-white/5 rounded-xl p-5 border border-gray-200 dark:border-white/10 hover:border-[#30919D]/30 dark:hover:border-[#30919D]/30 transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-11 h-11 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          </div>

                          <div>
                            <p className="text-2xl font-bold text-[#002147] dark:text-white mb-1">
                              {stat.value}
                            </p>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                              {stat.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {stat.trend}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* LEFT COLUMN - Main Content (Hero + Courses) */}
                <div className="lg:col-span-8 space-y-8">

                  {/* 1. Feature Hero Message */}
                  <section className="relative overflow-hidden rounded-[24px] bg-[#002147] p-8 shadow-xl">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#30919D]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#30919D 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium mb-4 backdrop-blur-md border border-white/10">
                              <Zap className="w-3 h-3 text-[#daa520]" />
                              <span>Daily Streak: {stats.dayStreak} Days</span>
                            </span>
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                              Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}! 👋
                            </h1>
                            <p className="text-white/70 text-base max-w-xl leading-relaxed">
                              You've completed <span className="text-white font-semibold">{weeklyProgress}%</span> of your overall course journey.
                              {enrolledCourses.length > 0 ? (
                                <> Keep up the momentum and continue your learning journey!</>
                              ) : (
                                <> Start your learning journey by enrolling in a course!</>
                              )}
                            </p>

                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-xs text-white/70">
                                <span>Overall Progress</span>
                                <span>{weeklyProgress}%</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${weeklyProgress}%` }}
                                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                                  className="h-full bg-[#30919D] rounded-full"
                                />
                              </div>
                            </div>
                          </motion.div>

                          <div className="mt-8 flex items-center gap-6">
                            <button
                              onClick={() => navigate(stats.resumeUrl || '/dashboard/courses')} // Redirect to resume point
                              className="px-6 py-2.5 bg-[#30919D] hover:bg-[#287a84] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#30919D]/20 flex items-center gap-2"
                            >
                              Resume Learning
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => navigate('/profile')}
                              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all backdrop-blur-md border border-white/10"
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      </div>



                    {/* Action Buttons */}

                  </div>
                  </section>

                  {/* Current Course - Professional Design */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#002147] dark:text-white">Current Course</h2>
                      <button
                        onClick={() => navigate('/dashboard/courses')}
                        className="text-sm font-medium text-[#30919D] hover:text-[#287a84] flex items-center gap-1 transition-colors"
                      >
                        View All
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Course Card - Clean Professional Design */}
                    {dashboardLoading ? (
                      <CourseCardSkeleton />
                    ) : enrolledCourses.length > 0 ? (
                      // Show first enrolled course
                      <div className="lms-card p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Left: Video Thumbnail */}
                        <div
                          onClick={() => navigate(stats.resumeUrl || '/dashboard/courses')}
                          className="md:col-span-5 relative group cursor-pointer overflow-hidden rounded-2xl h-48 md:h-full min-h-[180px]"
                        >
                          <img
                            src={enrolledCourses[0].course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"}
                            alt="Course Thumbnail"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 text-white fill-current" />
                            </div>

                            {/* Progress Badge */}
                            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[#002147] text-xs font-bold shadow-sm">
                              {enrolledCourses[0].progress || 0}% Complete
                            </div>
                          </div>

                          {/* Right: Details */}
                          <div className="md:col-span-7 p-6">
                            <div className="mb-4">
                              <span className="text-xs font-semibold text-[#30919D] uppercase tracking-wide">In Progress</span>
                              <h3 className="text-xl font-bold text-[#002147] dark:text-white mt-2 mb-2">
                                {enrolledCourses[0].course?.title || 'Your Course'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {enrolledCourses[0].course?.description || 'Continue your learning journey'}
                              </p>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <BookOpen className="w-4 h-4" />
                                <span>{stats.completedModules} modules</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>2h 30m left</span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                                <span>Course Progress</span>
                                <span className="font-semibold text-[#30919D]">{enrolledCourses[0].progress || 0}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#30919D] rounded-full transition-all duration-1000"
                                  style={{ width: `${enrolledCourses[0].progress || 0}%` }}
                                />
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => navigate('/dashboard/courses')}
                              className="w-full md:w-auto px-5 py-2.5 bg-[#30919D] hover:bg-[#287a84] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              Continue Course
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Empty state
                      <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 p-10 text-center">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-[#002147] dark:text-white mb-2">
                          No Courses Yet
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                          Start your learning journey by enrolling in a course
                        </p>
                        <button
                          onClick={() => navigate('/dashboard/courses')}
                          className="px-6 py-2.5 bg-[#30919D] text-white rounded-lg text-sm font-semibold hover:bg-[#287a84] transition-colors inline-flex items-center gap-2"
                        >
                          Browse Courses
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}


                    {/* Quick Access - Clean Professional Grid */}
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                      {[
                        { label: 'My Notes', icon: ClipboardCheck, action: () => navigate('/dashboard/notes') },
                        { label: 'Resources', icon: BookOpen, action: () => toast.info('Coming Soon', { position: 'top-center' }), badge: 'Soon' },
                        { label: 'Community', icon: MessageSquare, action: () => navigate('/dashboard/community') },
                        { label: 'Mentors', icon: Users, action: () => toast.info('Coming Soon', { position: 'top-center' }), badge: 'Soon' },
                        {
                          label: 'Retest',
                          icon: Zap,
                          action: async () => {
                            if (!window.confirm("Reset Baseline Assessment for testing?")) return;
                            try {
                              const response = await fetch(`http://localhost:5000/api/baselineresults/reset/${user.id || user._id}`, { method: 'DELETE' });
                              const data = await response.json();
                              if (data.success) {
                                toast.success("Baseline reset! Reloading...");
                                window.location.reload();
                              } else {
                                toast.error("Failed to reset");
                              }
                            } catch (e) { toast.error("Error resetting: " + e.message); }
                          },
                          badge: 'DEV'
                        },
                        { label: 'Support', icon: HelpCircle, action: () => navigate('/dashboard/support') }
                      ].map((item, i) => (
                        <div
                          key={i}
                          onClick={item.action}
                          className="relative p-4 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#30919D]/40 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
                        >
                          <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                          {item.badge && (
                            <span className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded font-semibold ${item.badge === 'DEV'
                              ? 'text-red-600 bg-red-50 dark:bg-red-500/10'
                              : 'text-orange-600 bg-orange-50 dark:bg-orange-500/10'
                              }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                  </section>
                </div>


                {/* RIGHT COLUMN - Professional Sidebar */}
                <div className="lg:col-span-4 space-y-6">

                  {/* 1. Calendar Widget - Clean Design */}
                  <div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-bold text-[#002147] dark:text-white">
                          {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your Schedule</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrevMonth}
                          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-[#30919D] hover:text-white transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleNextMonth}
                          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-[#30919D] hover:text-white transition-colors text-gray-600 dark:text-gray-400"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                      {dayNames.map((d, idx) => (
                        <div key={idx} className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase h-8 flex items-center justify-center">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {getDaysInMonth(calendarMonth).map(day => {
                        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const hasTasks = tasks.some(t => new Date(t.date).toDateString() === date.toDateString());

                        return (
                          <div
                            key={day}
                            onClick={() => setSelectedDate(date)}
                            className={`h-10 rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all ${isSelected || isToday
                                ? 'bg-[#30919D] text-white shadow-sm'
                                : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                              }`}
                          >
                            <span className="text-sm font-medium">{day}</span>
                            {hasTasks && !isSelected && !isToday && (
                              <span className="w-1 h-1 rounded-full bg-[#30919D] absolute bottom-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Today's Date Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#30919D]/10 flex items-center justify-center">
                          <CalendarIcon className="w-5 h-5 text-[#30919D]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#002147] dark:text-white">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Upcoming Deadlines Widget */}
                  <div className="h-[400px]">
                    {dashboardLoading ? (
                      <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 h-full">
                        <TaskListSkeleton />
                      </div>
                    ) : (
                      <UpcomingDeadlines
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onToggleTask={handleToggleTaskStatus}
                        onDeleteTask={handleDeleteTask}
                      />
                    )}
                  </div>

                  {/* 3. Activity Feed Widget */}
                  <div>
                    {user && <ActivityFeed userId={user.id || user._id} />}
                  </div>

                  {/* 4. Upgrade Card - Clean Professional Design */}
                  <div className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-xl p-6 text-white">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1">Upgrade to Premium</h3>
                        <p className="text-white/80 text-sm">
                          Unlock all features and get unlimited access
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {['Unlimited Courses', 'Priority Support', 'Exclusive Content'].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-white/90">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => toast.info('Premium features coming soon!', { position: 'top-center' })}
                      className="w-full py-2.5 rounded-lg bg-white text-[#7C3AED] text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Upgrade Now
                    </button>

                    <p className="text-xs text-white/60 mt-3 text-center">
                      Starting at $9.99/month
                    </p>
                  </div>

                </div>

              </div>
            </main>
          </PageTransition>
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
