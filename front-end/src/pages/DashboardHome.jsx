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
  HelpCircle,
  Home
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
      // Don't fetch if user is not loaded yet
      if (!user || (!user.id && !user._id)) {
        setDashboardLoading(false);
        return;
      }

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

    if (user && (user.id || user._id)) {
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

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center lms-dashboard-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#30919D]"></div>
      </div>
    );
  }

  return (
    <>
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )}

      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] dark:bg-[#020617] dark:text-gray-100 font-sans transition-colors duration-300">
        <DashboardSidebar />

        <div className="min-h-screen pb-20 lg:pb-0">
          <PageTransition>

            {/* Dashboard Content */}
            <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">

              {/* Header with Greeting, Progress Bar, Date & Time */}
              <div className="mb-6 bg-white dark:bg-[#002147] rounded-[24px] p-3 md:p-4 shadow-sm border border-gray-100 dark:border-white/10 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#30919D]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left: Greeting & Progress */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h1 className="text-xl font-bold text-[#002147] dark:text-white mb-0.5">
                          Welcome back, {user?.fullName?.split(' ')[0] ? (user.fullName.split(' ')[0].charAt(0).toUpperCase() + user.fullName.split(' ')[0].slice(1).toLowerCase()) : 'Student'}!
                        </h1>
                        <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">Keep up the momentum and continue your learning journey!</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h2 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3 text-[#30919D]" />
                            Overall Progress
                          </h2>
                          <span className="text-sm font-black text-[#30919D]">{weeklyProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden border border-gray-50 dark:border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${weeklyProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#30919D] to-[#287a84] rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Date & Time */}
                    <div className="flex items-center gap-3 pl-0 lg:pl-8 lg:border-l border-gray-100 dark:border-white/10">
                      <div className="w-11 h-11 rounded-xl bg-[#002147]/5 dark:bg-white/5 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-[#002147] dark:text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#002147] dark:text-white">
                          {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-400">
                          {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT CONTENT AREA */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Compact Horizontal Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { label: 'Completed Modules', value: stats.completedModules, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                      { label: 'Baseline Score', value: `${stats.baselineScore}%`, icon: Zap, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                      { label: 'Learning Streak', value: stats.dayStreak, icon: Award, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-[#002147]/40 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-3 transition-all hover:shadow-md group">
                        <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-3`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{stat.label}</p>
                          <h2 className="text-lg font-bold text-[#002147] dark:text-white">{stat.value}</h2>
                        </div>
                      </div>
                    ))}
                  </div>


                  {/* Redesigned Current Course */}
                  <section>
                    <h2 className="text-xl font-bold text-[#002147] dark:text-white mb-3">Current Course</h2>
                    <div className="relative group cursor-pointer overflow-hidden rounded-[24px] h-[420px] shadow-xl">
                      <img
                        src={enrolledCourses[0]?.course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"}
                        alt="Current Course"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-lg">
                          <Play className="w-8 h-8 text-white fill-current ml-1" />
                        </div>
                      </div>

                      {/* Course Title Badge */}
                      <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 dark:bg-[#002147]/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-white/10">
                        <span className="text-xs font-bold text-[#002147] dark:text-white">{enrolledCourses[0]?.course?.title || 'Current Learning'}</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* RIGHT SIDEBAR AREA */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* Redesigned Calendar */}
                  <div className="bg-white dark:bg-[#002147]/60 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex gap-1">
                        <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 bg-gray-50 border border-gray-100 transition-colors">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 bg-gray-50 border border-gray-100 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <span key={d} className="text-[9px] font-bold text-gray-300 dark:text-gray-500 uppercase tracking-widest">{d}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty slots for month start offset */}
                      {Array.from({ length: getDaysInMonth(calendarMonth).firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                      ))}
                      
                      {getDaysInMonth(calendarMonth).daysArray.map(day => {
                        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        
                        return (
                          <div
                            key={day}
                            onClick={() => setSelectedDate(date)}
                            className={`h-8 flex items-center justify-center rounded-lg cursor-pointer text-[13px] font-medium transition-all ${
                              isSelected ? 'bg-[#30919D] text-white shadow-md' : 
                              isToday ? 'bg-[#30919D]/10 text-[#30919D] dark:bg-[#30919D]/20' : 
                              'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#002147] dark:text-white">Introduction</p>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500">Scheduled for today</p>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Deadlines (Functional) */}
                  <div className="bg-white dark:bg-[#002147]/60 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 transition-all duration-300">
                    <UpcomingDeadlines 
                      tasks={tasks}
                      onAddTask={handleAddTask}
                      onToggleTask={handleToggleTaskStatus}
                      onDeleteTask={handleDeleteTask}
                    />
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white dark:bg-[#002147]/60 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/10 transition-all duration-300">
                    <h3 className="text-sm font-bold text-[#002147] dark:text-white mb-4">Recent Activity</h3>
                    <div className="flex flex-col items-center justify-center py-4 opacity-40">
                      <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-2">
                        <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">No recent activity</p>
                    </div>
                  </div>

                </div>
              </div>
            </main>

            {/* Bottom Mobile Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#001229] border-t border-gray-100 dark:border-white/10 px-8 py-5 flex items-center justify-between z-50 shadow-[0_-5px_25px_-10px_rgba(0,0,0,0.15)] rounded-t-[32px] transition-all duration-300">
              {[
                { icon: Home, label: "Dashboard", path: "/dashboard", active: true },
                { icon: BookOpen, label: "My Courses", path: "/dashboard/courses" },
                { icon: Users, label: "Community", path: "/dashboard/community" },
                { icon: Zap, label: "Toolkit", path: "/dashboard/smaart-toolkit" },
                { icon: MoreHorizontal, label: "More", action: () => setShowVisionSplash(true) }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={() => item.path && navigate(item.path) || item.action && item.action()}>
                  <item.icon className={`w-6 h-6 ${item.active ? 'text-[#002147] dark:text-white' : 'text-gray-400 dark:text-gray-600'}`} />
                  <span className={`text-[10px] font-bold ${item.active ? 'text-[#002147] dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </PageTransition>
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
