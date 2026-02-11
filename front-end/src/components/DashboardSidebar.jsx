import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Award,
  Menu,
  X,
  Lightbulb,
  Zap,
  Home,
  Settings,
  HelpCircle,
  Bell,
  ShieldCheck,
  CheckCheck,
  Sun,
  Moon,
  Users,
  ClipboardCheck
} from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";
import InteractiveMenu from "@/components/InteractiveMenu";
import ChatbotModal from "@/components/ChatbotModal";
import { useTheme } from "@/contexts/ThemeContext";
import blueLogo from "@/assets/blue.png";
import whiteLogo from "@/assets/white.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const menuItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "My Courses", path: "/dashboard/courses" },
  { icon: Lightbulb, label: "Vision Boards", path: "/dashboard/vision-boards" },
  { icon: Zap, label: "SMAART Toolkit", path: "/dashboard/smaart-toolkit" },
  { icon: Award, label: "My Certificate", path: "/dashboard/certificate" },
  { icon: ShieldCheck, label: "Verify Certificate", path: "/verify-certificate" },
  { icon: Users, label: "Community", path: "/dashboard/community" },
  { icon: ClipboardCheck, label: "My Notes", path: "/dashboard/notes" },
];

const bottomMenuItems = [
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help" }, // No path - opens chatbot modal
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notificationRef = useRef(null);

  // Auth headers
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications?limit=10`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Fetch on dropdown open
  useEffect(() => {
    if (notificationOpen) {
      fetchNotifications();
    }
  }, [notificationOpen, fetchNotifications]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate test notification
  const generateTestNotification = async () => {
    try {
      const testTypes = [
        { type: 'badge', title: '🏆 New Badge Earned!', message: 'Congratulations! You earned the "Quick Learner" badge.' },
        { type: 'assessment', title: '📊 Assessment Results Ready', message: 'Your Baseline Assessment results are available.' },
        { type: 'course', title: '📚 New Course Available', message: 'Check out "Leadership Essentials" - now available!' },
        { type: 'achievement', title: '🎉 Level Up!', message: 'You reached Level 5! New avatar items unlocked.' },
        { type: 'system', title: '👋 Welcome!', message: 'Welcome to SMAART Institute! Start your learning journey today.' }
      ];
      const randomNotif = testTypes[Math.floor(Math.random() * testTypes.length)];

      const response = await fetch(`${API_BASE_URL}/notifications/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(randomNotif)
      });
      const data = await response.json();

      if (data.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error creating test notification:', err);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read
  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Time ago formatter
  const timeAgo = (date) => {
    const secs = Math.floor((Date.now() - new Date(date)) / 1000);
    if (secs < 60) return 'now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
    return `${Math.floor(secs / 86400)}d`;
  };

  // Prevent background scroll when mobile drawer is open
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
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/10 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between px-6 lg:px-10 h-16">


          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
            </button>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-auto flex items-center justify-center transition-all duration-300">
                <img
                  src={theme === 'dark' ? whiteLogo : blueLogo}
                  alt="SMAART Institute"
                  className="h-10 w-auto object-contain"
                />
              </div>

            </Link>
          </div>

          {/* Center: Desktop Navigation Menu */}
          <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {[
              { label: 'Home', path: '/dashboard' },
              { label: 'My Courses', path: '/dashboard/courses' },
              { label: 'Vision Boards', path: '/dashboard/vision-boards' },
              { label: 'Toolkit', path: '/dashboard/smaart-toolkit' },
              { label: 'Certificates', path: '/dashboard/certificate' },
              { label: 'Verify', path: '/verify-certificate' }
            ].map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-bold transition-all duration-200 relative group py-1 ${isActive
                    ? 'text-[#30919D]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#30919D] dark:hover:text-[#30919D]'
                    }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#30919D] rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 mr-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all relative group/nav"
              >
                <Bell className="w-5 h-5 group-hover/nav:animate-bounce" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    style={{ zIndex: 9999 }}
                  >
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-white" />
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-white/80 hover:text-white" title="Mark all read">
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setNotificationOpen(false)} className="text-white/80 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[350px] overflow-y-auto bg-white dark:bg-slate-900">
                      {notifLoading ? (
                        <div className="flex justify-center py-10">
                          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center py-10 text-center px-4">
                          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                            <Bell className="w-7 h-7 text-slate-400" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                          <button
                            onClick={generateTestNotification}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Generate Test Notification
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                if (n.link) navigate(n.link);
                                setNotificationOpen(false);
                              }}
                              className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            >
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${n.color || '#2563EB'}20` }}
                              >
                                <Bell className="w-5 h-5" style={{ color: n.color || '#2563EB' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{n.title}</p>
                                  <span className="text-xs text-slate-400 ml-2">{timeAgo(n.createdAt)}</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                              </div>
                              {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setNotificationOpen(false);
                        }}
                        className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-screen w-[280px] flex flex-col z-50 lg:hidden bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-2xl"
          >
            {/* Mobile Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                <img
                  src={theme === 'dark' ? whiteLogo : blueLogo}
                  alt="SMAART Institute"
                  className="h-9 w-auto object-contain"
                />
                <span className="font-bold text-lg text-slate-900 dark:text-white">
                  SMAART<span className="text-blue-600"> Institute</span>
                </span>
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
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
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Theme Toggle */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
                <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>

            {/* Mobile Skills Passport */}
            <div className="p-3">
              <Link
                to="/dashboard/skills-passport"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #daa520 0%, #b8860b 50%, #daa520 100%)',
                }}
              >
                <Award className="w-5 h-5 text-slate-900" />
                <span className="font-bold text-slate-900">Skills Passport</span>
              </Link>
            </div>

            {/* Mobile Bottom */}
            <div className="p-3 space-y-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
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
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all w-full"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="h-16" />

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onEscalateToTicket={(conversationId, messages) => {
          navigate('/dashboard/support', {
            state: { conversationId, messages }
          });
        }}
      />
    </>
  );
};

export default DashboardSidebar;
