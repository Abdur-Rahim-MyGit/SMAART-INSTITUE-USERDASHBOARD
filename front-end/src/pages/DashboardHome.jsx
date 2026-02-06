import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import PageTransition from "@/components/PageTransition";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import BadgeModal from "@/components/badges/BadgeModal";import {
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
  Search,
  Layout,
  Target,
  Sparkles,
  Flame,
  Star,
  Medal,
  Trophy} from "lucide-react";
import { toast } from "sonner";
import { getTasks, createTask, updateTask, deleteTask } from "@/services/taskService";
import useAvatar from '@/hooks/useAvatar';
import CourseCardSkeleton from '@/components/skeletons/CourseCardSkeleton';
import StatsCardSkeleton from '@/components/skeletons/StatsCardSkeleton';
import TaskListSkeleton from '@/components/skeletons/TaskListSkeleton';
import { API_BASE_URL } from '@/services/api';
import ActivityFeed from '@/components/ActivityFeed';
import UpcomingDeadlines from '@/components/UpcomingDeadlines';
=======
import useUser from "@/hooks/useUser";
>>>>>>> fc2825fbaa54e1b4fc5ae041d1051e6ce061b29f

const DashboardHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
<<<<<<< HEAD
  // Version: 1.0.4 - Robust property access and safe default state
  const [user, setUser] = useState({ fullName: "Student" });
  const { avatarData } = useAvatar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showVisionSplash, setShowVisionSplash] = useState(false);  const [activeTaskTab, setActiveTaskTab] = useState("All tasks");

  // Real data states
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);  const [dashboardError, setDashboardError] = useState(null);
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
    const clockInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [location.key]);

  const handleVisionSplashComplete = () => {
    setShowVisionSplash(false);
    sessionStorage.setItem('visionSplashShown', 'true');
  };

  // Fetch Dashboard Data  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);
=======
        setDashboardError(null);

>>>>>>> fc2825fbaa54e1b4fc5ae041d1051e6ce061b29f
        const userId = user.id || user._id;
        const token = sessionStorage.getItem('token');

        if (!userId || !token) {
          setDashboardLoading(false);
          return;
        }

