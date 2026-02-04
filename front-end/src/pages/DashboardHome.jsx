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

const DashboardHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ fullName: "Student", id: "23606" });
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
    const userData = sessionStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

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
          courses = await coursesResponse.json();
          setEnrolledCourses(Array.isArray(courses) ? courses : []);
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

        // Calculate stats
        const totalCourses = courses.length;
        let completedModules = 0;
        let totalModules = 0;
        let completedThisWeek = 0;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        courses.forEach(enrollment => {
          if (enrollment.modules && Array.isArray(enrollment.modules)) {
            enrollment.modules.forEach(module => {
              totalModules++;
              if (module.completed) {
                completedModules++;

                // Check if completed this week
                if (module.completedAt && new Date(module.completedAt) > weekAgo) {
                  completedThisWeek++;
                }
              }
            });
          }
        });

        // Calculate weekly progress
        const weeklyProgressPercent = totalModules > 0
          ? Math.round((completedThisWeek / totalModules) * 100)
          : 0;

        setStats({
          totalCourses,
          completedModules,
          baselineScore: baseline?.baselineScore || 0,
          dayStreak: 12 // TODO: Calculate from activity log
        });

        setWeeklyProgress(weeklyProgressPercent);

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

              {/* Welcome Header - Professional */}
              <div className="mb-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-[#002147] dark:text-white mb-2">
                      Welcome back, {user.fullName.split(' ')[0]}
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

                {/* LEFT COLUMN - Main Content */}
                <div className="lg:col-span-8 space-y-6">


                  {/* Weekly Progress Overview - Professional Card */}
                  <section className="bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-[#002147] dark:text-white mb-1">
                          Weekly Progress
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {enrolledCourses.length > 0
                            ? `You've completed ${weeklyProgress}% of your weekly learning goal`
                            : 'Start learning to track your progress'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#30919D]">{weeklyProgress}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">This week</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#30919D] rounded-full transition-all duration-1000"
                          style={{ width: `${weeklyProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate('/dashboard/courses')}
                        className="px-6 py-2.5 bg-[#30919D] hover:bg-[#287a84] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Continue Learning
                      </button>
                      <button
                        onClick={() => navigate('/profile')}
                        className="px-6 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors"
                      >
                        View Profile
                      </button>
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
                      <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-[#30919D]/30 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                          {/* Left: Thumbnail */}
                          <div
                            onClick={() => navigate('/dashboard/courses')}
                            className="md:col-span-5 relative cursor-pointer overflow-hidden h-56 md:h-full min-h-[240px] group"
                          >
                            <img
                              src={enrolledCourses[0].course?.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"}
                              alt="Course Thumbnail"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                            {/* Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:bg-white transition-colors">
                                <Play className="w-6 h-6 text-[#30919D] fill-current ml-0.5" />
                              </div>
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
                    <ActivityFeed userId={user.id || user._id} />
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
