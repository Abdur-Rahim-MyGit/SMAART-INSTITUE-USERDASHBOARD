import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconBook2 as BookOpen,
  IconAward as Award,
  IconTrophy as Trophy,
  IconMenu2 as Menu,
  IconX as X,
  IconBulb as Lightbulb,
  IconBolt as Zap,
  IconBrain as Brain,
  IconWallet as Wallet,
  IconLayoutDashboard as LayoutDashboard,
  IconSettings as Settings,
  IconHelpCircle as HelpCircle,
  IconBell as Bell,
  IconChecks as CheckCheck,
  IconSun as Sun,
  IconMoon as Moon,
  IconUsers as Users,
  IconClipboardCheck as ClipboardCheck,
  IconChevronDown as ChevronDown,
  IconLanguage as Languages,
  IconListCheck as ListTodo
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ProfileDropdown from "@/components/ProfileDropdown";
import ChatbotModal from "@/components/ChatbotModal";
import NotificationToast from "@/components/NotificationToast";
import useUser from "@/hooks/useUser";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { apiCall } from "@/services/api";
import blueLogo from "@/assets/blue.png";
import whiteLogo from "@/assets/white.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const menuItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "My Courses", path: "/dashboard/courses" },
  { icon: Brain, label: "Assessment Centre", path: "/dashboard/assessment-centre" },
  { icon: Lightbulb, label: "Vision Boards", path: "/dashboard/vision-boards" },
  { icon: Zap, label: "SMAART Toolkit", path: "/dashboard/smaart-toolkit" },
  { icon: Wallet, label: "Skills Vault", path: "/dashboard/skills-vault" },
  { icon: Users, label: "Community", path: "/dashboard/community" },
  { icon: ClipboardCheck, label: "My Notes", path: "/dashboard/notes" },
  { icon: ListTodo, label: "To-Do & Calendar", path: "/dashboard/todos" },
];