<<<<<<< HEAD
        // Fetch courses, baseline results and earned badges
        const [coursesRes, baselineRes, badgesRes] = await Promise.all([
          fetch(`${API_BASE_URL.replace('/api', '')}/api/courseEnrollments/student/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL.replace('/api', '')}/api/baselineresults/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL.replace('/api', '')}/api/badges/user/${userId}/earned`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        let courses = [];
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          courses = coursesData.data || (Array.isArray(coursesData) ? coursesData : []);
          setEnrolledCourses(courses);
        }

        let baseline = null;
        if (baselineRes.ok) {
          const baselineData = await baselineRes.json();
          baseline = baselineData.data || (baselineData.success ? baselineData.data : baselineData);
        }

        let badgesData = [];
        if (badgesRes.ok) {
          const resJson = await badgesRes.json();
          badgesData = resJson.data || [];
          setEarnedBadges(badgesData);
          setBadgesLoading(false);
        }

        const totalCourses = Array.isArray(courses) ? courses.length : 0;
        let completedModules = 0;
        let totalModules = 0;
        let completedThisWeek = 0;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        if (Array.isArray(courses)) {
          courses.forEach(enrollment => {
            if (enrollment.modules && Array.isArray(enrollment.modules)) {
              enrollment.modules.forEach(module => {
                totalModules++;
                if (module.completed) {
                  completedModules++;
                  if (module.completedAt && new Date(module.completedAt) > weekAgo) {
                    completedThisWeek++;
                  }
                }
              });
            }
          });
        }

        const weeklyProgressPercent = totalModules > 0
          ? Math.round((completedThisWeek / totalModules) * 100)          : 0;

        setStats({
          totalCourses,
          completedModules,
          baselineScore: baseline?.baselineScore || 0,
          dayStreak: 12,
          badgeCount: badgesData.length
        });

        setWeeklyProgress(weeklyProgressPercent);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Could not load some dashboard data');
      } finally {
        setDashboardLoading(false);
        setBadgesLoading(false);
      }
    };

    if (user && (user.id || user._id)) fetchDashboardData();
  }, [user]);

  // Calendar/Tasks logic (preserved)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleAddTask = async (title) => {
    if (!title || !title.trim()) return;
    try {
      await createTask({
        title, date: selectedDate,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: "personal", status: "Pending"
      });
      fetchTasks();
      toast.success("Task added!");
    } catch (error) { toast.error("Failed to add task"); }  };

  const handleToggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === "Completed" ? "Pending" : "Completed";
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
      await updateTask(task._id, { status: newStatus });
      fetchTasks();
    } catch (error) { toast.error("Failed to update status"); fetchTasks(); }  };

  const handleDeleteTask = async (id) => {
    try {
      setTasks(tasks.filter(t => t._id !== id));
      await deleteTask(id);
      toast.success("Task deleted");
    } catch (error) { toast.error("Failed to delete task"); fetchTasks(); }
  };

  const openBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setIsBadgeModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {showVisionSplash && (
          <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
        )}
      </AnimatePresence>

      <BadgeModal
        badge={selectedBadge}
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        userName={user?.fullName || "Student"}
      />

      <div className="min-h-screen lms-dashboard-bg text-slate-900 dark:text-slate-100 font-sans selection:bg-[#30919D]/30">        <DashboardSidebar />

        <div className="min-h-screen">
          <PageTransition>
            <main className="max-w-[1700px] mx-auto p-4 lg:p-8 space-y-8">

              {/* --- PREMIUM HERO BANNER --- */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-[300px] lg:h-[350px] rounded-[2.5rem] overflow-hidden group shadow-2xl"
              >
                {/* Visual Background */}
                <div className="absolute inset-0">
                  <img
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920"
                    alt="Network"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#002147] via-[#002147]/90 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002147] via-transparent to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative h-full flex flex-col justify-center px-10 lg:px-16 z-10 max-w-4xl">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <div className="px-3 py-1 rounded-full bg-[#30919D]/20 backdrop-blur-md border border-[#30919D]/30 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#30919D]" />
                      <span className="text-xs font-bold text-[#30919D] uppercase tracking-wider">Premium Dashboard</span>
                    </div>
                    {stats.dayStreak > 0 && (
                      <div className="px-3 py-1 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{stats.dayStreak} Day Streak</span>
                      </div>
                    )}
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tighter"
                  >
                    Great to see you, <span className="text-[#30919D]">{user?.fullName?.split(' ')[0] || "Student"}</span>!
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/70 text-lg lg:text-xl font-medium mb-8 max-w-xl leading-relaxed"
                  >
                    Ready to master new skills today? Your next lesson is waiting for you in the <span className="text-white font-bold">SMAART Academy</span>.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap gap-4"
                  >
                    <button
                      onClick={() => navigate('/dashboard/courses')}
                      className="px-8 py-4 bg-[#30919D] hover:bg-[#287a84] text-white rounded-2xl font-bold shadow-lg shadow-[#30919D]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Resume Learning
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/skills-passport')}
                      className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                    >
                      Skills Passport
                    </button>
                  </motion.div>
                </div>

                {/* Floating Elements (Decoration) */}
                <div className="absolute top-1/2 right-10 -translate-y-1/2 hidden xl:block pointer-events-none">
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-64 h-64 rounded-3xl bg-gradient-to-br from-[#30919D]/20 to-transparent border border-white/10 backdrop-blur-[2px] flex items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)] opacity-5" />
                    <Target className="w-24 h-24 text-white/10" />
                  </motion.div>
                </div>
              </motion.section>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* LEFT: MAIN CONTENT (8 Cols) */}
                <div className="xl:col-span-8 space-y-8">

                  {/* --- PREMIUM STAT HOVER CARDS --- */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {dashboardLoading ? [1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />) : (
                      [
                        { label: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'blue', desc: 'Engaged tracks' },
                        { label: 'Completed', value: stats.completedModules, icon: CheckCircle2, color: 'emerald', desc: 'Milestones met' },
                        { label: 'SMAART Score', value: `${stats.baselineScore}%`, icon: Sparkles, color: 'amber', desc: 'Readiness index' },
                        { label: 'Achievements', value: stats.badgeCount, icon: Award, color: 'purple', desc: 'Badges earned' }
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i }}
                          whileHover={{ y: -5 }}
                          className="glass-card p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl group cursor-default"
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 
                            ${stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                              stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                                stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                                  'bg-purple-500/10 text-purple-500'}`}
                          >
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-black mb-1 group-hover:text-[#30919D] transition-colors">{stat.value}</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 font-medium italic">{stat.desc}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* --- BADGES & ACHIEVEMENTS SECTION --- */}
                  <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-[#002147] dark:text-white flex items-center gap-3">
                          Badges & Achievements
                          <span className="text-xs bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full uppercase font-bold tracking-widest">Uncovered</span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Your collection of earned credentials and milestones.</p>
                      </div>
                      <button
                        onClick={() => navigate('/dashboard/profile?tab=badges')}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-[#30919D]/10 hover:text-[#30919D] transition-all group"
                      >
                        <ArrowUpRight className="w-6 h-6 group-hover:rotate-45 transition-transform" />
                      </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                      {badgesLoading ? (
                        [1, 2, 3, 4].map(i => (
                          <div key={i} className="min-w-[160px] h-48 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                        ))
                      ) : earnedBadges.length > 0 ? (
                        earnedBadges.map((badge, idx) => (
                          <motion.div
                            key={badge._id || idx}
                            whileHover={{ y: -10, scale: 1.02 }}
                            onClick={() => openBadgeModal(badge)}
                            className="min-w-[180px] max-w-[180px] group cursor-pointer"
                          >
                            <div className={`relative aspect-square rounded-[2rem] p-5 flex flex-col items-center justify-center transition-all duration-500 
                              ${badge.tier === 'gold' ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30' :
                                badge.tier === 'silver' ? 'bg-gradient-to-br from-slate-400/20 to-gray-400/20 border-slate-400/30' :
                                  'bg-gradient-to-br from-bronze-500/20 to-orange-500/20 border-amber-800/30'} 
                              border backdrop-blur-sm shadow-xl group-hover:shadow-[0_20px_40px_rgba(48,145,157,0.15)] group-hover:border-[#30919D]/50`}
                            >
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-3 transition-transform group-hover:rotate-6 
                                ${badge.tier === 'gold' ? 'bg-amber-500 text-white shadow-amber-500/30' :
                                  badge.tier === 'silver' ? 'bg-slate-400 text-white shadow-slate-400/30' :
                                    'bg-amber-800 text-white shadow-amber-800/30'}`}
                              >
                                {badge.tier === 'gold' ? <Trophy size={32} /> : badge.tier === 'silver' ? <Medal size={32} /> : <Award size={32} />}
                              </div>
                              <h4 className="text-xs font-black text-center text-[#002147] dark:text-white uppercase leading-tight line-clamp-2">{badge.title}</h4>
                              <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-lg bg-[#30919D] text-white text-[9px] font-black uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                VIEW
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="w-full py-10 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                          <Medal className="w-12 h-12 text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-500">No badges earned yet</p>
                          <p className="text-xs text-slate-400 mt-1">Complete courses and assessments to unlock your first achievement!</p>
                        </div>
                      )}
                    </div>
                  </motion.section>

                  {/* --- CURRENT PROGRESS MODULE --- */}
                  <section className="glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#30919D]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
                      <div className="flex-1 space-y-6">
                        <div>
                          <h2 className="text-2xl font-black text-[#002147] dark:text-white mb-2 flex items-center gap-3">
                            Current Learning Journey
                            <span className="text-xs bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full uppercase font-bold tracking-widest">Ongoing</span>
                          </h2>
                          <p className="text-sm text-slate-500 dark:text-gray-400 max-w-lg font-medium leading-relaxed">
                            {enrolledCourses.length > 0
                              ? `You are making excellent progress in your current course. Focus on completing your daily modules to stay ahead.`
                              : "You haven't enrolled in any courses yet. Explore our structured pathways to start your journey."}
                          </p>
                        </div>

                        {enrolledCourses.length > 0 ? (
                          <div className="space-y-6">
                            <div className="flex items-center gap-6">
                              <div className="relative w-24 h-24">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-white/5" />
                                  <motion.circle
                                    cx="48" cy="48" r="40" stroke="#30919D" strokeWidth="8" fill="transparent"
                                    strokeDasharray={251.2}
                                    initial={{ strokeDashoffset: 251.2 }}
                                    animate={{ strokeDashoffset: 251.2 - (251.2 * (enrolledCourses[0].progress || 0)) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xl font-black text-[#002147] dark:text-white leading-none">{enrolledCourses[0].progress || 0}%</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Done</span>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-[#002147] dark:text-white mb-1">{enrolledCourses[0].course?.title}</h4>
                                <p className="text-xs text-slate-400 font-medium">{enrolledCourses[0].progress > 80 ? 'Almost finished!' : 'Keep going, you\'re doing great!'}</p>
                                <div className="flex gap-2 mt-3">
                                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-md">AI POWERED</span>
                                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[10px] font-bold rounded-md">PROFESSIONAL</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate('/dashboard/courses')}
                              className="px-6 py-3 bg-[#002147] dark:bg-white text-white dark:text-[#002147] rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group shadow-xl shadow-[#002147]/10"
                            >
                              Continue Session
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => navigate('/dashboard/courses')} className="px-6 py-3 bg-[#30919D] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#30919D]/20 transition-all hover:scale-105">Explore Catalog</button>
                        )}
                      </div>

                      <div className="w-full md:w-72 space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                          <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Weekly Goal</p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-[#002147] dark:text-white">{weeklyProgress}% Achieved</span>
                            <span className="text-xs text-slate-400">7.5h / 10h</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${weeklyProgress}%` }}
                              className="h-full bg-gradient-to-r from-[#30919D] to-[#40B5C4]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#30919D]/5 border border-[#30919D]/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#30919D] flex items-center justify-center text-white">
                              <Star className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-[#002147] dark:text-white">Daily Bonus XP</span>
                          </div>
                          <span className="text-xs font-black text-[#30919D]">+250</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* --- QUICK ACTIONS GRID --- */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Vision Boards', icon: Layout, color: 'text-pink-500', bg: 'bg-pink-500/10', path: '/dashboard/vision-boards' },
                      { label: 'Community', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/dashboard/community' },
                      { label: 'My Notes', icon: ClipboardCheck, color: 'text-teal-500', bg: 'bg-teal-500/10', path: '/dashboard/notes' },
                      { label: 'Library', icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10', path: '/dashboard/library' }
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(item.path)}
                        className="p-5 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-[#30919D]/40 transition-all group flex flex-col items-center gap-3 text-center shadow-lg hover:shadow-2xl"
                      >
                        <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                          <item.icon className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-black text-[#002147] dark:text-white uppercase tracking-tighter">{item.label}</span>
                      </button>
                    ))}
                  </div>

                </div>

                {/* RIGHT: SECONDARY CONTENT (4 Cols) */}
                <div className="xl:col-span-4 space-y-8">

                  {/* --- CALENDAR WIDGET --- */}
                  <div className="glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-black text-[#002147] dark:text-white">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Learning Schedule</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><ChevronLeft size={20} /></button>
                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><ChevronRight size={20} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-4">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-[10px] font-black text-slate-400 uppercase">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 31 }, (_, i) => i + 1).slice(0, new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()).map(day => {
                        const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        return (
                          <button
                            key={day}
                            onClick={() => setSelectedDate(date)}
                            className={`h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                              ${isSelected ? 'bg-[#30919D] text-white shadow-lg shadow-[#30919D]/30' :
                                isToday ? 'bg-[#002147] text-white dark:bg-white dark:text-[#002147]' :
                                  'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* --- UPCOMING DEADLINES --- */}
                  <div className="h-[450px]">
                    <UpcomingDeadlines
                      tasks={tasks}
                      onAddTask={handleAddTask}
                      onToggleTask={handleToggleTaskStatus}
                      onDeleteTask={handleDeleteTask}
                    />
                  </div>

                  {/* --- PREMIUM UPGRADE --- */}
                  <div className="bg-gradient-to-br from-[#002147] to-[#30919D] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-black mb-2 tracking-tighter">Become a Pro</h3>
                      <p className="text-white/70 text-sm mb-8 leading-relaxed">Get unlimited access to advanced simulations, global certifications, and personal coaching.</p>
                      <button className="w-full py-4 bg-white text-[#002147] rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl">Upgrade Account</button>
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
