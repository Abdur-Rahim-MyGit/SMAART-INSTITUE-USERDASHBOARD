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
                
                // Assume 6 sessions per module if not specified
                for (let d = 1; d <= 6; d++) {
                  const isVidDone = videoProgress.some(vp => vp.dayId === d && vp.isCompleted);
                  const isTaskDone = completedTasks.some(ct => ct.dayId === d);
                  
                  if (!isVidDone || !isTaskDone) {
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

    if (user.id || user._id) {
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

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Stats Dashboard Widget */}
                <div className="lg:col-span-12 mb-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {dashboardLoading ? (
                      // Show skeleton while loading
                      [1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)
                    ) : (
                      // Show real stats
                      [
                        {
                          label: 'Total Courses',
                          value: stats.totalCourses,
                          icon: BookOpen,
                          bgColor: 'bg-blue-100 dark:bg-blue-500/20',
                          textColor: 'text-blue-600 dark:text-blue-400'
                        },
                        {
                          label: 'Completed Modules',
                          value: stats.completedModules,
                          icon: CheckCircle2,
                          bgColor: 'bg-green-100 dark:bg-green-500/20',
                          textColor: 'text-green-600 dark:text-green-400'
                        },
                        {
                          label: 'Baseline Score',
                          value: `${stats.baselineScore}%`,
                          icon: TrendingUp,
                          bgColor: 'bg-purple-100 dark:bg-purple-500/20',
                          textColor: 'text-purple-600 dark:text-purple-400'
                        },
                        {
                          label: 'Day Streak',
                          value: stats.dayStreak,
                          icon: Zap,
                          bgColor: 'bg-orange-100 dark:bg-orange-500/20',
                          textColor: 'text-orange-600 dark:text-orange-400'
                        }
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="lms-card p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-[#002147] dark:text-white">
                            {stat.value}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                            {stat.label}
                          </p>
                        </motion.div>
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
                              Welcome back, {user.fullName.split(' ')[0]}! 👋
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

                          <div className="mt-8 flex items-center gap-4">
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
                              View Activity
                            </button>
                          </div>
                        </div>

                        {/* Hero Illustration/Graphic */}
                        <div className="hidden md:block relative">
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#30919D] to-[#002147] p-1 shadow-2xl rotate-3">
                            <img
                              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=300"
                              alt="Student"
                              className="w-full h-full object-cover rounded-xl opacity-90"
                            />
                          </div>
                          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-[#1e293b] p-3 rounded-xl shadow-lg border border-gray-100 dark:border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#002147] dark:text-white">Task Done</p>
                              <p className="text-[10px] text-gray-400">Just now</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 2. Featured Course / Continue Learning */}
                  <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h2 className="text-lg font-bold text-[#002147] dark:text-white">Continue Learning</h2>
                      <button
                        onClick={() => navigate('/dashboard/courses')}
                        className="text-xs font-semibold text-[#30919D] hover:underline"
                      >
                        View All Courses
                      </button>
                    </div>

                    {/* Course Card - Dynamic Content */}
                    {dashboardLoading ? (
                      // Show skeleton while loading
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
                          </div>
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-medium">
                            Continue Learning
                          </div>
                        </div>

                        {/* Right: Details & Modules */}
                        <div className="md:col-span-7 space-y-4">
                          <div>
                            <span className="text-[10px] font-bold tracking-widest text-[#30919D] uppercase mb-1 block">Current Course</span>
                            <h3 className="text-xl font-bold text-[#002147] dark:text-white mb-1">
                              {enrolledCourses[0].course?.title || 'Your Course'}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {enrolledCourses[0].course?.description || 'Continue your learning journey'}
                            </p>
                          </div>

                          <div className="space-y-3">
                            {/* Show progress */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#30919D]/10 flex items-center justify-center text-[#30919D]">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-[#002147] dark:text-white">
                                    {stats.completedModules} Modules Completed
                                  </p>
                                  <p className="text-[10px] text-gray-400">Keep going!</p>
                                </div>
                              </div>
                              <div className="text-xs font-bold text-[#30919D]">
                                {enrolledCourses[0].progress || 0}%
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => navigate('/dashboard/courses')}
                              className="text-xs font-bold text-[#002147] dark:text-white hover:text-[#30919D] flex items-center gap-1 transition-colors"
                            >
                              View All Courses <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Empty state - no enrolled courses
                      <div className="lms-card p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-[#002147] dark:text-white mb-2">
                          No Courses Yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Start your learning journey by enrolling in a course
                        </p>
                        <button
                          onClick={() => navigate('/dashboard/courses')}
                          className="px-6 py-2.5 bg-[#30919D] text-white rounded-xl text-sm font-semibold hover:bg-[#287a84] transition-colors inline-flex items-center gap-2"
                        >
                          Browse Courses <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Quick Access Grid (Optional - if space allows) */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                      {[
                        { label: 'My Notes', icon: ClipboardCheck, action: () => navigate('/dashboard/notes') },
                        { label: 'Resources', icon: BookOpen, action: () => toast.info('Video & Book Library Coming Soon!', { position: 'top-center' }) },
                        { label: 'Discussions', icon: MessageSquare, action: () => navigate('/dashboard/community') },
                        { label: 'Mentors', icon: Users, action: () => toast.info('Mentorship Program Coming Soon!', { position: 'top-center' }) },
                        {
                          label: 'Retest Baseline', icon: Zap, action: async () => {
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
                          }
                        },
                        { label: 'Support', icon: HelpCircle, action: () => navigate('/dashboard/support') }
                      ].map((item, i) => (
                        <div
                          key={i}
                          onClick={item.action}
                          className="p-4 rounded-[20px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-[#30919D]/50 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 group-hover:bg-[#30919D]/10 text-gray-400 group-hover:text-[#30919D] flex items-center justify-center transition-colors">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold text-[#002147] dark:text-white">{item.label}</span>
                          {(item.label === 'Retest Baseline') && (
                            <span className="text-[9px] text-red-500 bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded-full font-bold">DEV</span>
                          )}
                          {(item.label === 'Resources' || item.label === 'Mentors') && (
                            <span className="text-[9px] text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-1.5 py-0.5 rounded-full font-bold">Upcoming</span>
                          )}
                        </div>
                      ))}
                    </div>

                  </section>
                </div>

                {/* RIGHT COLUMN - Stats & Tasks */}
                <div className="lg:col-span-4 space-y-8">

                  {/* 1. Calendar Widget */}
                  <div className="lms-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-bold text-[#002147] dark:text-white">
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          onClick={handlePrevMonth}
                          className="w-7 h-7 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-[#30919D] hover:text-white transition-colors text-gray-400"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleNextMonth}
                          className="w-7 h-7 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-[#30919D] hover:text-white transition-colors text-gray-400"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {dayNames.map(d => (
                        <div key={Math.random()} className="text-[10px] font-bold text-gray-400 uppercase h-8 flex items-center justify-center">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {getDaysInMonth(calendarMonth).map(day => {
                        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();

                        // Check if day has tasks
                        const hasTasks = tasks.some(t => new Date(t.date).toDateString() === date.toDateString());

                        return (
                          <div
                            key={day}
                            onClick={() => setSelectedDate(date)}
                            className={`h-9 rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all ${isSelected || isToday
                              ? 'bg-[#30919D] text-white shadow-lg shadow-[#30919D]/30'
                              : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                              }`}
                          >
                            <span className="text-xs font-semibold">{day}</span>
                            {/* Dot for events - REAL DATA */}
                            {hasTasks && !isSelected && !isToday && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#daa520] absolute bottom-1.5" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 2. Upcoming Deadlines Widget */}
                  <div className="h-[400px] mb-6">
                    {dashboardLoading ? (
                      <div className="lms-card p-6 h-full">
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
                  <div className="mb-6">
                    <ActivityFeed userId={user.id || user._id} />
                  </div>

                  {/* 4. Upgrade/Promo Card (from image inspiration) */}
                  <div className="rounded-[24px] bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-6 text-white text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]" />
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3 backdrop-blur-md">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Unlock Premium</h3>
                      <p className="text-white/70 text-xs mb-4 px-2">Get unlimited access to all courses and mentor chats.</p>
                      <button
                        onClick={() => toast.info('Premium features coming soon! 🚀', { position: 'top-center' })}
                        className="w-full py-2.5 rounded-xl bg-white text-[#5B21B6] text-xs font-bold hover:bg-gray-50 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    </div>
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