const bottomMenuItems = [
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notificationRef = useRef(null);

  const {
    notifications,
    unreadCount,
    wsStatus,
    markRead,
    markAllRead,
    refresh: refreshNotifications,
    fetchNotifications,
  } = useNotifications();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (notificationOpen) {
      setNotifLoading(true);
      fetchNotifications(1, false).finally(() => setNotifLoading(false));
    }
  }, [notificationOpen, fetchNotifications]);

  const wsStatusColor = wsStatus === 'connected' ? '#22c55e'
    : wsStatus === 'connecting' ? '#f59e0b'
      : '#ef4444';

  const generateTestNotification = async () => {
    try {
      const testTypes = [
        { type: 'badge', title: 'New Badge Earned!', message: 'Congratulations! You earned the Quick Learner badge.' },
        { type: 'assessment', title: 'Assessment Results Ready', message: 'Your Baseline Assessment results are available.' },
        { type: 'course', title: 'New Course Available', message: 'Check out Leadership Essentials, now available.' },
        { type: 'achievement', title: 'Level Up!', message: 'You reached Level 5. New avatar items unlocked.' },
        { type: 'system', title: 'Welcome!', message: 'Welcome to SMAART Institute! Start your learning journey today.' },
      ];
      const randomNotif = testTypes[Math.floor(Math.random() * testTypes.length)];

      const data = await apiCall('/notifications/test', {
        method: 'POST',
        body: JSON.stringify(randomNotif),
      });

      if (data.success && wsStatus !== 'connected') {
        refreshNotifications();
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeAgo = (date) => {
    const secs = Math.floor((Date.now() - new Date(date)) / 1000);
    if (secs < 60) return 'now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
    return `${Math.floor(secs / 86400)}d`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification._id);
    }

    setNotificationOpen(false);

    if (notification.link) {
      navigate(notification.link);
      return;
    }

    navigate('/notifications');
  };

  useEffect(() => {
    if (isMobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMobileOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[80] border-b border-slate-200/60 bg-white/95 shadow-md backdrop-blur-xl transition-colors duration-300 dark:border-[#1a3884]/20 dark:bg-[#002147]/98">
        <div className="flex h-18 items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <button
              className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-[#002A5C] lg:hidden"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X size={20} stroke={1.5} className="text-slate-600 dark:text-slate-300" /> : <Menu size={20} stroke={1.5} className="text-slate-600 dark:text-slate-300" />}
            </button>

            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center group">
                <div className="flex flex-col items-start transition-all duration-300">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black tracking-tighter text-[#1a3884] dark:text-white leading-none">
                      SMAART
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">
                    Institute
                  </span>
                </div>
              </Link>

              <div className="ml-2 hidden flex-col md:flex">
                <span className="text-xs font-semibold text-[#1a3884] dark:text-blue-400">
                  {formatTime(currentTime)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {getGreeting()}, {user?.firstName || user?.fullName?.split(' ')[0] || 'User'}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-2 px-4 lg:flex xl:gap-6">
            {[
              { label: 'Home', path: '/dashboard' },
              { label: 'Courses', path: '/dashboard/courses' },
              { label: 'Assessments', path: '/dashboard/assessment-centre' },
              { label: 'Vision Boards', path: '/dashboard/vision-boards' },
              { label: 'Toolkit', path: '/dashboard/smaart-toolkit' },
              { label: 'Skills Vault', path: '/dashboard/skills-vault' },
              { label: 'Wallet', path: '/dashboard/smaart-wallet' },
              { label: 'Help', path: null, isHelp: true },
            ].map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.label}
                  id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    if (item.isHelp) setIsChatbotOpen(true);
                    else if (item.path) navigate(item.path);
                  }}
                  className={`relative group py-1 text-[11px] font-bold whitespace-nowrap transition-all duration-200 xl:text-sm ${isActive
                    ? 'text-[#1a3884] dark:text-blue-300'
                    : 'text-slate-600 hover:text-[#1a3884] dark:text-slate-300 dark:hover:text-blue-300'
                    }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1a3884] dark:bg-blue-300"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2 xl:gap-3">
            <div
              title={`Notifications: ${wsStatus}`}
              className="hidden items-center gap-1.5 md:flex"
            >
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: wsStatusColor }}
              />
              <span className="text-[10px] text-slate-400" style={{ color: wsStatusColor }}>
                {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? '...' : 'Offline'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-[#1a3884] dark:text-slate-400 dark:hover:bg-[#002A5C] dark:hover:text-blue-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} stroke={1.5} /> : <Moon size={20} stroke={1.5} />}
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="group/nav relative mr-1 rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-[#1a3884] dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              >
                <Bell size={20} stroke={1.5} className="group-hover/nav:animate-bounce" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white dark:border-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -right-12 mt-2 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#002147] sm:right-0 sm:w-96"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Bell size={20} stroke={1.5} className="text-white" />
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs text-white">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-white/80 hover:text-white" title="Mark all read">
                            <CheckCheck size={16} stroke={1.5} />
                          </button>
                        )}
                        <button onClick={() => setNotificationOpen(false)} className="text-white/80 hover:text-white">
                          <X size={16} stroke={1.5} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto bg-white dark:bg-[#002147]">
                      {notifLoading ? (
                        <div className="flex justify-center py-10">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3884] border-t-transparent" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center px-4 py-10 text-center">
                          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#002A5C]">
                            <Bell size={28} stroke={1.5} className="text-slate-400" />
                          </div>
                          <p className="font-medium text-slate-500 dark:text-slate-400">No notifications yet</p>
                          <button
                            onClick={generateTestNotification}
                            className="mt-4 rounded-lg bg-[#1a3884] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#112558]"
                          >
                            Generate Test Notification
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {notifications.map((notification) => (
                            <div
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            >
                              <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: `${notification.color || '#2563EB'}20` }}
                              >
                                <Bell size={20} stroke={1.5} style={{ color: notification.color || '#2563EB' }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between">
                                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{notification.title}</p>
                                  <span className="ml-2 text-xs text-slate-400">{timeAgo(notification.createdAt)}</span>
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{notification.message}</p>
                              </div>
                              {!notification.isRead && <div className="mt-2 h-2 w-2 rounded-full bg-blue-400" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 bg-[#F8FAFC] px-4 py-3 dark:border-white/10 dark:bg-[#002A5C]">
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setNotificationOpen(false);
                        }}
                        className="w-full text-center text-sm font-medium text-[#1a3884] hover:text-[#112558]"
                      >
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div id="nav-profile">
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 z-[100] flex h-screen w-[280px] flex-col border-r border-slate-100 bg-white shadow-2xl dark:border-[#1a3884]/15 dark:bg-[#002147] lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-[#1a3884]/15">
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center group" onClick={() => setIsMobileOpen(false)}>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-black tracking-tighter text-[#1a3884] dark:text-white leading-none">
                        SMAART
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                      Institute
                    </span>
                  </div>
                </Link>

                {user?.college?.logo && (
                  <div className="ml-1 flex items-center gap-2">
                    <div className="mx-1 h-5 w-[1px] bg-slate-200 dark:bg-[#003170]" />
                    <div className="flex h-8 w-auto items-center justify-center transition-all duration-300">
                      <img
                        src={user.college.logo.startsWith('http') ? user.college.logo : `${API_BASE_URL.replace('/api', '')}/${user.college.logo}`}
                        alt={user.college.collegeName || "College Logo"}
                        className="h-7 w-auto object-contain"
                      />
                    </div>
                  </div>
                )}

                {!user?.college?.logo && (
                  <div className="flex flex-col items-start ml-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black tracking-tighter text-[#1a3884] dark:text-white leading-none">
                        SMAART
                      </span>
                      <div className="w-1 h-1 rounded-full bg-[#C0C0C0]" />
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                      Institute
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-[#002A5C]"
              >
                <X size={20} stroke={1.5} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                          ? 'bg-[#1a3884] text-white shadow-lg shadow-[#1a3884]/30'
                          : 'text-slate-600 hover:bg-[#F8FAFC] dark:text-slate-400 dark:hover:bg-[#002A5C]'
                          }`}
                      >
                        <Icon size={20} stroke={1.5} className={`${isActive ? 'text-white' : 'text-[#1a3884]'}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-slate-100 p-3 dark:border-[#1a3884]/15">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition-colors hover:bg-[#F8FAFC] dark:text-slate-400 dark:hover:bg-[#002A5C]"
              >
                {theme === 'dark' ? <Sun size={20} stroke={1.5} className="text-yellow-500" /> : <Moon size={20} stroke={1.5} className="text-[#1a3884]" />}
                <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Languages size={20} stroke={1.5} className="text-[#1a3884] dark:text-blue-400" />
                  <span className="font-medium">Language</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    {i18n.language === 'en' ? 'EN' : i18n.language === 'hi' ? 'HI' : i18n.language === 'ta' ? 'TA' : i18n.language === 'ur' ? 'UR' : i18n.language === 'fr' ? 'FR' : i18n.language.toUpperCase()}
                  </span>
                  <ChevronDown size={16} stroke={1.5} className={`text-slate-400 transition-transform duration-200 ${showLanguages ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {showLanguages && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 px-2 space-y-1"
                  >
                    {[
                      { code: 'en', name: 'English' },
                      { code: 'hi', name: 'Hindi (हिन्दी)' },
                      { code: 'ta', name: 'Tamil (தமிழ்)' },
                      { code: 'te', name: 'Telugu (తెలుగు)' },
                      { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
                      { code: 'ml', name: 'Malayalam (മലയാളം)' },
                      { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
                      { code: 'ur', name: 'Urdu (اردو)' },
                      { code: 'fr', name: 'French (Français)' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setShowLanguages(false);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${i18n.language === lang.code
                            ? 'bg-[#1a3884] text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                      >
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-3">
              <Link
                to="/dashboard/skills-passport"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #C0C0C0 100%)',
                }}
              >
                <Award size={20} stroke={1.5} className="text-slate-900" />
                <span className="font-bold text-slate-900">Skills Passport</span>
              </Link>
            </div>

            <div className="space-y-1 border-t border-slate-100 bg-[#F8FAFC] p-3 dark:border-[#1a3884]/15 dark:bg-[#001A38]">
              {bottomMenuItems.map((item) => {
                const Icon = item.icon;
                const isHelpButton = item.label === 'Help';

                if (isHelpButton) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setIsMobileOpen(false);
                        setIsChatbotOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-slate-500 transition-all hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-[#002A5C] dark:hover:text-slate-200"
                    >
                      <Icon size={20} stroke={1.5} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-slate-500 transition-all hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-[#002A5C] dark:hover:text-slate-200"
                  >
                    <Icon size={20} stroke={1.5} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="h-[72px]" />

      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onEscalateToTicket={(conversationId, messages) => {
          navigate('/dashboard/support', {
            state: { conversationId, messages }
          });
        }}
      />

      <NotificationToast />
    </>
  );
};

export default DashboardSidebar;
